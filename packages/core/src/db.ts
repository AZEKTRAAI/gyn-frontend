// The one shared Prisma client for the website, the admin and the seed. Node runtime only (pg adapter).
// Each app process keeps a single pool, sized by DB_POOL_MAX (default 10; Postgres allows 100 connections in total).

import { Pool } from "pg";
import type { PrismaClient } from "@prisma/client";
import { createPrismaClient } from "./prisma-client.ts";

const g = globalThis as unknown as { _gynPrisma?: PrismaClient };

/** The shared client, or null when DATABASE_URL is not set. */
export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!g._gynPrisma) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DB_POOL_MAX) || 10 });
    g._gynPrisma = createPrismaClient(pool);
  }
  return g._gynPrisma;
}

export function requirePrisma(): PrismaClient {
  const prisma = getPrisma();
  if (!prisma) throw new Error("DATABASE_URL is not set.");
  return prisma;
}
