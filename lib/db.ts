// Node runtime: Prisma Client requires @prisma/adapter-pg (not available in Edge Runtime).
// Exports getRepo() — returns a DemoStore when DATABASE_URL is absent,
// or a PrismaRepo-backed PrismaClient when DATABASE_URL is set.

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { DemoStore, type Repo } from "./server/repo.ts";
import { PrismaRepo } from "./server/prisma-repo.ts";

const globalForDb = globalThis as unknown as { _repo?: Repo };

export function getRepo(): Repo {
  if (globalForDb._repo) return globalForDb._repo;

  if (!process.env.DATABASE_URL) {
    globalForDb._repo = new DemoStore();
    return globalForDb._repo;
  }

  // max:5 matches Neon's pooled connection limit recommendation for serverless; increase for long-lived servers.
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  globalForDb._repo = new PrismaRepo(prisma);
  return globalForDb._repo;
}
