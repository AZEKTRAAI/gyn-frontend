// Node runtime: Prisma Client requires @prisma/adapter-pg (not available in Edge Runtime).
// Exports getRepo() — returns a DemoStore when DATABASE_URL is absent,
// or a PrismaRepo-backed PrismaClient when DATABASE_URL is set.

import { Pool } from "pg";
import type { PrismaClient } from "@prisma/client";
import { createPrismaClient } from "./server/prisma-client.ts";
import { DemoStore, type Repo } from "./server/repo.ts";
import { PrismaRepo } from "./server/prisma-repo.ts";

const globalForDb = globalThis as unknown as { _repo?: Repo; _prisma?: PrismaClient };

/** Shared Prisma client, or null when DATABASE_URL is absent (demo mode). */
export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!globalForDb._prisma) {
    // One long-lived server on the VPS: a fixed pool, sized to the server (Postgres allows 100 connections; the worker takes a few).
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DB_POOL_MAX) || 10 });
    globalForDb._prisma = createPrismaClient(pool);
  }
  return globalForDb._prisma;
}

export function getRepo(): Repo {
  if (globalForDb._repo) return globalForDb._repo;

  if (!process.env.DATABASE_URL) {
    globalForDb._repo = new DemoStore();
    return globalForDb._repo;
  }

  globalForDb._repo = new PrismaRepo(getPrisma()!);
  return globalForDb._repo;
}
