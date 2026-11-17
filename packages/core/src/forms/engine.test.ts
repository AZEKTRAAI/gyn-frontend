import { test } from "node:test";
import assert from "node:assert/strict";
import { formDefinitionSchema, type FileField } from "./definition.ts";
import { buildSubmission, checkFile, normalizeAnswers, validateAnswers, visibleFields, FORM_ERROR } from "./engine.ts";

const parse = (fields: object[]) => formDefinitionSchema.parse({ formatVersion: 1, steps: [{ id: "s", title: "S", fields }] });
/** Error message for one field given one answer (the field is optional unless `over` says otherwise). */
function errorFor(field: object, answer: unknown, key = "x") {
  const d = parse([{ key, label: "Thing", ...field }]);
  return validateAnswers(d, { [key]: answer }).errors[key];
}
function valueFor(field: object, answer: unknown, key = "x") {
  const d = parse([{ key, label: "Thing", ...field }]);
  const r = validateAnswers(d, { [key]: answer });
  assert.deepEqual(r.errors, {}, `unexpected error for ${JSON.stringify(answer)}`);
  return r.values[key];
}

// A form that uses every type and every kind of condition. Step "visa" only appears when needsVisa is "yes".
const opt = (...v: string[]) => v.map((x) => ({ value: x, label: x.toUpperCase() }));
const form = formDefinitionSchema.parse({
  formatVersion: 1,
  steps: [
    {
      id: "about", title: "About you",
      fields: [
        { key: "intro", type: "heading", text: "About you" },
        { key: "name", type: "text", label: "Full name", required: true, minLength: 2, maxLength: 50, maps: "fullName" },
        { key: "email", type: "email", label: "Email", required: true, maps: "email" },
        { key: "age", type: "number", label: "Age", integer: true, min: 10, max: 99 },
        { key: "minorNote", type: "info", text: "Under 18s need a guardian", visibleWhen: { field: "age", op: "less_than", value: 18 } },
        { key: "guardian", type: "text", label: "Guardian name", requiredWhen: { field: "age", op: "less_than", value: 18 } },
        { key: "role", type: "radio", label: "Role", required: true, options: opt("student", "professional", "other") },
        { key: "school", type: "text", label: "School", required: true, visibleWhen: { field: "role", op: "equals", value: "student" } },
        { key: "employer", type: "text", label: "Employer", visibleWhen: { field: "role", op: "in", value: ["professional", "other"] }, requiredWhen: { field: "role", op: "equals", value: "professional" } },
        { key: "interests", type: "checkboxes", label: "Interests", options: opt("a", "b", "c"), maxSelected: 2 },
        { key: "notA", type: "text", label: "Not-A follow-up", visibleWhen: { field: "interests", op: "not_equals", value: "a" } },
        { key: "needsVisa", type: "radio", label: "Need a visa?", required: true, options: opt("yes", "no") },
        { key: "utm", type: "hidden", label: "UTM source" },
      ],
    },
    {
      id: "visa", title: "Visa", visibleWhen: { field: "needsVisa", op: "equals", value: "yes" },
      fields: [
        { key: "passport", type: "text", label: "Passport", required: true, sensitive: true, uppercase: true, pattern: "^[A-Z0-9]{6,12}$", patternMessage: "6 to 12 letters and digits" },
        { key: "scan", type: "file", label: "Passport scan", required: true, accept: ["pdf", "jpg"], maxBytes: 1000 },
        { key: "extraDoc", type: "file", label: "Other document", requiredWhen: { field: "age", op: "greater_than", value: 60 } },
        { key: "dob", type: "date", label: "Date of birth", maps: "dateOfBirth", min: "1900-01-01", max: "2020-12-31" },
        { key: "home", type: "country", label: "Home country", maps: "nationality" },
        { key: "mobile", type: "phone", label: "Mobile", maps: "whatsapp", visibleWhen: { all: [{ field: "dob", op: "is_not_empty" }, { field: "home", op: "is_not_empty" }] } },
        { key: "bio", type: "textarea", label: "Bio", visibleWhen: { any: [{ field: "mobile", op: "is_empty" }, { field: "age", op: "greater_than", value: 90 }] } },
        { key: "terms", type: "consent", label: "I agree to the", required: true, link: { text: "Terms", href: "/terms-conditions" } },
      ],
    },
  ],
});

