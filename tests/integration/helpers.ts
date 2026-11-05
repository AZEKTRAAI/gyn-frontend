// Shared setup for the integration tests. They run against the throwaway database in docker-compose.dev.yml
// (npm run db:up, npm run db:test:prepare, npm run test:integration) and refuse to run against anything else.

import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import type { Prisma } from "@prisma/client";
import { createPrismaClient } from "@gyn/core/prisma-client";

const url = process.env.DATABASE_URL ?? "";
if (!/\/[A-Za-z0-9_]*_test(\?|$)/.test(url)) {
  throw new Error("Integration tests only run against a database whose name ends in _test (see .env.test). Refusing to continue.");
}

export const pool = new Pool({ connectionString: url, max: 20 });
export const prisma = createPrismaClient(pool);

/** Empty every table. TRUNCATE skips row triggers, so it also clears the append-only audit log. */
export async function resetDb(): Promise<void> {
  const { rows } = await pool.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
  );
  const names = rows.map((r) => `"${r.tablename}"`).join(", ");
  await pool.query(`TRUNCATE ${names} RESTART IDENTITY CASCADE`);
}

export async function closeDb(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
}

const rand = () => randomBytes(4).toString("hex");

export async function makeForm(over: Partial<Prisma.FormUncheckedCreateInput> = {}) {
  const form = await prisma.form.create({ data: { slug: `form-${rand()}`, name: "Test form", ...over } });
  const version = await prisma.formVersion.create({ data: { formId: form.id, version: 1, definition: { steps: [] } } });
  return { form, version };
}

export function registrationData(
  form: { id: string },
  version: { id: string },
  over: Partial<Prisma.RegistrationUncheckedCreateInput> = {},
): Prisma.RegistrationUncheckedCreateInput {
  return {
    reference: `T-${rand()}${rand()}`,
    formId: form.id,
    formVersionId: version.id,
    answers: {},
    idempotencyKey: `key-${rand()}${rand()}`,
    ...over,
  };
}
