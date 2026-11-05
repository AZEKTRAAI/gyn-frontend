// Creates the six SRS roles and (for development only) one dummy account per role.
// Roles are safe to seed anywhere. The dummy accounts have a published password, so they must never exist on a real server:
// seedDemoUsers refuses unless ALLOW_DEMO_ACCOUNTS=1 is set, and that variable is only in .env.local.

import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "./password.ts";
import { ROLES } from "./permissions.ts";

export async function seedRoles(prisma: PrismaClient): Promise<void> {
  for (const r of ROLES) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description, permissions: r.permissions, isSystem: true },
      create: { name: r.name, description: r.description, permissions: r.permissions, isSystem: true },
    });
  }
}

export const DEMO_PASSWORD = "GynDemo!2026";

export const DEMO_USERS = [
  { email: "superadmin@gyn.test", name: "Demo Super Admin", role: "Super Administrator" },
  { email: "events@gyn.test", name: "Demo Event Manager", role: "Event Manager" },
  { email: "registrations@gyn.test", name: "Demo Registration Manager", role: "Registration Manager" },
  { email: "finance@gyn.test", name: "Demo Finance Manager", role: "Finance Manager" },
  { email: "content@gyn.test", name: "Demo Content Manager", role: "Content Manager" },
  { email: "viewer@gyn.test", name: "Demo Viewer", role: "Viewer" },
] as const;

export async function seedDemoUsers(prisma: PrismaClient): Promise<void> {
  if (process.env.ALLOW_DEMO_ACCOUNTS !== "1") {
    throw new Error("Refusing to create demo accounts: ALLOW_DEMO_ACCOUNTS=1 is not set. They have a published password.");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create demo accounts with NODE_ENV=production.");
  }
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  for (const u of DEMO_USERS) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: u.role } });
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, roleId: role.id, passwordHash, active: true, failedLogins: 0, lockedUntil: null },
      create: { email: u.email, name: u.name, roleId: role.id, passwordHash },
    });
  }
}
