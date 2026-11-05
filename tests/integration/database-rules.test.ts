// The rules the database enforces by itself (triggers, CHECK constraints, unique keys).
// If application code ever has a bug, these are what still keep the data right.
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { closeDb, makeForm, pool, prisma, registrationData, resetDb } from "./helpers.ts";

beforeEach(resetDb);
after(closeDb);

test("the database clock is UTC (all raw timestamp comparisons rely on it)", async () => {
  const { rows } = await pool.query("SHOW TimeZone");
  assert.equal(rows[0].TimeZone, "UTC");
});

test("a draft form version can be edited; a published one is frozen and cannot be deleted", async () => {
  const { version } = await makeForm();
  await prisma.formVersion.update({ where: { id: version.id }, data: { definition: { steps: ["draft edit"] } } });
  await prisma.formVersion.update({ where: { id: version.id }, data: { publishedAt: new Date() } });
  await assert.rejects(
    prisma.formVersion.update({ where: { id: version.id }, data: { definition: { steps: ["changed after publish"] } } }),
    /published form version cannot be changed/,
  );
  await assert.rejects(prisma.formVersion.delete({ where: { id: version.id } }), /cannot be deleted/);
  await assert.rejects(prisma.formVersion.update({ where: { id: version.id }, data: { version: 2 } }), /cannot be changed/);
});

test("letter template versions can never be edited or deleted", async () => {
  const t = await prisma.letterTemplate.create({ data: { name: "Acceptance", trigger: "APPLICATION_ACCEPTED" } });
  const v = await prisma.letterTemplateVersion.create({ data: { templateId: t.id, version: 1, subject: "Welcome" } });
  await assert.rejects(prisma.letterTemplateVersion.update({ where: { id: v.id }, data: { subject: "Changed" } }), /cannot be changed or deleted/);
  await assert.rejects(prisma.letterTemplateVersion.delete({ where: { id: v.id } }), /cannot be changed or deleted/);
});

test("the audit log is append-only, except rows past the 3 year retention period", async () => {
  const recent = await prisma.auditLog.create({ data: { action: "X", entityType: "T", entityId: "1" } });
  await assert.rejects(prisma.auditLog.update({ where: { id: recent.id }, data: { action: "Y" } }), /cannot be changed or deleted/);
  await assert.rejects(prisma.auditLog.delete({ where: { id: recent.id } }), /cannot be changed or deleted/);

  const fourYearsAgo = new Date(Date.now() - 4 * 365 * 24 * 3600 * 1000);
  const old = await prisma.auditLog.create({ data: { action: "OLD", entityType: "T", entityId: "2", createdAt: fourYearsAgo } });
  await prisma.auditLog.delete({ where: { id: old.id } });
  assert.equal(await prisma.auditLog.count(), 1);
});

test("a form can never hold more submissions than its limit", async () => {
  const { form } = await makeForm({ submissionLimit: 2 });
  await prisma.form.update({ where: { id: form.id }, data: { submissionCount: 2 } });
  await assert.rejects(prisma.form.update({ where: { id: form.id }, data: { submissionCount: 3 } }), /form_limit_respected/);
  await assert.rejects(prisma.form.update({ where: { id: form.id }, data: { submissionCount: -1 } }), /form_count_not_negative/);
});

test("the same duplicate key or idempotency key cannot be used twice", async () => {
  const { form, version } = await makeForm();
  await prisma.registration.create({ data: registrationData(form, version, { duplicateKey: `form:${form.id}:a@b.org`, idempotencyKey: "same-click" }) });
  await assert.rejects(
    prisma.registration.create({ data: registrationData(form, version, { duplicateKey: `form:${form.id}:a@b.org` }) }),
    /Unique constraint/,
  );
  await assert.rejects(prisma.registration.create({ data: registrationData(form, version, { idempotencyKey: "same-click" }) }), /Unique constraint/);
  // Registrations without a duplicate rule have a null key and never collide.
  await prisma.registration.create({ data: registrationData(form, version) });
  await prisma.registration.create({ data: registrationData(form, version) });
  assert.equal(await prisma.registration.count(), 3);
});

test("entry numbers count up and are unique", async () => {
  const { form, version } = await makeForm();
  const rows = [];
  for (let i = 0; i < 5; i++) rows.push(await prisma.registration.create({ data: registrationData(form, version) }));
  const numbers = rows.map((r) => r.entryNumber);
  assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b));
  assert.equal(new Set(numbers).size, 5);
});

test("a payment order or webhook delivery can be recorded only once", async () => {
  const { form, version } = await makeForm();
  const reg = await prisma.registration.create({ data: registrationData(form, version) });
  const pay = (key: string, order: string | null) =>
    prisma.payment.create({ data: { registrationId: reg.id, provider: "STRIPE", amountCents: 19900, currency: "USD", idempotencyKey: key, providerOrderId: order } });
  await pay("k1", "cs_test_1");
  await assert.rejects(pay("k2", "cs_test_1"), /Unique constraint/);
  await pay("k3", null);
  await pay("k4", null); // attempts that have no gateway id yet never collide

  await prisma.webhookEvent.create({ data: { provider: "STRIPE", providerEventId: "evt_1", eventType: "x", payload: {} } });
  await assert.rejects(prisma.webhookEvent.create({ data: { provider: "STRIPE", providerEventId: "evt_1", eventType: "x", payload: {} } }), /Unique constraint/);
  await prisma.webhookEvent.create({ data: { provider: "PAYPAL", providerEventId: "evt_1", eventType: "x", payload: {} } });
});

test("an automatic letter can be created only once per registration, template and trigger", async () => {
  const { form, version } = await makeForm();
  const reg = await prisma.registration.create({ data: registrationData(form, version) });
  const t = await prisma.letterTemplate.create({ data: { name: "Confirm", trigger: "PAYMENT_SUCCEEDED" } });
  const v = await prisma.letterTemplateVersion.create({ data: { templateId: t.id, version: 1 } });
  const autoKey = `${reg.id}:${t.id}:PAYMENT_SUCCEEDED`;
  const make = (key: string | null) =>
    prisma.generatedLetter.create({ data: { registrationId: reg.id, templateId: t.id, templateVersionId: v.id, trigger: "PAYMENT_SUCCEEDED", autoKey: key } });
  await make(autoKey);
  await assert.rejects(make(autoKey), /Unique constraint/);
  await make(null); // a manual resend has no auto key and needs no uniqueness
});
