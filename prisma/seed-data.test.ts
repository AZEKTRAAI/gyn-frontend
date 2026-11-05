// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import eventsJson from "../content/events.json" with { type: "json" };
import { buildSeed } from "./seed-data.ts";

const seed = buildSeed(eventsJson);
const sism = seed.find((e) => e.slug === "sism-2026")!;

test("both events are seeded with the right dates and timezone", () => {
  assert.equal(seed.length, 2);
  assert.equal(sism.timezone, "Asia/Kuala_Lumpur");
  assert.equal(sism.startsAt.toISOString(), "2026-11-18T16:00:00.000Z"); // 19 Nov 00:00 in KL
  const fmst = seed.find((e) => e.slug === "fmst-2026")!;
  assert.equal(fmst.timezone, "Asia/Bangkok");
  assert.ok(fmst.endsAt < new Date("2026-08-01"), "FMST is a past event");
});

test("fees are whole cents taken from the content file", () => {
  const fee = Object.fromEntries(sism.categories.map((c) => [c.slug, c.feeCents]));
  assert.equal(fee["fully-funded"], 1850);
  assert.equal(fee["forum-access"], 19900);
  assert.equal(fee["self-funded"], 39900);
  assert.equal(fee["invitation-letter"], 4900);
});

test("scholarships go to the review panel; confirmed seats and invitation letters are automatic", () => {
  const mode = Object.fromEntries(sism.categories.map((c) => [c.slug, c.approvalMode]));
  assert.equal(mode["fully-funded"], "MANUAL_REVIEW");
  assert.equal(mode["partially-funded"], "MANUAL_REVIEW");
  assert.equal(mode["forum-access"], "AUTOMATIC");
  assert.equal(mode["self-funded"], "AUTOMATIC");
  assert.equal(mode["invitation-letter"], "AUTOMATIC");
});

test("closed scholarships are inactive with a closing time; the unlisted discounted form is not a category", () => {
  const ff = sism.categories.find((c) => c.slug === "fully-funded")!;
  assert.equal(ff.active, false);
  assert.ok(ff.closesAt instanceof Date);
  assert.ok(!sism.categories.some((c) => c.slug === "forum-access-discounted"));
  assert.equal(new Set(sism.categories.map((c) => c.slug)).size, sism.categories.length);
});
