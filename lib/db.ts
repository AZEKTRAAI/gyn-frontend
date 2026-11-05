// Node runtime. Exports getRepo(): the legacy fixed-ticket repository (DemoStore without a database, PrismaRepo with one).
// The shared Prisma client itself lives in @gyn/core/db. Phase 6 of docs/backend-plan.md replaces the legacy repository.

import { getPrisma } from "@gyn/core/db";
import { DemoStore, type Repo } from "./server/repo.ts";
import { PrismaRepo } from "./server/prisma-repo.ts";

export { getPrisma };

const globalForDb = globalThis as unknown as { _repo?: Repo };

export function getRepo(): Repo {
  if (globalForDb._repo) return globalForDb._repo;

  const prisma = getPrisma();
  globalForDb._repo = prisma ? new PrismaRepo(prisma) : new DemoStore();
  return globalForDb._repo;
}
