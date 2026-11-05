// Job queue on top of one Postgres table (the "outbox" pattern).
//
// The app writes a Job row in the SAME transaction as whatever caused it (a registration, a payment update, an admin decision),
// so "the registration was saved but its email job was lost" cannot happen. The worker process claims rows with
// FOR UPDATE SKIP LOCKED, so any number of workers can run without ever taking the same job twice. Failed jobs retry with
// growing delays; jobs that run out of attempts are marked FAILED and show up in the admin instead of disappearing.

import type { Pool } from "pg";
import type { Prisma, PrismaClient } from "@prisma/client";

export interface JobRow {
  id: string;
  type: string;
  payload: unknown;
  attempts: number;
  maxAttempts: number;
}

export interface EnqueueInput {
  type: string;
  payload: unknown;
  runAt?: Date;
  /** A second job with the same key is ignored, so a repeated trigger cannot do the work twice. */
  dedupeKey?: string;
  maxAttempts?: number;
}

/**
 * Add a job. Pass the transaction client (`tx`) from `prisma.$transaction` so the job commits or rolls back together with its cause.
 * createMany with skipDuplicates is used (not create + catch) because a unique violation would abort the whole transaction.
 */
export async function enqueueJob(db: PrismaClient | Prisma.TransactionClient, input: EnqueueInput): Promise<"created" | "duplicate"> {
  const result = await db.job.createMany({
    data: [
      {
        type: input.type,
        payload: input.payload as Prisma.InputJsonValue,
        runAt: input.runAt ?? new Date(),
        dedupeKey: input.dedupeKey,
        maxAttempts: input.maxAttempts ?? 8,
      },
    ],
    skipDuplicates: true,
  });
  return result.count === 1 ? "created" : "duplicate";
}

/** Wait before retry n (1-based): 30 s, 1 min, 2 min, 4 min ... capped at 1 hour. */
export function backoffMs(attempt: number): number {
  return Math.min(30_000 * 2 ** Math.max(0, attempt - 1), 3_600_000);
}

// Timestamps are stored without a time zone, in UTC. Comparing them with now() directly would depend on the session's
// time zone, so every raw comparison uses this.
const UTC_NOW = `(now() AT TIME ZONE 'UTC')`;

/** Take up to `limit` due jobs. Safe to call from many workers at once. */
export async function claimJobs(pool: Pool, workerId: string, limit: number): Promise<JobRow[]> {
  const { rows } = await pool.query(
    `UPDATE "Job"
        SET status = 'RUNNING', "lockedAt" = ${UTC_NOW}, "lockedBy" = $1, attempts = attempts + 1
      WHERE id IN (
        SELECT id FROM "Job"
         WHERE status = 'PENDING' AND "runAt" <= ${UTC_NOW}
         ORDER BY "runAt", "createdAt"
         LIMIT $2
         FOR UPDATE SKIP LOCKED)
      RETURNING id, type, payload, attempts, "maxAttempts"`,
    [workerId, limit],
  );
  return rows as JobRow[];
}

export async function completeJob(pool: Pool, id: string): Promise<void> {
  await pool.query(
    `UPDATE "Job" SET status = 'SUCCEEDED', "finishedAt" = ${UTC_NOW}, "lockedAt" = NULL, "lockedBy" = NULL, "lastError" = NULL WHERE id = $1`,
    [id],
  );
}

/** Record a failure: retry later with backoff, or give up (FAILED) when attempts are used up or the failure is permanent. */
export async function failJob(pool: Pool, job: JobRow, error: unknown, opts: { permanent?: boolean } = {}): Promise<"retry" | "failed"> {
  const message = (error instanceof Error ? error.message : String(error)).slice(0, 1000);
  if (opts.permanent || job.attempts >= job.maxAttempts) {
    await pool.query(
      `UPDATE "Job" SET status = 'FAILED', "finishedAt" = ${UTC_NOW}, "lockedAt" = NULL, "lockedBy" = NULL, "lastError" = $2 WHERE id = $1`,
      [job.id, message],
    );
    return "failed";
  }
  await pool.query(
    `UPDATE "Job"
        SET status = 'PENDING', "runAt" = ${UTC_NOW} + ($3 || ' milliseconds')::interval,
            "lockedAt" = NULL, "lockedBy" = NULL, "lastError" = $2
      WHERE id = $1`,
    [job.id, message, String(backoffMs(job.attempts))],
  );
  return "retry";
}

/** A worker that died mid-job leaves it RUNNING. Put such jobs back (or fail them if attempts are used up). */
export async function recoverStaleJobs(pool: Pool, olderThanMs = 10 * 60_000): Promise<number> {
  const { rowCount } = await pool.query(
    `UPDATE "Job"
        SET status = CASE WHEN attempts >= "maxAttempts" THEN 'FAILED'::"JobStatus" ELSE 'PENDING'::"JobStatus" END,
            "lastError" = 'The worker stopped while running this job.',
            "finishedAt" = CASE WHEN attempts >= "maxAttempts" THEN ${UTC_NOW} ELSE NULL END,
            "lockedAt" = NULL, "lockedBy" = NULL
      WHERE status = 'RUNNING' AND "lockedAt" < ${UTC_NOW} - ($1 || ' milliseconds')::interval`,
    [String(olderThanMs)],
  );
  return rowCount ?? 0;
}
