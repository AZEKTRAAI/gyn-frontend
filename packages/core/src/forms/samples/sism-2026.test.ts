import { test } from "node:test";
import assert from "node:assert/strict";
import { formDefinitionSchema } from "../definition.ts";
import { buildSubmission, validateAnswers } from "../engine.ts";
import { attendeeFormSource, invitationFormSource, GENDERS, HEARD_FROM } from "./sism-2026.ts";
import { attendeeSchema, invitationSchema, GENDERS as LIVE_GENDERS, HEARD_FROM as LIVE_HEARD_FROM } from "../../../../../features/registration/schema.ts";

const attendee = formDefinitionSchema.parse(attendeeFormSource);
const invitation = formDefinitionSchema.parse(invitationFormSource);

const attendeeOk = {
  fullName: "Aisha Khan", email: "Aisha@Example.org", nationality: "Pakistan", countryOfResidence: "Malaysia",
  whatsapp: "+60 12 345 6789", gender: "Female", heardFrom: "Google", terms: true,
};
const invitationOk = { fullName: "Aisha Khan", email: "aisha@example.org", contactNumber: "+92 300 1234567", passportNumber: "ab123456", nationality: "Pakistan", terms: true };

test("the option lists match the live registration schema", () => {
  assert.deepEqual([...GENDERS], [...LIVE_GENDERS]);
  assert.deepEqual([...HEARD_FROM], [...LIVE_HEARD_FROM]);
});

test("attendee form (Forum Access, Self-Funded): collects what the live form collects", () => {
  const keys = attendee.steps.flatMap((s) => s.fields.map((f) => f.key));
  assert.deepEqual(keys, ["fullName", "email", "nationality", "countryOfResidence", "whatsapp", "gender", "heardFrom", "terms"]);
  assert.deepEqual(keys.filter((k) => k !== "terms").sort(), Object.keys(attendeeSchema.shape).sort());
  const s = buildSubmission(attendee, attendeeOk);
  assert.ok(s.ok, JSON.stringify(!s.ok && s.errors));
  if (!s.ok) return;
  assert.equal(s.answers.email.value, "aisha@example.org");
  assert.equal(s.answers.whatsapp.value, "+60123456789");
  assert.deepEqual(s.mapped, { fullName: "Aisha Khan", email: "aisha@example.org", nationality: "Pakistan", countryOfResidence: "Malaysia", whatsapp: "+60123456789", gender: "Female" });
  assert.deepEqual(s.sensitive, []);
  assert.deepEqual(s.files, []);
});

test("attendee form: heardFrom is optional, everything else is required, terms must be accepted", () => {
  const { heardFrom: _h, ...withoutHeard } = attendeeOk;
  void _h;
  assert.equal(validateAnswers(attendee, withoutHeard).ok, true);
  const empty = validateAnswers(attendee, {});
  assert.deepEqual(Object.keys(empty.errors).sort(), ["countryOfResidence", "email", "fullName", "gender", "nationality", "terms", "whatsapp"]);
  assert.equal(empty.errors.terms, "You need to agree to the Terms and Conditions");
  assert.equal(validateAnswers(attendee, { ...attendeeOk, terms: false }).ok, false);
});

test("attendee form agrees with the live schema on the same inputs", () => {
  const cases: Record<string, unknown>[] = [
    {}, { fullName: "A" }, { fullName: "<b>Aisha</b>" }, { email: "nope" }, { gender: "Other" }, { gender: "" },
    { heardFrom: "Radio" }, { heardFrom: "" }, { fullName: "x".repeat(121) },
  ];
  for (const over of cases) {
    const live = attendeeSchema.safeParse({ fullName: "Aisha Khan", email: "a@b.co", nationality: "Pakistan", countryOfResidence: "Malaysia", whatsapp: "+60 12 345 6789", gender: "Female", ...over });
    const now = validateAnswers(attendee, { ...attendeeOk, ...over });
    if (!live.success) assert.equal(now.ok, false, JSON.stringify(over));
    else assert.equal(now.ok, true, JSON.stringify(over));
  }
});

test("invitation letter form: passport is sensitive, upper-cased and format-checked", () => {
  const keys = invitation.steps.flatMap((s) => s.fields.map((f) => f.key));
  assert.deepEqual(keys.filter((k) => k !== "terms").sort(), Object.keys(invitationSchema.shape).sort());
  const s = buildSubmission(invitation, invitationOk);
  assert.ok(s.ok, JSON.stringify(!s.ok && s.errors));
  if (!s.ok) return;
  assert.equal(s.answers.passportNumber.value, "AB123456");
  assert.deepEqual(s.sensitive, ["passportNumber"]);
  assert.equal(s.answers.contactNumber.value, "+923001234567");
  for (const bad of ["12345", "A1234567890123", "AB 1234", "AB-12345", "<script>"]) {
    assert.ok(validateAnswers(invitation, { ...invitationOk, passportNumber: bad }).errors.passportNumber, bad);
    assert.equal(invitationSchema.safeParse({ ...invitationOk, passportNumber: bad }).success, false, `live schema agrees on ${bad}`);
  }
});

test("both forms are the whole definition: one step, a consent with a link to the terms page", () => {
  for (const d of [attendee, invitation]) {
    assert.equal(d.steps.length, 1);
    const consent = d.steps[0].fields.at(-1);
    assert.ok(consent?.type === "consent" && consent.required && consent.link?.href === "/terms-conditions");
  }
});
