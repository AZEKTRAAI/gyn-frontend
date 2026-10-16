// Node runtime: Prisma Client requires @prisma/adapter-pg (not available in Edge Runtime).
// Exports getRepo() — returns a DemoStore when DATABASE_URL is absent,
// or a PrismaClient-backed repo when DATABASE_URL + @prisma/adapter-pg are configured.
// shortcut: only DemoStore active; add `npm install @prisma/adapter-pg` and implement
//           PrismaRepo here when deploying to production with a real database.

import { DemoStore, type Repo } from "./server/repo.ts";

const globalForDb = globalThis as unknown as { _repo?: Repo };

export function getRepo(): Repo {
  if (globalForDb._repo) return globalForDb._repo;

  if (!process.env.DATABASE_URL) {
    globalForDb._repo = new DemoStore();
    return globalForDb._repo;
  }

  // Production path ─ requires @prisma/adapter-pg in node_modules.
  // Replace this block with a real PrismaRepo implementation:
  //
  //   import { PrismaPg } from "@prisma/adapter-pg";
  //   import { PrismaClient } from "@prisma/client";
  //   const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  //   const prisma = new PrismaClient({ adapter });
  //   globalForDb._repo = new PrismaRepo(prisma);
  //
  throw new Error(
    "DATABASE_URL is set but the Prisma database repo is not yet wired up. " +
      "Install @prisma/adapter-pg and implement PrismaRepo in lib/db.ts."
  );
}