const base = { name: "Aisha Khan", email: "aisha@example.org", role: "student", school: "LUMS", needsVisa: "no" };
const visaAnswers = { ...base, needsVisa: "yes", passport: "ab123456", terms: true };

// ---- field types --------------------------------------------------------------------------------------------------
test("text: trims, enforces length, required vs optional", () => {
  assert.equal(valueFor({ type: "text", minLength: 2, maxLength: 5 }, "  abc  "), "abc");
  assert.match(errorFor({ type: "text", maxLength: 5 }, "abcdef"), /under 5 characters/);
  assert.match(errorFor({ type: "text", minLength: 3 }, "ab"), /at least 3/);
  assert.match(errorFor({ type: "text", required: true }, "   "), /Thing is required/);
  assert.equal(errorFor({ type: "text" }, "   "), undefined, "optional and blank is fine");
  assert.deepEqual(validateAnswers(parse([{ key: "x", type: "text", label: "T" }]), {}).values, {}, "blank optional answers are not stored");
  assert.equal(valueFor({ type: "text", uppercase: true }, "ab 12"), "AB 12");
  assert.equal(valueFor({ type: "text" }, "line one\nline\ttwo\u0000\u0007"), "line one line two", "control characters and newlines are flattened");
  assert.equal(valueFor({ type: "text" }, "e\u0301"), "\u00e9", "composed to NFC");
});

test("text: a pattern fails with the definition's own message", () => {
  const f = { type: "text", pattern: "^[A-Z]{3}$", patternMessage: "Three capital letters" };
  assert.equal(valueFor(f, "ABC"), "ABC");
  assert.equal(errorFor(f, "abc"), "Three capital letters");
});

test("a custom error message replaces every message of that field", () => {
  const f = { type: "email", required: true, errorMessage: "We need a working email" };
  assert.equal(errorFor(f, ""), "We need a working email");
  assert.equal(errorFor(f, "nope"), "We need a working email");
});

test("textarea keeps line breaks and has a bigger default limit", () => {
  assert.equal(valueFor({ type: "textarea" }, "one\r\ntwo\n\nthree  "), "one\ntwo\n\nthree");
  assert.equal(errorFor({ type: "textarea" }, "x".repeat(5000)), undefined);
  assert.match(errorFor({ type: "textarea" }, "x".repeat(5001)), /5000/);
});

test("email: lower-cased and trimmed, bad ones refused", () => {
  assert.equal(valueFor({ type: "email" }, "  Ahmed.Ali@Example.ORG "), "ahmed.ali@example.org");
  for (const bad of ["plain", "a@b", "@example.org", "a b@example.org", "a@@example.org", "x".repeat(250) + "@example.org", 5, {}, ["a@b.co"]]) {
    assert.match(errorFor({ type: "email" }, bad), /valid email/, String(bad));
  }
});

test("phone: one consistent +digits format, country code required", () => {
  for (const [input, want] of [["+60 12 345 6789", "+60123456789"], ["+60-12-345-6789", "+60123456789"], ["0060 12 345 6789", "+60123456789"], ["+1 (415) 555-0132", "+14155550132"], [" +92.300.1234567 ", "+923001234567"]]) {
    assert.equal(valueFor({ type: "phone" }, input), want, input);
  }
  assert.match(errorFor({ type: "phone" }, "012 345 6789"), /country code/);
  for (const bad of ["+0123456789", "+12", "+1234567890123456", "+60 abc 345 6789", "++60123456789", "+60123456789 ext 5", 60123456789, "+" + "1".repeat(100)]) {
    assert.ok(errorFor({ type: "phone" }, bad), String(bad));
  }
});

