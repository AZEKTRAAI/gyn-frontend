// Admin users against a real database: the last-Super-Administrator rule, sessions ending, password changes and the audit trail.
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import {
  AdminUserError,
  changeOwnPassword,
  createAdminUser,
  listAuditLog,
  resetUserPassword,
  setUserActive,
  setUserRole,
} from "@gyn/core/admin-users";
import { seedRoles } from "@gyn/core/access-seed";
import { hashPassword, verifyPassword } from "@gyn/core/password";
import { closeDb, prisma, resetDb } from "./helpers.ts";

beforeEach(async () => {
  await resetDb();
  await seedRoles(prisma);
});
after(closeDb);

const ip = "127.0.0.1";
async function person(email: string, role: string, password = "an old password 1") {
  const r = await prisma.role.findUniqueOrThrow({ where: { name: role } });
  const u = await prisma.user.create({ data: { email, name: email.split("@")[0], roleId: r.id, passwordHash: await hashPassword(password) } });
  return { user: u, actor: { id: u.id, email: u.email, ip } };
}
const session = (userId: string, token: string) => prisma.session.create({ data: { userId, tokenHash: token, expiresAt: new Date(Date.now() + 3_600_000) } });
const codeOf = (code: string) => (e: unknown) => e instanceof AdminUserError && e.code === code;

test("creating a user stores a hash, flags the temporary password and audits without the password", async () => {
  const boss = await person("boss@x.test", "Super Administrator");
  const { id, temporaryPassword } = await createAdminUser(prisma, { name: "Sara", email: " Sara@X.test ", role: "Viewer" }, boss.actor);
  const row = await prisma.user.findUniqueOrThrow({ where: { id }, include: { role: true } });
  assert.equal(row.email, "sara@x.test");
  assert.equal(row.role.name, "Viewer");
  assert.ok(row.mustChangePassword);
  assert.ok(await verifyPassword(temporaryPassword, row.passwordHash));
  await assert.rejects(createAdminUser(prisma, { name: "Sara 2", email: "sara@x.test", role: "Viewer" }, boss.actor), codeOf("EMAIL_TAKEN"));
  await assert.rejects(createAdminUser(prisma, { name: "X", email: "x@x.test", role: "Root" }, boss.actor), codeOf("INVALID"));
  const log = await prisma.auditLog.findMany({ where: { action: "USER_CREATED" } });
  assert.equal(log.length, 1);
  assert.equal(log[0].userId, boss.user.id);
  assert.ok(!JSON.stringify(log).includes(temporaryPassword));
  assert.ok(!JSON.stringify(log).includes("scrypt"));
});

test("deactivating ends that user's sessions, leaves others alone, and is audited with old and new values", async () => {
  const boss = await person("boss@x.test", "Super Administrator");
  const v = await person("v@x.test", "Viewer");
  await session(v.user.id, "v1");
  await session(v.user.id, "v2");
  await session(boss.user.id, "b1");
  await setUserActive(prisma, v.user.id, false, boss.actor);
  assert.equal(await prisma.session.count({ where: { userId: v.user.id } }), 0);
  assert.equal(await prisma.session.count({ where: { userId: boss.user.id } }), 1);
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: v.user.id } })).active, false);
  await setUserActive(prisma, v.user.id, true, boss.actor);
  const log = await prisma.auditLog.findMany({ where: { action: { in: ["USER_DEACTIVATED", "USER_REACTIVATED"] } }, orderBy: { createdAt: "asc" } });
  assert.deepEqual(log.map((l) => l.action), ["USER_DEACTIVATED", "USER_REACTIVATED"]);
  assert.equal((log[0].oldValue as { active: boolean }).active, true);
  assert.equal((log[0].newValue as { active: boolean }).active, false);
});

test("nobody deactivates themselves, and the last active Super Administrator stays", async () => {
  const a = await person("a@x.test", "Super Administrator");
  await assert.rejects(setUserActive(prisma, a.user.id, false, a.actor), codeOf("RULE"));
  await assert.rejects(setUserRole(prisma, a.user.id, "Viewer", a.actor), codeOf("RULE"));
  const b = await person("b@x.test", "Super Administrator");
  await setUserActive(prisma, b.user.id, false, a.actor);
  // b is inactive, so a is still the last active one even though two Super Administrators exist.
  const viewer = await person("v@x.test", "Viewer");
  await assert.rejects(setUserRole(prisma, a.user.id, "Viewer", viewer.actor), codeOf("RULE"));
  await setUserActive(prisma, b.user.id, true, a.actor);
  await setUserRole(prisma, b.user.id, "Viewer", a.actor);
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: b.user.id }, include: { role: true } })).role.name, "Viewer");
  assert.equal(await prisma.auditLog.count({ where: { action: "USER_ROLE_CHANGED" } }), 1);
});

