// One pass of the worker: take due jobs, run each handler, record success or failure.
// Kept apart from index.ts (the endless loop) so tests can run a single pass against a real database.

import type { Pool } from "pg";
import { claimJobs, completeJob, failJob, type JobRow } from "@gyn/core/jobs";

export type JobHandler = (job: JobRow, ctx: { pool: Pool }) => Promise<void>;
export type Handlers = Record<string, JobHandler>;

/** A handler throws this when retrying cannot help (bad payload, a deleted record). The job goes straight to FAILED. */
export class PermanentJobError extends Error {}

export interface PassResult {
  claimed: number;
  succeeded: number;
  retried: number;
  failed: number;
}

export async function runOnce(pool: Pool, handlers: Handlers, opts: { workerId: string; batch: number }): Promise<PassResult> {
  const jobs = await claimJobs(pool, opts.workerId, opts.batch);
  const result: PassResult = { claimed: jobs.length, succeeded: 0, retried: 0, failed: 0 };

  await Promise.all(
    jobs.map(async (job) => {
      const handler = handlers[job.type];
      try {
        if (!handler) throw new PermanentJobError(`No handler for job type "${job.type}".`);
        await handler(job, { pool });
        await completeJob(pool, job.id);
        result.succeeded++;
      } catch (err) {
        const outcome = await failJob(pool, job, err, { permanent: err instanceof PermanentJobError });
        if (outcome === "retry") result.retried++;
        else result.failed++;
      }
    }),
  );
  return result;
}
