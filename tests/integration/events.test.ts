// The event store against a real database: create, save, status changes, the audit trail and what the public sees.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { after, beforeEach, test } from "node:test";
import { EVENT_SECTIONS, eventDetailsSchema, type EventDetails } from "@gyn/core/event-schema";
import { EventStoreError, createEvent, getEventForEdit, getPublicEvent, listAllEvents, listPublicEvents, saveEvent, setEventStatus } from "@gyn/core/event-store";
import { closeDb, prisma, resetDb } from "./helpers.ts";

beforeEach(resetDb);
after(closeDb);

const meta = { actor: "events@gyn.test", ip: "127.0.0.1" };
const details: EventDetails = eventDetailsSchema.parse({
  name: "SIS Dubai 2099", shortName: "SISD", theme: "Test theme", startsAt: "2099-03-10", endsAt: "2099-03-12",
  timezone: "Asia/Dubai", venue: "A hall", city: "Dubai", country: "UAE", navLabel: "SIS Dubai", timingOverride: "",
});
const audit = (action: string) => prisma.auditLog.findMany({ where: { action }, orderBy: { createdAt: "asc" } });

test("a new event is a draft: hidden from the public, visible to the admin, with its sections and an audit row", async () => {
  await createEvent({ slug: "sis-dubai-2099", details, kind: "upcoming" }, meta);
  assert.equal(await getPublicEvent("sis-dubai-2099"), null);
  assert.deepEqual((await listPublicEvents()).map((e) => e.slug), []);
  assert.equal(await prisma.eventSection.count(), EVENT_SECTIONS.length);
  const [row] = await listAllEvents();
  assert.equal(row.status, "DRAFT");
  assert.equal(row.timing, "upcoming");
  const edit = (await getEventForEdit("sis-dubai-2099"))!;
  assert.deepEqual(edit.details, details, "dates round-trip through the event's own time zone");
  assert.equal(edit.content.categories.visible, true);
  assert.equal(edit.content.gallery.visible, false);
  const [log] = await audit("EVENT_CREATED");
  assert.equal(log.userEmail, meta.actor);
});

test("slugs are checked and not reusable", async () => {
  await createEvent({ slug: "sis-dubai-2099", details, kind: "past" }, meta);
  await assert.rejects(createEvent({ slug: "sis-dubai-2099", details, kind: "past" }, meta), (e: EventStoreError) => e.code === "SLUG_TAKEN");
  await assert.rejects(createEvent({ slug: "about-us", details, kind: "past" }, meta), (e: EventStoreError) => e.code === "INVALID");
  assert.equal(await prisma.event.count(), 1);
});

test("saving replaces the details and sections, keeps the old version in the audit log, and publishing shows the page", async () => {
  await createEvent({ slug: "sis-dubai-2099", details, kind: "upcoming" }, meta);
  const edit = (await getEventForEdit("sis-dubai-2099"))!;
  edit.content.hero.headline = "Dubai *2099*";
  edit.content.gallery.visible = true;
  await saveEvent("sis-dubai-2099", { details: { ...edit.details, city: "Abu Dhabi" }, content: edit.content, expectedUpdatedAt: edit.updatedAt.toISOString() }, meta);

  const [log] = await audit("EVENT_UPDATED");
  assert.equal((log.oldValue as { content: { hero: { headline: string } } }).content.hero.headline, edit.details.name);
  assert.equal((log.newValue as { details: EventDetails }).details.city, "Abu Dhabi");
  assert.equal(await prisma.eventSection.count(), EVENT_SECTIONS.length, "sections are replaced, not added");
  assert.equal((await prisma.eventSection.findFirstOrThrow({ where: { blockType: "gallery" } })).visible, true);

  await setEventStatus("sis-dubai-2099", "PUBLISHED", meta);
  const pub = (await getPublicEvent("sis-dubai-2099"))!;
  assert.equal(pub.content.hero.headline, "Dubai *2099*");
  assert.equal(pub.details.city, "Abu Dhabi");
  assert.deepEqual((await listPublicEvents()).map((e) => e.slug), ["sis-dubai-2099"]);

  await setEventStatus("sis-dubai-2099", "ARCHIVED", meta);
  assert.equal(await getPublicEvent("sis-dubai-2099"), null);
  const log2 = await audit("EVENT_STATUS_CHANGED");
  assert.deepEqual(log2.map((l) => (l.newValue as { status: string }).status), ["PUBLISHED", "ARCHIVED"]);
  await setEventStatus("sis-dubai-2099", "ARCHIVED", meta);
  assert.equal((await audit("EVENT_STATUS_CHANGED")).length, 2, "no change, no audit row");
});

