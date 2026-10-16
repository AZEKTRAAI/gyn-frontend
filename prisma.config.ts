// Prisma 7 configuration file.
// DIRECT_URL = un-pooled connection for prisma migrate (bypasses PgBouncer).
// DATABASE_URL (pooled) is passed at runtime via the @prisma/adapter-pg adapter in lib/db.ts.
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Used by prisma migrate / prisma db pull. Omit if only running prisma generate.
    url: process.env.DIRECT_URL,
  },
  migrations: {
    path: "prisma/migrations",
  },
});
