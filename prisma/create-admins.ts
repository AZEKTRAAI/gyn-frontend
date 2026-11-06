// Creates the first real admin accounts from first-admins.env (see deploy/first-admins.env.example).
// Local:  npm run db:create-admins        On the server:  docker compose run --rm create-admins
// Safe to run again: accounts that already exist are skipped, never changed.

import { Pool } from "pg";
import { createPrismaClient } from "@gyn/core/prisma-client";
import { createAdminAccounts, parseAdminAccounts } from "@gyn/core/admin-accounts";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!url) throw new Error("DATABASE_URL or DIRECT_URL must be set");

  const { accounts, errors } = parseAdminAccounts(process.env);
  if (errors.length > 0) {
    console.error("Nothing was created. Fix these in first-admins.env and run it again:");
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }
  if (accounts.length === 0) {
    console.error("No accounts found. Fill in ADMIN_1_EMAIL, ADMIN_1_NAME and ADMIN_1_PASSWORD in first-admins.env.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url, max: 1 });
  const prisma = createPrismaClient(pool);
  try {
    for (const r of await createAdminAccounts(prisma, accounts)) {
      console.log(`${r.outcome === "created" ? "created       " : "already exists"}  ${r.email}  (${r.role})`);
    }
    console.log("\nDone. Delete first-admins.env now: the passwords are stored hashed in the database and no longer needed in the file.");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("create-admins failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
