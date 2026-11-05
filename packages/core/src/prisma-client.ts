// The one place a PrismaClient is built, so the app, the worker, the seed and the tests all use the same settings.

import type { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Prisma's default is to give up after 2 s of waiting for a free database connection. In a deadline spike (hundreds of
// people submitting in the same second) that default drops registrations. These values make requests wait in line instead;
// if the line is still too long after 15 s the request fails cleanly, and the browser retries with the same idempotency key.
export const TRANSACTION_OPTIONS = { maxWait: 15_000, timeout: 20_000 } as const;

export function createPrismaClient(pool: Pool): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg(pool), transactionOptions: TRANSACTION_OPTIONS });
}