test("number: numeric strings are converted, range and integer rules apply", () => {
  assert.equal(valueFor({ type: "number" }, "42"), 42);
  assert.equal(valueFor({ type: "number" }, " -3.5 "), -3.5);
  assert.equal(valueFor({ type: "number" }, 0), 0, "zero is an answer, not blank");
  assert.match(errorFor({ type: "number", min: 10 }, 9), /10 or more/);
  assert.match(errorFor({ type: "number", max: 10 }, "11"), /10 or less/);
  assert.match(errorFor({ type: "number", integer: true }, 1.5), /whole number/);
  for (const bad of ["abc", "1e5", "0x10", "1,000", NaN, Infinity, true, {}, "9".repeat(30)]) assert.match(errorFor({ type: "number" }, bad), /Enter a number/, String(bad));
});

test("date: normalised to YYYY-MM-DD, real dates only, min and max", () => {
  assert.equal(valueFor({ type: "date" }, "2026-03-14"), "2026-03-14");
  assert.equal(valueFor({ type: "date" }, "2026/3/4"), "2026-03-04");
  assert.equal(valueFor({ type: "date" }, " 2026.03.04 "), "2026-03-04");
  for (const bad of ["2026-02-30", "14/03/2026", "March 14", "2026-03-14T10:00:00Z", "", 20260314, "0000-00-00"]) {
    if (bad !== "") assert.match(errorFor({ type: "date" }, bad), /valid date/, String(bad));
  }
  assert.match(errorFor({ type: "date", min: "2026-01-01" }, "2025-12-31"), /on or after 2026-01-01/);
  assert.match(errorFor({ type: "date", max: "2026-01-01" }, "2026-01-02"), /on or before 2026-01-01/);
  assert.equal(errorFor({ type: "date", min: "2026-01-01", max: "2026-01-01" }, "2026-01-01"), undefined);
});

test("select and radio: only listed options", () => {
  for (const type of ["select", "radio"]) {
    const f = { type, options: opt("a", "b") };
    assert.equal(valueFor(f, " a "), "a");
    for (const bad of ["c", "A", ["a"], 1, {}, true]) assert.match(errorFor(f, bad), /Choose one of the options/, `${type} ${String(bad)}`);
  }
});

test("checkboxes: list of listed options, de-duplicated, in option order, min and max", () => {
  const f = { type: "checkboxes", options: opt("a", "b", "c"), minSelected: 1, maxSelected: 2 };
  assert.deepEqual(valueFor(f, ["c", "a", "c"]), ["a", "c"]);
  assert.match(errorFor(f, ["a", "b", "c"]), /at most 2/);
  assert.match(errorFor({ ...f, minSelected: 2 }, ["a"]), /at least 2/);
  assert.equal(errorFor({ type: "checkboxes", options: opt("a") }, []), undefined, "empty list is blank");
  assert.match(errorFor({ type: "checkboxes", options: opt("a"), required: true }, []), /is required/);
  for (const bad of ["a", ["z"], [1], [["a"]], { 0: "a" }, Array(1001).fill("a")]) assert.match(errorFor(f, bad), /Choose/, String(bad));
});

test("country: matches the list case-insensitively and stores the list's spelling", () => {
  assert.equal(valueFor({ type: "country" }, "pakistan"), "Pakistan");
  assert.equal(valueFor({ type: "country" }, " MALAYSIA "), "Malaysia");
  for (const bad of ["Atlantis", "PK", 5, ["Pakistan"], "x".repeat(500)]) assert.match(errorFor({ type: "country" }, bad), /from the list/, String(bad));
});

