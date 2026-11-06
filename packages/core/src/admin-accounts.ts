// Creates the first real admin accounts from environment variables (ADMIN_1_EMAIL, ADMIN_1_NAME, ADMIN_1_ROLE, ADMIN_1_PASSWORD,
// then ADMIN_2_..., up to ADMIN_10_...). Used once by `prisma/create-admins.ts`, with the values typed into first-admins.env.
// An account that already exists is left alone: this never overwrites a password someone chose.

import type { PrismaClient } from "@prisma/client";
import { hashPassword, passwordProblem } from "./password.ts";
import { ROLES } from "./permissions.ts";

export const MAX_ADMIN_SLOTS = 10;

export interface AdminAccountInput {
  slot: number;
  email: string;
  name: string;
  role: string;
  password: string;
}

const DEFAULT_ROLE = "Super Administrator";

/** Reads the numbered ADMIN_n_* variables. A slot with nothing filled in is skipped; a half-filled slot is an error. */
export function parseAdminAccounts(env: Record<string, string | undefined>): { accounts: AdminAccountInput[]; errors: string[] } {
  const accounts: AdminAccountInput[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (let slot = 1; slot <= MAX_ADMIN_SLOTS; slot++) {
    const get = (field: string) => (env[`ADMIN_${slot}_${field}`] ?? "").trim();
    const email = get("EMAIL").toLowerCase();
    const name = get("NAME");
    const roleRaw = get("ROLE");
    const password = (env[`ADMIN_${slot}_PASSWORD`] ?? "").replace(/\r?\n$/, "");
    if (!email && !name && !password) continue;

    const label = `ADMIN_${slot}`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.push(`${label}_EMAIL: enter a valid email address.`);
    else if (email.endsWith("@gyn.test")) errors.push(`${label}_EMAIL: @gyn.test addresses are the demo accounts. Use a real address.`);
    else if (seen.has(email)) errors.push(`${label}_EMAIL: ${email} is already used by another slot.`);
    seen.add(email);
    if (!name) errors.push(`${label}_NAME: enter the person's name.`);

    const role = roleRaw ? ROLES.find((r) => r.name.toLowerCase() === roleRaw.toLowerCase()) : ROLES.find((r) => r.name === DEFAULT_ROLE);
    if (!role) errors.push(`${label}_ROLE: "${roleRaw}" is not a role. Use one of: ${ROLES.map((r) => r.name).join(", ")}.`);

    const problem = passwordProblem(password);
    if (problem) errors.push(`${label}_PASSWORD: ${problem}`);
    else if (password.toLowerCase().includes("replace") || password.toLowerCase() === email) errors.push(`${label}_PASSWORD: choose a real password.`);

    if (role) accounts.push({ slot, email, name, role: role.name, password });
  }
  return { accounts, errors };
}

export interface CreateResult {
  email: string;
  role: string;
  outcome: "created" | "already-exists";
}

export async function createAdminAccounts(prisma: PrismaClient, accounts: AdminAccountInput[]): Promise<CreateResult[]> {
  const results: CreateResult[] = [];
  for (const a of accounts) {
    const existing = await prisma.user.findUnique({ where: { email: a.email } });
    if (existing) {
      results.push({ email: a.email, role: a.role, outcome: "already-exists" });
      continue;
    }
    const role = await prisma.role.findUnique({ where: { name: a.role } });
    if (!role) throw new Error(`Role "${a.role}" is missing. Run the seed first (it creates the six roles).`);
    const passwordHash = await hashPassword(a.password);
    const user = await prisma.user.create({ data: { email: a.email, name: a.name, roleId: role.id, passwordHash } });
    await prisma.auditLog.create({
      data: {
        userEmail: "system",
        action: "ADMIN_ACCOUNT_CREATED",
        entityType: "User",
        entityId: user.id,
        newValue: { email: a.email, role: a.role },
        meta: { via: "create-admins command" },
      },
    });
    results.push({ email: a.email, role: a.role, outcome: "created" });
  }
  return results;
}
