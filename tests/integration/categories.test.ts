// Registration categories against a real database: create, edit, reorder, remove, the audit trail and what the public sees.
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { eventDetailsSchema } from "@gyn/core/event-schema";
import { EventStoreError, createEvent, getPublicEvent, setEventStatus } from "@gyn/core/event-store";
import { blankCategory } from "@gyn/core/category-schema";
import { createCategory, listCategoriesForEdit, moveCategory, removeCategory, updateCategory } from "@gyn/core/category-store";
import { closeDb, makeForm, prisma, registrationData, resetDb } from "./helpers.ts";

beforeEach(resetDb);
after(closeDb);

const meta = { actor: "events@gyn.test", ip: "127.0.0.1" };
const SLUG = "sis-dubai-2099";
const details = eventDetailsSchema.parse({
  name: "SIS Dubai 2099", shortName: "SISD", theme: "", startsAt: "2099-03-10", endsAt: "2099-03-12",
  timezone: "Asia/Dubai", venue: "", city: "Dubai", country: "UAE", navLabel: "", timingOverride: "",
});
const form = (over: object = {}) => ({ ...blankCategory, name: "Forum Access", slug: "forum-access", fee: "299", ...over });
const audit = (action: string) => prisma.auditLog.findMany({ where: { action }, orderBy: { createdAt: "asc" } });
const slugs = async () => (await listCategoriesForEdit(SLUG))!.map((c) => c.values.slug);

async function setup() {
  await createEvent({ slug: SLUG, details, kind: "upcoming" }, meta);
  await setEventStatus(SLUG, "PUBLISHED", meta);
}

test("create stores cents and day-precision dates in the event's time zone, adds to the end, and writes an audit row", async () => {
  await setup();
  await createCategory(SLUG, form({ opensAt: "2099-01-01", closesAt: "2099-02-01", seatLimit: "50", description: "Full access" }), meta);
  await createCategory(SLUG, form({ name: "Self-Funded", slug: "self-funded", fee: "12.5", approvalMode: "MANUAL_REVIEW" }), meta);
  assert.deepEqual(await slugs(), ["forum-access", "self-funded"]);
  const [a, b] = (await listCategoriesForEdit(SLUG))!;
  assert.equal(a.values.fee, "299.00");
  assert.equal(b.values.fee, "12.50");
  assert.equal(a.values.opensAt, "2099-01-01");
  assert.equal(a.values.closesAt, "2099-02-01");
  assert.equal(a.values.seatLimit, "50");
  assert.equal(b.phase, "open");
  const row = await prisma.registrationCategory.findFirstOrThrow({ where: { slug: "forum-access" } });
  assert.equal(row.feeCents, 29900);
  assert.equal(row.closesAt!.toISOString(), "2099-02-01T19:59:00.000Z", "23:59 in Dubai (UTC+4)");
  const [log] = await audit("CATEGORY_CREATED");
  assert.equal(log.userEmail, meta.actor);
  assert.equal((log.newValue as { feeCents: number }).feeCents, 29900);
  const pub = (await getPublicEvent(SLUG))!;
  assert.deepEqual(pub.categories.map((c) => c.slug), ["forum-access", "self-funded"]);
  assert.equal(pub.categories[0].open, false, "not open yet: it opens in 2099");
});

test("bad input and a taken address write nothing", async () => {
  await setup();
  await createCategory(SLUG, form(), meta);
  await assert.rejects(createCategory(SLUG, form({ fee: "-1" }), meta), (e: EventStoreError) => e.code === "INVALID");
  await assert.rejects(createCategory(SLUG, form({ name: "Other" }), meta), (e: EventStoreError) => e.code === "SLUG_TAKEN");
  await assert.rejects(createCategory("nope", form({ slug: "x-y" }), meta), (e: EventStoreError) => e.code === "NOT_FOUND");
  assert.equal(await prisma.registrationCategory.count(), 1);
  assert.equal((await audit("CATEGORY_CREATED")).length, 1);
});