test("consent: true counts, false is no answer, anything else is refused", () => {
  assert.equal(valueFor({ type: "consent" }, true), true);
  assert.equal(errorFor({ type: "consent" }, false), undefined, "an optional consent can stay unticked");
  assert.deepEqual(validateAnswers(parse([{ key: "x", type: "consent", label: "C" }]), { x: false }).values, {});
  assert.match(errorFor({ type: "consent", required: true }, false), /agree/);
  assert.match(errorFor({ type: "consent", required: true }, undefined), /agree/);
  for (const bad of ["true", "yes", 1, "on", {}]) assert.match(errorFor({ type: "consent", required: true }, bad), /agree/, String(bad));
});

test("hidden fields keep short text; headings and info take no answer", () => {
  assert.equal(valueFor({ type: "hidden" }, " newsletter "), "newsletter");
  assert.match(errorFor({ type: "hidden", maxLength: 10 }, "x".repeat(11)), /under 10/);
  const d = parse([{ key: "h", type: "heading", text: "Hi" }, { key: "i", type: "info", text: "Info" }]);
  assert.deepEqual(validateAnswers(d, { h: "x", i: "y" }), { ok: true, errors: {}, values: {} });
});

test("file fields are not answered in the payload; they are listed as expected files", () => {
  const d = parse([{ key: "f", type: "file", label: "CV", required: true }]);
  assert.deepEqual(validateAnswers(d, { f: "C:\\fakepath\\cv.pdf" }), { ok: true, errors: {}, values: {} });
  const s = buildSubmission(d, {});
  assert.ok(s.ok);
  assert.deepEqual(s.ok && s.files, [{ key: "f", label: "CV", required: true, accept: ["pdf", "jpg", "png"], maxBytes: 5 * 1024 * 1024, maxFiles: 1 }]);
});

test("checkFile: size, extension, empty files", () => {
  const f = parse([{ key: "f", type: "file", label: "F", accept: ["pdf", "jpg"], maxBytes: 2 * 1024 * 1024 }]).steps[0].fields[0] as FileField;
  assert.equal(checkFile(f, { name: "scan.PDF", size: 1000 }), null);
  assert.equal(checkFile(f, { name: "photo.jpeg", size: 1000 }), null, "jpeg counts as jpg");
  assert.match(checkFile(f, { name: "big.pdf", size: 3 * 1024 * 1024 })!, /too large \(the limit is 2 MB\)/);
  assert.match(checkFile(f, { name: "run.exe", size: 10 })!, /Upload a PDF, JPG file/);
  assert.match(checkFile(f, { name: "noextension", size: 10 })!, /Upload a/);
  assert.match(checkFile(f, { name: "pdf", size: 10 })!, /Upload a/, "a name that is just 'pdf' has no extension");
  assert.match(checkFile(f, { name: "a.pdf.exe", size: 10 })!, /Upload a/);
  assert.match(checkFile(f, { name: "empty.pdf", size: 0 })!, /empty/);
});

// ---- conditions ---------------------------------------------------------------------------------------------------
const shown = (answers: unknown) => visibleFields(form, answers).map((v) => v.field.key);

test("equals shows a field; changing the answer hides it again", () => {
  assert.ok(shown(base).includes("school"));
  assert.ok(!shown({ ...base, role: "professional" }).includes("school"));
});

test("in, and requiredWhen only for the matching value", () => {
  const req = (a: unknown, k: string) => visibleFields(form, a).find((v) => v.field.key === k)?.required;
  assert.equal(req({ ...base, role: "other" }, "employer"), false);
  assert.equal(req({ ...base, role: "professional" }, "employer"), true);
  assert.equal(shown({ ...base, role: "student" }).includes("employer"), false);
  assert.match(validateAnswers(form, { ...base, role: "professional", school: undefined }).errors.employer, /required/);
  assert.equal(validateAnswers(form, { ...base, role: "other", school: undefined }).errors.employer, undefined);
});