test("saving or changing an event that does not exist, or with bad content, writes nothing", async () => {
  await assert.rejects(setEventStatus("nope", "PUBLISHED", meta), (e: EventStoreError) => e.code === "NOT_FOUND");
  await createEvent({ slug: "sis-dubai-2099", details, kind: "past" }, meta);
  const edit = (await getEventForEdit("sis-dubai-2099"))!;
  await assert.rejects(saveEvent("sis-dubai-2099", { details: { ...edit.details, endsAt: "2099-01-01" }, content: edit.content, expectedUpdatedAt: edit.updatedAt.toISOString() }, meta), (e: EventStoreError) => e.code === "INVALID");
  await assert.rejects(saveEvent("nope", { ...edit, expectedUpdatedAt: edit.updatedAt.toISOString() }, meta), (e: EventStoreError) => e.code === "NOT_FOUND");
  assert.equal((await audit("EVENT_UPDATED")).length, 0);
});

test("a stored section that no longer fits falls back to the default instead of breaking the page", async () => {
  await createEvent({ slug: "sis-dubai-2099", details, kind: "upcoming" }, meta);
  await prisma.eventSection.updateMany({ where: { blockType: "faq" }, data: { data: { visible: "maybe" } } });
  const log = console.error;
  console.error = () => {};
  try {
    const edit = (await getEventForEdit("sis-dubai-2099"))!;
    assert.equal(edit.content.faq.visible, true);
    assert.deepEqual(edit.content.faq.items, []);
  } finally {
    console.error = log;
  }
});

test("re-running the seed keeps the admin's category edits and fills in only what is missing", async () => {
  const seed = () => {
    const r = spawnSync(process.execPath, ["--experimental-strip-types", "prisma/seed.ts"], { env: process.env, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr || r.stdout);
  };
  seed();
  const cat = await prisma.registrationCategory.findFirstOrThrow({ where: { event: { slug: "sism-2026" } }, orderBy: { slug: "asc" } });
  await prisma.registrationCategory.update({ where: { id: cat.id }, data: { feeCents: cat.feeCents + 1234, active: !cat.active, seatLimit: 7 } });
  const total = await prisma.registrationCategory.count();
  await prisma.registrationCategory.delete({ where: { id: (await prisma.registrationCategory.findFirstOrThrow({ where: { id: { not: cat.id } } })).id } });
  seed();
  const after = await prisma.registrationCategory.findUniqueOrThrow({ where: { id: cat.id } });
  assert.equal(after.feeCents, cat.feeCents + 1234);
  assert.equal(after.active, !cat.active);
  assert.equal(after.seatLimit, 7);
  assert.equal(await prisma.registrationCategory.count(), total, "the deleted-then-reseeded category comes back, nothing is duplicated");
});

test("a save from an out-of-date editor is refused with STALE and writes nothing; the next save uses the returned version", async () => {
  await createEvent({ slug: "sis-dubai-2099", details, kind: "upcoming" }, meta);
  const first = (await getEventForEdit("sis-dubai-2099"))!;
  const second = (await getEventForEdit("sis-dubai-2099"))!;
  const mine = (e: typeof first, headline: string) => ({ details: e.details, content: { ...e.content, hero: { ...e.content.hero, headline } }, expectedUpdatedAt: e.updatedAt.toISOString() });
  const next = await saveEvent("sis-dubai-2099", mine(first, "First *editor*"), meta);
  assert.ok(next > first.updatedAt.toISOString());
  await assert.rejects(saveEvent("sis-dubai-2099", mine(second, "Second editor"), meta), (e: EventStoreError) => e.code === "STALE");
  assert.equal((await getEventForEdit("sis-dubai-2099"))!.content.hero.headline, "First *editor*");
  assert.equal((await audit("EVENT_UPDATED")).length, 1);
  await saveEvent("sis-dubai-2099", { ...mine(second, "Third *editor*"), expectedUpdatedAt: next }, meta);
  await assert.rejects(saveEvent("sis-dubai-2099", { ...mine(second, "x"), expectedUpdatedAt: "not a date" }, meta), (e: EventStoreError) => e.code === "INVALID");
});

test("two saves from the same version at the same moment: exactly one wins", async () => {
  await createEvent({ slug: "sis-dubai-2099", details, kind: "upcoming" }, meta);
  const e = (await getEventForEdit("sis-dubai-2099"))!;
  const attempt = (headline: string) => saveEvent("sis-dubai-2099", { details: e.details, content: { ...e.content, hero: { ...e.content.hero, headline } }, expectedUpdatedAt: e.updatedAt.toISOString() }, meta);
  const results = await Promise.allSettled([attempt("A"), attempt("B"), attempt("C")]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  for (const r of results) if (r.status === "rejected") assert.equal((r.reason as EventStoreError).code, "STALE");
  assert.equal((await audit("EVENT_UPDATED")).length, 1);
});
