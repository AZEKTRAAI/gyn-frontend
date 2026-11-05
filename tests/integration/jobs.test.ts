// The job queue against a real database.
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { claimJobs, enqueueJob, failJob, recoverStaleJobs } from "@gyn/core/jobs";
import { PermanentJobError, runOnce } from "../../worker/runner.ts";
import { closeDb, pool, prisma, resetDb } from "./helpers.ts";

beforeEach(resetDb);
after(closeDb);

test("a job queued inside a transaction that rolls back is not left behind", async () => {
  await assert.rejects(
    prisma.$transaction(async (tx) => {
      await enqueueJob(tx, { type: "send_email", payload: { to: "a@b.org" } });
      throw new Error("the registration failed to save");
    }),
    /failed to save/,
  );
  assert.equal(await prisma.job.count(), 0);
});

test("a repeated trigger is ignored without breaking the surrounding transaction", async () => {
  await prisma.$transaction(async (tx) => {
    assert.equal(await enqueueJob(tx, { type: "send_email", payload: {}, dedupeKey: "payment_success:p1" }), "created");
    assert.equal(await enqueueJob(tx, { type: "send_email", payload: {}, dedupeKey: "payment_success:p1" }), "duplicate");
    await enqueueJob(tx, { type: "noop", payload: {} }); // the transaction is still usable
  });
  assert.equal(await prisma.job.count(), 2);
});

test("only due jobs are claimed, once each, and marked running", async () => {
  await enqueueJob(prisma, { type: "noop", payload: { n: 1 }, runAt: new Date(Date.now() - 1000) });
  await enqueueJob(prisma, { type: "noop", payload: { n: 2 }, runAt: new Date(Date.now() + 60_000) });
  const first = await claimJobs(pool, "w1", 10);
  assert.equal(first.length, 1);
  assert.equal(first[0].attempts, 1);
  assert.equal((await claimJobs(pool, "w2", 10)).length, 0);
  const row = await prisma.job.findUniqueOrThrow({ where: { id: first[0].id } });
  assert.equal(row.status, "RUNNING");
  assert.equal(row.lockedBy, "w1");
});

test("a failed job retries later with a delay, then fails for good when attempts run out", async () => {
  await enqueueJob(prisma, { type: "noop", payload: {}, maxAttempts: 2 });
  let [job] = await claimJobs(pool, "w", 1);
  assert.equal(await failJob(pool, job, new Error("SMTP timeout")), "retry");
  let row = await prisma.job.findUniqueOrThrow({ where: { id: job.id } });
  assert.equal(row.status, "PENDING");
  assert.equal(row.lastError, "SMTP timeout");
  assert.ok(row.runAt.getTime() > Date.now() + 20_000, "the retry waits about 30 seconds");
  assert.equal((await claimJobs(pool, "w", 1)).length, 0, "not due yet");

  await prisma.job.update({ where: { id: job.id }, data: { runAt: new Date(Date.now() - 1000) } });
  [job] = await claimJobs(pool, "w", 1);
  assert.equal(job.attempts, 2);
  assert.equal(await failJob(pool, job, new Error("SMTP timeout again")), "failed");
  row = await prisma.job.findUniqueOrThrow({ where: { id: job.id } });
  assert.equal(row.status, "FAILED");
  assert.ok(row.finishedAt);
});

test("a job left running by a crashed worker is put back; a fresh one is not touched", async () => {
  await enqueueJob(prisma, { type: "noop", payload: { which: "stale" } });
  await enqueueJob(prisma, { type: "noop", payload: { which: "fresh" } });
  const [a, b] = await claimJobs(pool, "w", 2);
  await prisma.job.update({ where: { id: a.id }, data: { lockedAt: new Date(Date.now() - 3600_000) } });
  assert.equal(await recoverStaleJobs(pool), 1);
  assert.equal((await prisma.job.findUniqueOrThrow({ where: { id: a.id } })).status, "PENDING");
  assert.equal((await prisma.job.findUniqueOrThrow({ where: { id: b.id } })).status, "RUNNING");
});

test("the worker pass runs handlers and records each outcome", async () => {
  await enqueueJob(prisma, { type: "ok", payload: {} });
  await enqueueJob(prisma, { type: "boom", payload: {} });
  await enqueueJob(prisma, { type: "bad_input", payload: {} });
  await enqueueJob(prisma, { type: "nobody_handles_this", payload: {} });
  const result = await runOnce(
    pool,
    {
      ok: async () => {},
      boom: async () => {
        throw new Error("temporary");
      },
      bad_input: async () => {
        throw new PermanentJobError("payload is wrong");
      },
    },
    { workerId: "test", batch: 10 },
  );
  assert.deepEqual(result, { claimed: 4, succeeded: 1, retried: 1, failed: 2 });
  const by = Object.fromEntries((await prisma.job.findMany()).map((j) => [j.type, j]));
  assert.equal(by.ok.status, "SUCCEEDED");
  assert.equal(by.boom.status, "PENDING");
  assert.equal(by.bad_input.status, "FAILED");
  assert.match(by.nobody_handles_this.lastError ?? "", /No handler/);
});