test("less_than and greater_than on numbers; checkbox not_equals means 'not ticked'", () => {
  assert.ok(shown({ ...base, age: 17 }).includes("minorNote"));
  assert.ok(!shown({ ...base, age: 18 }).includes("minorNote"));
  assert.ok(!shown(base).includes("minorNote"), "unanswered is neither more nor less");
  assert.match(validateAnswers(form, { ...base, age: 17 }).errors.guardian, /required/);
  assert.equal(validateAnswers(form, { ...base, age: 30 }).errors.guardian, undefined);
  assert.ok(shown({ ...base, interests: ["b"] }).includes("notA"));
  assert.ok(shown(base).includes("notA"), "nothing ticked counts as not ticked");
  assert.ok(!shown({ ...base, interests: ["a", "b"] }).includes("notA"));
});

test("a hidden step hides all its fields; a shown one validates them", () => {
  assert.ok(!shown(base).includes("passport"));
  assert.ok(shown({ ...base, needsVisa: "yes" }).includes("passport"));
  assert.equal(validateAnswers(form, base).ok, true);
  const r = validateAnswers(form, { ...base, needsVisa: "yes" });
  assert.deepEqual(Object.keys(r.errors).sort(), ["passport", "terms"]);
});

test("is_empty, is_not_empty, all and any", () => {
  const yes = { ...base, needsVisa: "yes" };
  const keys = (a: unknown) => shown({ ...yes, ...(a as object) });
  assert.ok(!keys({}).includes("mobile"), "all: needs both dob and home");
  assert.ok(!keys({ dob: "1990-01-01" }).includes("mobile"));
  assert.ok(keys({ dob: "1990-01-01", home: "Pakistan" }).includes("mobile"));
  assert.ok(keys({}).includes("bio"), "any: mobile is empty");
  assert.ok(!keys({ dob: "1990-01-01", home: "Pakistan", mobile: "+60123456789", age: 30 }).includes("bio"));
  assert.ok(keys({ dob: "1990-01-01", home: "Pakistan", mobile: "+60123456789", age: 95 }).includes("bio"), "any: second branch");
});

test("a condition sees only valid answers: an invalid age does not trigger the minor rules", () => {
  assert.ok(!shown({ ...base, age: "five" }).includes("minorNote"));
  assert.ok(!shown({ ...base, age: 5 }).includes("minorNote"), "out of range (min 10) is invalid, so unanswered");
});

test("conditions are resolved step by step: a hidden field's old answer cannot keep later fields alive", () => {
  const chain = parse([
    { key: "a", type: "radio", label: "A", options: opt("on", "off") },
    { key: "b", type: "text", label: "B", visibleWhen: { field: "a", op: "equals", value: "on" } },
    { key: "c", type: "text", label: "C", visibleWhen: { field: "b", op: "is_not_empty" } },
  ]);
  assert.deepEqual(normalizeAnswers(chain, { a: "on", b: "x", c: "y" }), { a: "on", b: "x", c: "y" });
  // a is switched off but the browser still sends b and c from before: both go
  assert.deepEqual(normalizeAnswers(chain, { a: "off", b: "x", c: "y" }), { a: "off" });
});

// ---- hidden answers are never kept --------------------------------------------------------------------------------
test("answers to hidden fields are dropped and cannot cause errors", () => {
  const r = validateAnswers(form, { ...base, role: "professional", employer: "ACME", school: 12345, notAField: "x" });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.ok(!("school" in r.values));
  assert.ok(!("notAField" in r.values));
  assert.equal(r.values.employer, "ACME");
});

test("a hidden step's answers are dropped too", () => {
  const r = buildSubmission(form, { ...base, passport: "AB123456", terms: true });
  assert.ok(r.ok);
  assert.ok(r.ok && !("passport" in r.answers) && !("terms" in r.answers));
});

