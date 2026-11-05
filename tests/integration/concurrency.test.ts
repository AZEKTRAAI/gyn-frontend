// What happens when many people submit at once. These are the properties the load targets in docs/backend-plan.md depend on.
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { claimJobs, enqueueJob } from "@gyn/core/jobs";
import { closeDb, makeForm, pool, prisma, registrationData, resetDb } from "./helpers.ts";

beforeEach(resetDb);
after(closeDb);

const TAKE_A_PLACE = `UPDATE "Form" SET "submissionCount" = "submissionCount" + 1
                       WHERE id = $1 AND ("submissionLimit" IS NULL OR "submissionCount" < "submissionLimit")`;

test("200 people grab the last 50 places at the same moment: exactly 50 get one", async () => {
  const { form } = await makeForm({ submissionLimit: 50 });
  const results = await Promise.all(Array.from({ length: 200 }, () => pool.query(TAKE_A_PLACE, [form.id])));
  assert.equal(results.filter((r) => r.rowCount === 1).length, 50);
  assert.equal((await prisma.form.findUniqueOrThrow({ where: { id: form.id } })).submissionCount, 50);
});

test("10 workers draining 300 jobs at once take every job exactly once", async () => {
  await prisma.job.createMany({ data: Array.from({ length: 300 }, (_, i) => ({ type: "noop", payload: { i } })) });
  const taken: string[][] = await Promise.all(
    Array.from({ length: 10 }, async (_, w) => {
      const mine: string[] = [];
      for (;;) {
        const batch = await claimJobs(pool, `worker-${w}`, 7);
        if (batch.length === 0) return mine;
        mine.push(...batch.map((j) => j.id));
      }
    }),
  );
  const all = taken.flat();
  assert.equal(all.length, 300, "no job missed");
  assert.equal(new Set(all).size, 300, "no job taken twice");
});

test("300 simultaneous submits for 250 places: 250 saved with their jobs, 50 refused cleanly, nothing half-saved", async () => {
  const { form, version } = await makeForm({ submissionLimit: 250 });

  // The shape of the real submit: take a place, save the registration and queue its follow-up work, all in one transaction.
  const submit = (i: number) =>
    prisma.$transaction(async (tx) => {
      const took = await tx.$executeRawUnsafe(TAKE_A_PLACE, form.id);
      if (took === 0) throw new Error("FORM_FULL");
      const reg = await tx.registration.create({ data: registrationData(form, version, { idempotencyKey: `load-${i}` }) });
      await enqueueJob(tx, { type: "send_email", payload: { registrationId: reg.id }, dedupeKey: `confirmation:${reg.id}` });
      return reg.id;
    });

  const started = Date.now();
  const outcomes = await Promise.allSettled(Array.from({ length: 300 }, (_, i) => submit(i)));
  const seconds = (Date.now() - started) / 1000;

  const saved = outcomes.filter((o) => o.status === "fulfilled").length;
  const refused = outcomes.filter((o) => o.status === "rejected" && /FORM_FULL/.test(String(o.reason))).length;
  const unexpected = [...new Set(outcomes.flatMap((o) => (o.status === "rejected" && !/FORM_FULL/.test(String(o.reason)) ? [String(o.reason).slice(0, 160)] : [])))];
  assert.deepEqual(unexpected, [], "submissions failed for a reason other than the form being full");
  assert.equal(saved, 250);
  assert.equal(refused, 50, "every other failure would be a bug");
  assert.equal(await prisma.registration.count(), 250);
  assert.equal(await prisma.job.count(), 250, "every saved registration has its email job");
  assert.equal((await prisma.form.findUniqueOrThrow({ where: { id: form.id } })).submissionCount, 250);
  const numbers = (await prisma.registration.findMany({ select: { entryNumber: true } })).map((r) => r.entryNumber);
  assert.equal(new Set(numbers).size, 250, "entry numbers are unique");
  console.log(`      300 simultaneous submits finished in ${seconds.toFixed(2)} s (${Math.round(300 / seconds)} per second)`);
});

test("a double click or a retry after a timeout never creates two registrations", async () => {
  const { form, version } = await makeForm();
  const attempts = await Promise.allSettled(
    Array.from({ length: 8 }, () => prisma.registration.create({ data: registrationData(form, version, { idempotencyKey: "one-person-clicking-submit" }) })),
  );
  assert.equal(attempts.filter((a) => a.status === "fulfilled").length, 1);
  assert.equal(await prisma.registration.count(), 1);
});

test("two people with the same email cannot both register under a one-per-email form", async () => {
  const { form, version } = await makeForm({ duplicateRule: "EMAIL_PER_FORM" });
  const key = `form:${form.id}:same@person.org`;
  const attempts = await Promise.allSettled(
    Array.from({ length: 6 }, () => prisma.registration.create({ data: registrationData(form, version, { duplicateKey: key }) })),
  );
  assert.equal(attempts.filter((a) => a.status === "fulfilled").length, 1);
});
