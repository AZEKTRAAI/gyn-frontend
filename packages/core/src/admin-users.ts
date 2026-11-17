// Admin user management (SRS section 7): create users, change roles, deactivate and reactivate, temporary passwords, and
// a signed-in admin changing their own password. Every change writes its audit row in the same transaction.
// Audit rows hold names, emails, roles and flags. A password or hash is never put in one (redactAudit is a second safety net for the viewer).

import { randomInt } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { hashPassword, passwordProblem, verifyPassword } from "./password.ts";
import { ROLES } from "./permissions.ts";

export type AdminUserErrorCode = "INVALID" | "NOT_FOUND" | "EMAIL_TAKEN" | "RULE" | "WRONG_PASSWORD";
export class AdminUserError extends Error {
  readonly code: AdminUserErrorCode;
  constructor(code: AdminUserErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface Actor {
  id: string;
  email: string;
  ip: string | null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---------------------------------------------------------------------------
// Pure rules (unit tested)
// ---------------------------------------------------------------------------

export function validateNewUser(input: { name: string; email: string; role: string }): string | null {
  const name = input.name?.trim() ?? "";
  if (!name) return "Enter the person's name.";
  if (name.length > 120) return "The name is too long.";
  const email = input.email?.trim() ?? "";
  if (!EMAIL.test(email) || email.length > 200) return "Enter a valid email address.";
  if (!ROLES.some((r) => r.name === input.role)) return "Choose one of the roles.";
  return null;
}

// No 0/O/1/l/I so it can be read out or typed from a screen without mistakes.
const TEMP_ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateTemporaryPassword(): string {
  let out = "";
  for (let i = 0; i < 16; i++) out += TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)];
  return out;
}

export interface UserChange {
  actorId: string;
  targetId: string;
  /** The target is an active user whose role grants everything. */
  targetIsActiveSuper: boolean;
  activeSuperAdmins: number;
  deactivate: boolean;
  /** The change moves the target out of a role that grants everything. */
  demote: boolean;
}

/** Returns why a change is not allowed, or null. */
export function userChangeProblem(c: UserChange): string | null {
  if (c.deactivate && c.actorId === c.targetId) return "You cannot deactivate your own account. Ask another Super Administrator.";
  if ((c.deactivate || c.demote) && c.targetIsActiveSuper && c.activeSuperAdmins <= 1) {
    return "There must always be one active Super Administrator. Make someone else a Super Administrator first.";
  }
  return null;
}

export function newPasswordProblem(current: string, next: string, confirm: string): string | null {
  if (!current) return "Enter your current password.";
  const p = passwordProblem(next);
  if (p) return p;
  if (next === current) return "The new password must be different from the current one.";
  if (next !== confirm) return "The two new passwords do not match.";
  return null;
}

const SECRET_KEY = /pass(word)?|hash|secret|token|totp|recovery/i;
/** Replaces the value of anything that looks like a secret, at any depth. Applied when the audit log is shown. */
export function redactAudit(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAudit);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SECRET_KEY.test(k) ? "[hidden]" : redactAudit(v)]));
  }
  return value;
}

// ---------------------------------------------------------------------------
// Database operations
// ---------------------------------------------------------------------------

type Tx = Prisma.TransactionClient;
const LOCK_KEY = 4242001;

const audit = (tx: Tx, actor: Actor, action: string, entityId: string, oldValue: Prisma.InputJsonValue | null, newValue: Prisma.InputJsonValue | null) =>
  tx.auditLog.create({
    data: {
      userId: actor.id,
      userEmail: actor.email,
      action,
      entityType: "User",
      entityId,
      ip: actor.ip,
      ...(oldValue ? { oldValue } : {}),
      ...(newValue ? { newValue } : {}),
    },
  });