// ---- step validation ----------------------------------------------------------------------------------------------
test("with a step, only that step is checked and returned", () => {
  const partial = { name: "A", needsVisa: "yes" };
  const first = validateAnswers(form, partial, { step: "about" });
  assert.deepEqual(Object.keys(first.errors).sort(), ["email", "name", "role"], "name is too short; school is hidden because role is unanswered");
  assert.ok(!("passport" in first.errors) && !("terms" in first.errors));
  const second = validateAnswers(form, { ...base, needsVisa: "yes" }, { step: "visa" });
  assert.deepEqual(Object.keys(second.errors).sort(), ["passport", "terms"]);
  assert.deepEqual(second.values, {}, "values of other steps are not returned");
  assert.deepEqual(validateAnswers(form, { ...base, needsVisa: "yes", passport: "ab123456", terms: true }, { step: "visa" }).values, { passport: "AB123456", terms: true });
  assert.deepEqual(validateAnswers(form, base, { step: "visa" }), { ok: true, errors: {}, values: {} }, "a hidden step has nothing to check");
  assert.equal(validateAnswers(form, base, { step: "nope" }).errors[FORM_ERROR], "Unknown step");
});

// ---- the whole submission -----------------------------------------------------------------------------------------
test("buildSubmission: labelled snapshot, sensitive keys, expected files, mapped columns", () => {
  const s = buildSubmission(form, { ...visaAnswers, email: " Aisha@Example.org ", age: "20", home: "pakistan", dob: "2000/1/2", mobile: "+92 300 1234567", interests: ["b", "a"] });
  assert.ok(s.ok, JSON.stringify(!s.ok && s.errors));
  if (!s.ok) return;
  assert.deepEqual(Object.keys(s.answers), ["name", "email", "age", "role", "school", "interests", "needsVisa", "passport", "dob", "home", "mobile", "terms"]);
  assert.deepEqual(s.answers.email, { label: "Email", type: "email", value: "aisha@example.org" });
  assert.deepEqual(s.answers.passport, { label: "Passport", type: "text", value: "AB123456" });
  assert.deepEqual(s.answers.interests.value, ["a", "b"]);
  assert.deepEqual(s.sensitive, ["passport"]);
  assert.deepEqual(s.files.map((f) => [f.key, f.required]), [["scan", true], ["extraDoc", false]]);
  assert.deepEqual(s.mapped, { fullName: "Aisha Khan", email: "aisha@example.org", dateOfBirth: "2000-01-02", nationality: "Pakistan", whatsapp: "+923001234567" });
});

test("buildSubmission: a field required through requiredWhen shows up as a required file", () => {
  const s = buildSubmission(form, { ...visaAnswers, age: 70 });
  assert.ok(s.ok && s.files.find((f) => f.key === "extraDoc")?.required);
});

test("buildSubmission refuses a bad submission with per-field errors and stores nothing", () => {
  const s = buildSubmission(form, { name: "A", email: "x", role: "pilot", needsVisa: "maybe" });
  assert.equal(s.ok, false);
  assert.deepEqual(!s.ok && Object.keys(s.errors).sort(), ["email", "name", "needsVisa", "role"]);
  assert.ok(!s.ok && !("answers" in s));
});

test("the engine does not change its input", () => {
  const input = { ...visaAnswers, interests: ["b", "a"] };
  const copy = structuredClone(input);
  buildSubmission(form, input);
  assert.deepEqual(input, copy);
});

// ---- hostile input ------------------------------------------------------------------------------------------------
test("payloads that are not objects are refused as a whole", () => {
  for (const bad of [null, undefined, "text", 5, [], [["name", "x"]], true]) {
    const r = validateAnswers(form, bad);
    assert.equal(r.ok, false);
    assert.ok(r.errors[FORM_ERROR], String(bad));
    assert.equal(buildSubmission(form, bad).ok, false);
    assert.deepEqual(normalizeAnswers(form, bad), {});
  }
});

