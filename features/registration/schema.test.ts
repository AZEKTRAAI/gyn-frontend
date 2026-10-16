import { test } from "node:test";
import assert from "node:assert/strict";
import { registrationInput, TICKETS } from "./schema.ts";

const attendee = {
  fullName: "Amina Bello", email: "amina@example.com", nationality: "Nigeria",
  countryOfResidence: "Nigeria", whatsapp: "+234 803 123 4567", gender: "Female",
};

test("valid forum access registration parses", () => {
  const r = registrationInput.safeParse({ ticket: "forum-access", details: attendee, consent: true });
  assert.equal(r.success, true);
});

test("consent must be true", () => {
  const r = registrationInput.safeParse({ ticket: "forum-access", details: attendee, consent: false });
  assert.equal(r.success, false);
});

test("a client-sent price is ignored, not trusted", () => {
  const r = registrationInput.safeParse({ ticket: "self-funded", details: attendee, consent: true, amountCents: 1 });
  assert.equal(r.success, true);
  assert.equal("amountCents" in (r.data as object), false);
  assert.equal(TICKETS["self-funded"].amountCents, 39900);
});

test("invitation letter needs a passport number and uppercases it", () => {
  const base = { fullName: "Md Nafi", email: "nafi@example.com", contactNumber: "+880 1711 000000", nationality: "Bangladesh" };
  assert.equal(registrationInput.safeParse({ ticket: "invitation-letter", details: base, consent: true }).success, false);
  const r = registrationInput.safeParse({ ticket: "invitation-letter", details: { ...base, passportNumber: "ab1234567" }, consent: true });
  assert.equal(r.success, true);
  if (r.success && r.data.ticket === "invitation-letter") assert.equal(r.data.details.passportNumber, "AB1234567");
});

test("closed and unlisted tiers are not registrable", () => {
  for (const ticket of ["fully-funded", "partially-funded", "forum-access-discounted"]) {
    assert.equal(registrationInput.safeParse({ ticket, details: attendee, consent: true }).success, false);
  }
});

test("the old orientation options are rejected as genders", () => {
  const r = registrationInput.safeParse({ ticket: "forum-access", details: { ...attendee, gender: "Homosexual" }, consent: true });
  assert.equal(r.success, false);
});