test("two Super Administrators cannot remove each other at the same moment", async () => {
  const a = await person("a@x.test", "Super Administrator");
  const b = await person("b@x.test", "Super Administrator");
  const results = await Promise.allSettled([setUserActive(prisma, a.user.id, false, b.actor), setUserActive(prisma, b.user.id, false, a.actor)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(await prisma.user.count({ where: { active: true } }), 1);
});

test("a temporary password replaces the old one, ends sessions and clears a lockout", async () => {
  const boss = await person("boss@x.test", "Super Administrator");
  const v = await person("v@x.test", "Viewer");
  await prisma.user.update({ where: { id: v.user.id }, data: { lockedUntil: new Date(Date.now() + 600_000), failedLogins: 3 } });
  await session(v.user.id, "v1");
  await assert.rejects(resetUserPassword(prisma, boss.user.id, boss.actor), codeOf("RULE"));
  const { temporaryPassword } = await resetUserPassword(prisma, v.user.id, boss.actor);
  const row = await prisma.user.findUniqueOrThrow({ where: { id: v.user.id } });
  assert.ok(await verifyPassword(temporaryPassword, row.passwordHash));
  assert.ok(!(await verifyPassword("an old password 1", row.passwordHash)));
  assert.equal(row.lockedUntil, null);
  assert.ok(row.mustChangePassword);
  assert.equal(await prisma.session.count({ where: { userId: v.user.id } }), 0);
  assert.ok(!JSON.stringify(await prisma.auditLog.findMany()).includes(temporaryPassword));
});

test("changing your own password checks the current one and ends only your other sessions", async () => {
  const me = await person("me@x.test", "Viewer");
  const other = await person("other@x.test", "Viewer");
  const mine = await session(me.user.id, "m1");
  await session(me.user.id, "m2");
  await session(other.user.id, "o1");
  const base = { userId: me.user.id, sessionId: mine.id };
  await assert.rejects(changeOwnPassword(prisma, { ...base, current: "not my password!", next: "a brand new passphrase", confirm: "a brand new passphrase" }, me.actor), codeOf("WRONG_PASSWORD"));
  await assert.rejects(changeOwnPassword(prisma, { ...base, current: "an old password 1", next: "an old password 1", confirm: "an old password 1" }, me.actor), codeOf("INVALID"));
  await assert.rejects(changeOwnPassword(prisma, { ...base, current: "an old password 1", next: "short", confirm: "short" }, me.actor), codeOf("INVALID"));
  assert.equal(await prisma.session.count({ where: { userId: me.user.id } }), 2, "failed attempts end nothing");

  const res = await changeOwnPassword(prisma, { ...base, current: "an old password 1", next: "a brand new passphrase", confirm: "a brand new passphrase" }, me.actor);
  assert.equal(res.otherSessionsEnded, 1);
  assert.deepEqual((await prisma.session.findMany({ where: { userId: me.user.id } })).map((s) => s.id), [mine.id]);
  assert.equal(await prisma.session.count({ where: { userId: other.user.id } }), 1);
  assert.ok(await verifyPassword("a brand new passphrase", (await prisma.user.findUniqueOrThrow({ where: { id: me.user.id } })).passwordHash));
  assert.equal(await prisma.auditLog.count({ where: { action: "PASSWORD_CHANGED" } }), 1);
  assert.equal(await prisma.auditLog.count({ where: { action: "PASSWORD_CHANGE_FAILED" } }), 1);
  const dump = JSON.stringify(await prisma.auditLog.findMany());
  assert.ok(!dump.includes("a brand new passphrase") && !dump.includes("an old password 1") && !dump.includes("scrypt$"));
});

test("the audit viewer filters, pages 50 at a time, newest first, and hides secrets", async () => {
  const boss = await person("boss@x.test", "Super Administrator");
  const v = await person("v@x.test", "Viewer");
  const t0 = Date.parse("2026-01-01T12:00:00Z");
  await prisma.auditLog.createMany({
    data: Array.from({ length: 120 }, (_, i) => ({
      userId: i % 2 ? boss.user.id : v.user.id,
      userEmail: i % 2 ? "boss@x.test" : "v@x.test",
      action: i % 3 ? "LOGIN" : "EVENT_UPDATED",
      entityType: i % 3 ? "User" : "Event",
      entityId: String(i),
      newValue: { n: i, passwordHash: "scrypt$leak" },
      createdAt: new Date(t0 + i * 3_600_000),
    })),
  });
  const first = await listAuditLog(prisma, {}, 0);
  assert.equal(first.rows.length, 50);
  assert.ok(first.more);
  assert.equal(first.rows[0].entityId, "119");
  assert.ok(!JSON.stringify(first.rows).includes("leak"));
  assert.equal((await listAuditLog(prisma, {}, 2)).rows.length, 20);
  assert.ok(!(await listAuditLog(prisma, {}, 2)).more);
  const events = await listAuditLog(prisma, { entityType: "Event", userId: boss.user.id }, 0);
  assert.ok(events.rows.every((r) => r.entityType === "Event" && r.userEmail === "boss@x.test"));
  const day = await listAuditLog(prisma, { from: "2026-01-02", to: "2026-01-02" }, 0);
  assert.ok(day.rows.length > 0 && day.rows.every((r) => r.createdAt.toISOString().startsWith("2026-01-02")));
});