test("prototype pollution keys and unexpected keys change nothing", () => {
  // JSON.parse makes "__proto__" a real own key, which is how it arrives from a request body
  const payload = JSON.parse(JSON.stringify({ ...base, constructor: { prototype: { polluted: true } }, prototype: 1, toString: "x", hasOwnProperty: "x" }).replace("{", '{"__proto__":{"polluted":true},'));
  assert.ok(Object.hasOwn(payload, "__proto__"));
  const r = buildSubmission(form, payload);
  assert.ok(r.ok);
  assert.equal(({} as Record<string, unknown>).polluted, undefined, "Object.prototype untouched");
  assert.deepEqual(r.ok && Object.keys(r.answers), ["name", "email", "role", "school", "needsVisa"]);
  assert.equal(Object.getPrototypeOf(r.ok ? r.answers : {}), Object.prototype);
});

test("a field is only read from the payload's own keys, never inherited ones", () => {
  const inherited = Object.create({ name: "Inherited Name", email: "a@b.co" });
  const r = validateAnswers(form, inherited);
  assert.equal(r.ok, false, "a payload with a foreign prototype is not a plain object");
  const plain = { ...base };
  Object.setPrototypeOf(plain, { school: "Injected" });
  assert.equal(validateAnswers(form, plain).ok, false);
  // even a field named like an Object.prototype member is looked up as an own key only
  const tricky = parse([{ key: "constructor", type: "text", label: "C" }, { key: "toString", type: "text", label: "T" }]);
  assert.deepEqual(normalizeAnswers(tricky, {}), {});
  assert.deepEqual(normalizeAnswers(tricky, { constructor: "ok", toString: "fine" }), { constructor: "ok", toString: "fine" });
});

test("very long strings are refused quickly and do not reach the regex", () => {
  const huge = "a".repeat(5_000_000);
  const t0 = performance.now();
  assert.ok(errorFor({ type: "text", pattern: "^(a|b)*$", patternMessage: "no" }, huge));
  for (const type of ["text", "textarea", "email", "phone", "date", "country"]) assert.ok(errorFor({ type }, huge), type);
  assert.ok(errorFor({ type: "select", options: opt("a") }, huge));
  assert.ok(errorFor({ type: "checkboxes", options: opt("a") }, Array(10_000).fill("a")));
  assert.ok(performance.now() - t0 < 1000, "refused without heavy work");
});

test("HTML and script text is kept as plain text, not changed or run", () => {
  const html = `<img src=x onerror=alert(1)> & "quotes" <script>alert('x')</script>`;
  assert.equal(valueFor({ type: "text", maxLength: 200 }, html), html);
  assert.equal(valueFor({ type: "textarea" }, `<b>bold</b>\n<a href="javascript:alert(1)">x</a>`), `<b>bold</b>\n<a href="javascript:alert(1)">x</a>`);
  assert.match(errorFor({ type: "country" }, "<script>"), /from the list/);
});

test("wrong types never throw", () => {
  const weird = [{}, [], [[]], () => 1, Symbol("x"), 10n, new Date(), /re/, Object.create(null), NaN];
  for (const type of ["text", "textarea", "email", "phone", "number", "date", "select", "radio", "checkboxes", "country", "consent", "hidden"]) {
    const extra = ["select", "radio", "checkboxes"].includes(type) ? { options: opt("a") } : {};
    for (const w of weird) assert.doesNotThrow(() => errorFor({ type, required: true, ...extra }, w), `${type} ${typeof w}`);
  }
});

test("a deadly-looking pattern is refused by the definition, so it never runs against input", () => {
  assert.equal(formDefinitionSchema.safeParse({ formatVersion: 1, steps: [{ id: "s", title: "S", fields: [{ key: "x", type: "text", label: "X", pattern: "(a+)+$", patternMessage: "no" }] }] }).success, false);
});