test("editing keeps the old and new values in the audit log, and a fee change does not touch existing registrations", async () => {
  await setup();
  await createCategory(SLUG, form(), meta);
  const cat = (await listCategoriesForEdit(SLUG))![0];
  const { form: f, version } = await makeForm();
  const event = await prisma.event.findFirstOrThrow({ where: { slug: SLUG } });
  const reg = await prisma.registration.create({ data: registrationData(f, version, { eventId: event.id, categoryId: cat.id, amountDueCents: 29900 }) });

  await updateCategory(SLUG, cat.id, form({ fee: "349.99", active: false }), meta);
  const [log] = await audit("CATEGORY_UPDATED");
  assert.equal((log.oldValue as { feeCents: number }).feeCents, 29900);
  assert.equal((log.newValue as { feeCents: number; active: boolean }).feeCents, 34999);
  assert.equal((await prisma.registration.findUniqueOrThrow({ where: { id: reg.id } })).amountDueCents, 29900);
  assert.equal((await listCategoriesForEdit(SLUG))![0].phase, "off");

  await updateCategory(SLUG, cat.id, form({ fee: "349.99", active: false }), meta);
  assert.equal((await audit("CATEGORY_UPDATED")).length, 1, "no change, no audit row");

  // The address is fixed once a registration uses it; everything else can still change.
  await assert.rejects(updateCategory(SLUG, cat.id, form({ slug: "new-address", fee: "349.99", active: false }), meta), (e: EventStoreError) => e.code === "INVALID");
  await updateCategory(SLUG, cat.id, form({ name: "Forum Pass", fee: "349.99", active: false }), meta);
  assert.equal((await listCategoriesForEdit(SLUG))![0].values.name, "Forum Pass");
  assert.equal((await listCategoriesForEdit(SLUG))![0].registrations, 1);
});

test("a stored closing time survives a save that does not change the closing day", async () => {
  await setup();
  await createCategory(SLUG, form({ closesAt: "2099-02-01" }), meta);
  const row = await prisma.registrationCategory.findFirstOrThrow({ where: { slug: "forum-access" } });
  const odd = new Date("2099-02-01T10:15:00Z"); // 14:15 in Dubai, same day
  await prisma.registrationCategory.update({ where: { id: row.id }, data: { closesAt: odd } });
  await updateCategory(SLUG, row.id, form({ closesAt: "2099-02-01", name: "Renamed" }), meta);
  assert.equal((await prisma.registrationCategory.findUniqueOrThrow({ where: { id: row.id } })).closesAt!.toISOString(), odd.toISOString());
});

test("reorder swaps neighbours, stops at the ends, and renumbers when sort numbers tie", async () => {
  await setup();
  for (const s of ["aa", "bb", "cc"]) await createCategory(SLUG, form({ name: s, slug: s }), meta);
  const id = async (s: string) => (await listCategoriesForEdit(SLUG))!.find((c) => c.values.slug === s)!.id;
  await moveCategory(SLUG, await id("cc"), "up", meta);
  assert.deepEqual(await slugs(), ["aa", "cc", "bb"]);
  await moveCategory(SLUG, await id("aa"), "up", meta);
  assert.deepEqual(await slugs(), ["aa", "cc", "bb"], "already first");
  assert.equal((await audit("CATEGORY_UPDATED")).length, 1, "a no-op move is not logged");
  await prisma.registrationCategory.updateMany({ data: { sortOrder: 5 } });
  const tied = await slugs();
  await moveCategory(SLUG, await id(tied[1]), "up", meta);
  const moved = await slugs();
  assert.deepEqual(moved, [tied[1], tied[0], tied[2]], "the moved category went up one place");
  assert.equal(new Set((await listCategoriesForEdit(SLUG))!.map((c) => c.sortOrder)).size, 3, "sort numbers are distinct again");
});

test("remove hides the category but keeps the row and its registrations", async () => {
  await setup();
  await createCategory(SLUG, form(), meta);
  await createCategory(SLUG, form({ name: "Self-Funded", slug: "self-funded" }), meta);
  const cat = (await listCategoriesForEdit(SLUG))![0];
  const { form: f, version } = await makeForm();
  const reg = await prisma.registration.create({ data: registrationData(f, version, { categoryId: cat.id }) });
  await removeCategory(SLUG, cat.id, meta);
  assert.deepEqual(await slugs(), ["self-funded"]);
  assert.deepEqual((await getPublicEvent(SLUG))!.categories.map((c) => c.slug), ["self-funded"]);
  const row = await prisma.registrationCategory.findUniqueOrThrow({ where: { id: cat.id } });
  assert.ok(row.deletedAt);
  assert.equal((await prisma.registration.findUniqueOrThrow({ where: { id: reg.id } })).categoryId, cat.id);
  const [log] = await audit("CATEGORY_DELETED");
  assert.equal((log.meta as { registrations: number }).registrations, 1);
  await assert.rejects(removeCategory(SLUG, cat.id, meta), (e: EventStoreError) => e.code === "NOT_FOUND");
  await assert.rejects(createCategory(SLUG, form(), meta), (e: EventStoreError) => e.code === "SLUG_TAKEN", "a removed address stays reserved");
});