/** Serialises the changes that could remove the last Super Administrator, so two at once cannot both pass the check. */
async function lockSuperAdmins(tx: Tx): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_KEY})`;
}

async function loadTarget(tx: Tx, id: string) {
  const user = await tx.user.findUnique({ where: { id }, include: { role: true } });
  if (!user) throw new AdminUserError("NOT_FOUND", "That user no longer exists.");
  return user;
}

const grantsAll = (permissions: string[]) => permissions.includes("*");

export async function createAdminUser(
  prisma: PrismaClient,
  input: { name: string; email: string; role: string },
  actor: Actor,
): Promise<{ id: string; temporaryPassword: string }> {
  const problem = validateNewUser(input);
  if (problem) throw new AdminUserError("INVALID", problem);
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  return prisma.$transaction(async (tx) => {
    const role = await tx.role.findUnique({ where: { name: input.role } });
    if (!role) throw new AdminUserError("INVALID", "That role does not exist. Run the seed.");
    if (await tx.user.findUnique({ where: { email } })) throw new AdminUserError("EMAIL_TAKEN", "Someone already has an account with that email.");
    const user = await tx.user.create({ data: { email, name, roleId: role.id, passwordHash, mustChangePassword: true } });
    await audit(tx, actor, "USER_CREATED", user.id, null, { email, name, role: role.name, active: true });
    return { id: user.id, temporaryPassword };
  });
}

export async function setUserRole(prisma: PrismaClient, userId: string, roleName: string, actor: Actor): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await lockSuperAdmins(tx);
    const user = await loadTarget(tx, userId);
    const role = await tx.role.findUnique({ where: { name: roleName } });
    if (!role) throw new AdminUserError("INVALID", "Choose one of the roles.");
    if (role.id === user.roleId) return;
    const problem = userChangeProblem({
      actorId: actor.id,
      targetId: userId,
      targetIsActiveSuper: user.active && grantsAll(user.role.permissions),
      activeSuperAdmins: await tx.user.count({ where: { active: true, role: { permissions: { has: "*" } } } }),
      deactivate: false,
      demote: grantsAll(user.role.permissions) && !grantsAll(role.permissions),
    });
    if (problem) throw new AdminUserError("RULE", problem);
    await tx.user.update({ where: { id: userId }, data: { roleId: role.id } });
    await audit(tx, actor, "USER_ROLE_CHANGED", userId, { role: user.role.name, email: user.email }, { role: role.name, email: user.email });
  });
}

export async function setUserActive(prisma: PrismaClient, userId: string, active: boolean, actor: Actor): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await lockSuperAdmins(tx);
    const user = await loadTarget(tx, userId);
    if (user.active === active) return;
    if (!active) {
      const problem = userChangeProblem({
        actorId: actor.id,
        targetId: userId,
        targetIsActiveSuper: grantsAll(user.role.permissions),
        activeSuperAdmins: await tx.user.count({ where: { active: true, role: { permissions: { has: "*" } } } }),
        deactivate: true,
        demote: false,
      });
      if (problem) throw new AdminUserError("RULE", problem);
    }
    await tx.user.update({ where: { id: userId }, data: { active, ...(active ? { failedLogins: 0, lockedUntil: null } : {}) } });
    // Ending the sessions is what makes a deactivation immediate; getSession also refuses inactive users as a second check.
    if (!active) await tx.session.deleteMany({ where: { userId } });
    await audit(tx, actor, active ? "USER_REACTIVATED" : "USER_DEACTIVATED", userId, { active: user.active, email: user.email }, { active, email: user.email });
  });
}

/** A Super Administrator sets a new temporary password for someone who forgot theirs. Ends all of that person's sessions and clears a lockout. */
export async function resetUserPassword(prisma: PrismaClient, userId: string, actor: Actor): Promise<{ temporaryPassword: string }> {
  if (userId === actor.id) throw new AdminUserError("RULE", "Use Change password for your own account.");
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  await prisma.$transaction(async (tx) => {
    const user = await loadTarget(tx, userId);
    await tx.user.update({ where: { id: userId }, data: { passwordHash, mustChangePassword: true, failedLogins: 0, lockedUntil: null } });
    await tx.session.deleteMany({ where: { userId } });
    await audit(tx, actor, "USER_PASSWORD_RESET", userId, null, { email: user.email, mustChangePassword: true });
  });
  return { temporaryPassword };
}

/** The signed-in admin changes their own password. Every other session of theirs is ended; this one stays. */
export async function changeOwnPassword(
  prisma: PrismaClient,
  input: { userId: string; sessionId: string; current: string; next: string; confirm: string },
  actor: Actor,
): Promise<{ otherSessionsEnded: number }> {
  const problem = newPasswordProblem(input.current, input.next, input.confirm);
  if (problem) throw new AdminUserError("INVALID", problem);
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user || !user.active) throw new AdminUserError("NOT_FOUND", "Your account is no longer active.");
  if (!(await verifyPassword(input.current, user.passwordHash))) {
    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, action: "PASSWORD_CHANGE_FAILED", entityType: "User", entityId: user.id, ip: actor.ip },
    });
    throw new AdminUserError("WRONG_PASSWORD", "Your current password is not right.");
  }
  const passwordHash = await hashPassword(input.next);
  return prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false, failedLogins: 0, lockedUntil: null } });
    const ended = await tx.session.deleteMany({ where: { userId: user.id, id: { not: input.sessionId } } });
    await audit(tx, actor, "PASSWORD_CHANGED", user.id, null, { email: user.email, otherSessionsEnded: ended.count });
    return { otherSessionsEnded: ended.count };
  });
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export const AUDIT_PAGE_SIZE = 50;

export interface AuditFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  /** Inclusive calendar days in UTC, "YYYY-MM-DD". */
  from?: string;
  to?: string;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const startOfDay = (s: string) => new Date(`${s}T00:00:00.000Z`);

export function auditWhere(f: AuditFilters): Prisma.AuditLogWhereInput {
  const createdAt: Prisma.DateTimeFilter = {};
  if (f.from && DAY.test(f.from) && !Number.isNaN(startOfDay(f.from).getTime())) createdAt.gte = startOfDay(f.from);
  if (f.to && DAY.test(f.to) && !Number.isNaN(startOfDay(f.to).getTime())) createdAt.lt = new Date(startOfDay(f.to).getTime() + 86_400_000);
  return {
    ...(f.userId ? { userId: f.userId } : {}),
    ...(f.action ? { action: f.action } : {}),
    ...(f.entityType ? { entityType: f.entityType } : {}),
    ...(createdAt.gte || createdAt.lt ? { createdAt } : {}),
  };
}

export interface AuditRow {
  id: string;
  createdAt: Date;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  ip: string | null;
  oldValue: unknown;
  newValue: unknown;
  meta: unknown;
}

/** Newest first, 50 per page (page is 0-based). `more` says whether an older page exists. Secrets are redacted. */
export async function listAuditLog(prisma: PrismaClient, filters: AuditFilters, page: number): Promise<{ rows: AuditRow[]; more: boolean }> {
  const skip = Math.max(0, Math.floor(page)) * AUDIT_PAGE_SIZE;
  const found = await prisma.auditLog.findMany({
    where: auditWhere(filters),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip,
    take: AUDIT_PAGE_SIZE + 1,
  });
  return {
    more: found.length > AUDIT_PAGE_SIZE,
    rows: found.slice(0, AUDIT_PAGE_SIZE).map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      userEmail: r.userEmail,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      ip: r.ip,
      oldValue: redactAudit(r.oldValue),
      newValue: redactAudit(r.newValue),
      meta: redactAudit(r.meta),
    })),
  };
}
