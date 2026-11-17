import { test } from "node:test";
import assert from "node:assert/strict";
import { formDefinitionSchema, isIsoDate } from "./definition.ts";

const one = (...fields: object[]) => ({ formatVersion: 1, steps: [{ id: "s1", title: "Step", fields }] });
const name = { key: "name", type: "text", label: "Name" };
const role = { key: "role", type: "radio", label: "Role", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] };

/** The messages the definition is refused with, all in one string. */
function refused(def: unknown): string {
  const r = formDefinitionSchema.safeParse(def);
  assert.equal(r.success, false, "expected the definition to be refused");
  return r.success ? "" : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
}
const accepted = (def: unknown) => assert.equal(formDefinitionSchema.safeParse(def).success, true);

test("a minimal definition parses and gets its defaults", () => {
  const d = formDefinitionSchema.parse(one(name));
  const f = d.steps[0].fields[0];
  assert.deepEqual([f.type, "required" in f && f.required, "sensitive" in f && f.sensitive, "maxLength" in f && f.maxLength], ["text", false, false, 200]);
});

test("every field type is accepted", () => {
  accepted(one(
    name,
    { key: "bio", type: "textarea", label: "Bio" },
    { key: "mail", type: "email", label: "Email" },
    { key: "tel", type: "phone", label: "Phone" },
    { key: "n", type: "number", label: "N", min: 1, max: 5, integer: true },
    { key: "d", type: "date", label: "D", min: "2020-01-01", max: "2030-12-31" },
    role,
    { key: "sel", type: "select", label: "Sel", options: [{ value: "x", label: "X" }] },
    { key: "boxes", type: "checkboxes", label: "Boxes", options: [{ value: "x", label: "X" }, { value: "y", label: "Y" }], minSelected: 1, maxSelected: 2 },
    { key: "c", type: "country", label: "Country" },
    { key: "f", type: "file", label: "File", accept: ["pdf", "png"], maxBytes: 1000, maxFiles: 2 },
    { key: "ok", type: "consent", label: "I agree to the", link: { text: "Terms", href: "/terms-conditions" } },
    { key: "utm", type: "hidden", label: "UTM", source: "utm_source" },
    { key: "h", type: "heading", text: "Section" },
    { key: "i", type: "info", text: "Some help" },
  ));
});

test("wrong format version, unknown properties and bad shapes are refused", () => {
  assert.match(refused({ ...one(name), formatVersion: 2 }), /formatVersion/);
  assert.match(refused({ ...one(name), extra: 1 }), /extra|Unrecognized/i);
  assert.match(refused(one({ ...name, visibleWen: {} })), /Unrecognized/i);
  assert.match(refused({ formatVersion: 1, steps: [] }), /steps/);
  assert.match(refused(one()), /fields/);
  assert.match(refused(one({ key: "x", type: "slider", label: "X" })), /type/);
  for (const k of ["1abc", "has space", "__proto__", "_x", "a-b", "", "x".repeat(65)]) assert.match(refused(one({ ...name, key: k })), /key/, k);
});

test("duplicate field keys and step ids are refused", () => {
  assert.match(refused(one(name, { ...name, label: "Again" })), /"name" is used twice/);
  const two = { formatVersion: 1, steps: [{ id: "s", title: "A", fields: [name] }, { id: "s", title: "B", fields: [{ ...name, key: "other" }] }] };
  assert.match(refused(two), /Step id "s" is used twice/);
  // keys are unique across steps, not only inside one
  const across = { formatVersion: 1, steps: [{ id: "a", title: "A", fields: [name] }, { id: "b", title: "B", fields: [name] }] };
  assert.match(refused(across), /"name" is used twice/);
});

test("options, ranges and patterns are checked", () => {
  assert.match(refused(one({ ...role, options: [{ value: "a", label: "A" }, { value: "a", label: "Again" }] })), /same value/);
  assert.match(refused(one({ ...role, options: [] })), /options/);
  assert.match(refused(one({ ...name, minLength: 20, maxLength: 10 })), /minLength is more than maxLength/);
  assert.match(refused(one({ key: "n", type: "number", label: "N", min: 5, max: 1 })), /min is more than max/);
  assert.match(refused(one({ key: "d", type: "date", label: "D", min: "2030-01-01", max: "2020-01-01" })), /min is after max/);
  assert.match(refused(one({ key: "d", type: "date", label: "D", min: "2020-02-30" })), /real date/);
  assert.match(refused(one({ key: "b", type: "checkboxes", label: "B", options: [{ value: "x", label: "X" }], minSelected: 2 })), /can't be met/);
  assert.match(refused(one({ key: "f", type: "file", label: "F", accept: ["exe"] })), /accept/);
  assert.match(refused(one({ key: "f", type: "file", label: "F", maxBytes: 26 * 1024 * 1024 })), /maxBytes/);
  assert.match(refused(one({ key: "c", type: "consent", label: "C", link: { text: "T", href: "https://evil.example/x" } })), /path on this site/);
  assert.match(refused(one({ key: "c", type: "consent", label: "C", link: { text: "T", href: "//evil.example" } })), /path on this site/);
});

test("patterns must compile, carry a message and be free of obvious catastrophic shapes", () => {
  accepted(one({ ...name, pattern: "^[A-Z0-9]{6,12}$", patternMessage: "Letters and digits" }));
  assert.match(refused(one({ ...name, pattern: "^[A-Z]+$" })), /patternMessage/);
  assert.match(refused(one({ ...name, pattern: "([", patternMessage: "x" })), /not a valid pattern/);
  assert.match(refused(one({ ...name, pattern: "(a+)+$", patternMessage: "x" })), /repeat inside a repeat/);
  assert.match(refused(one({ ...name, pattern: "(.*a){1,}", patternMessage: "x" })), /repeat inside a repeat/);
  assert.match(refused(one({ ...name, pattern: "(a)\\1", patternMessage: "x" })), /back-references/);
  assert.match(refused(one({ ...name, pattern: "a".repeat(201), patternMessage: "x" })), /pattern/);
});

test("conditions: valid ones pass, including all/any and every operator", () => {
  accepted(one(
    role,
    { key: "n", type: "number", label: "N" },
    { key: "d", type: "date", label: "D" },
    { key: "a", type: "text", label: "A", visibleWhen: { field: "role", op: "equals", value: "a" } },
    { key: "b", type: "text", label: "B", visibleWhen: { field: "role", op: "not_equals", value: "a" } },
    { key: "c", type: "text", label: "C", visibleWhen: { field: "role", op: "in", value: ["a", "b"] } },
    { key: "e", type: "text", label: "E", visibleWhen: { field: "role", op: "is_empty" } },
    { key: "f", type: "text", label: "F", requiredWhen: { field: "role", op: "is_not_empty" } },
    { key: "g", type: "text", label: "G", visibleWhen: { all: [{ field: "n", op: "greater_than", value: 3 }, { field: "d", op: "less_than", value: "2030-01-01" }] } },
    { key: "h", type: "heading", text: "H", visibleWhen: { any: [{ field: "role", op: "equals", value: "a" }, { field: "n", op: "is_empty" }] } },
  ));
});

test("a condition may not point at an unknown, later or its own field", () => {
  const dep = { key: "dep", type: "text", label: "Dep", visibleWhen: { field: "role", op: "equals", value: "a" } };
  assert.match(refused(one({ ...dep, visibleWhen: { field: "ghost", op: "is_not_empty" } })), /Field "dep" depends on "ghost".*earlier/);
  assert.match(refused(one(dep, role)), /Field "dep" depends on "role", which is either not in the form or comes later/);
  assert.match(refused(one({ ...dep, visibleWhen: { field: "dep", op: "is_not_empty" } })), /condition on itself/);
  assert.match(refused(one({ ...dep, requiredWhen: { field: "dep", op: "is_not_empty" } })), /condition on itself/);
  // a loop (a shows when b is set, b shows when a is set) can only be written with a forward reference, so it is refused
  assert.match(refused(one(
    { key: "a", type: "text", label: "A", visibleWhen: { field: "b", op: "is_not_empty" } },
    { key: "b", type: "text", label: "B", visibleWhen: { field: "a", op: "is_not_empty" } },
  )), /Field "a" depends on "b"/);
  // the same rule across steps: a step may look at earlier steps only
  const steps = { formatVersion: 1, steps: [
    { id: "one", title: "One", visibleWhen: { field: "later", op: "is_not_empty" }, fields: [name] },
    { id: "two", title: "Two", fields: [{ key: "later", type: "text", label: "Later" }] },
  ] };
  assert.match(refused(steps), /Step "one" depends on "later"/);
  accepted({ formatVersion: 1, steps: [
    { id: "one", title: "One", fields: [role] },
    { id: "two", title: "Two", visibleWhen: { field: "role", op: "equals", value: "a" }, fields: [name] },
  ] });
});

test("a condition must make sense for the field it looks at", () => {
  const n = { key: "n", type: "number", label: "N" };
  const test1 = (leaf: object) => refused(one(role, n, { key: "d", type: "date", label: "D" }, { key: "k", type: "consent", label: "K" }, { key: "x", type: "text", label: "X", visibleWhen: leaf }));
  assert.match(test1({ field: "role", op: "equals", value: "zzz" }), /not one of the options/);
  assert.match(test1({ field: "role", op: "in", value: ["a", "zzz"] }), /not one of the options/);
  assert.match(test1({ field: "role", op: "equals", value: 5 }), /must be a string/);
  assert.match(test1({ field: "n", op: "equals", value: "5" }), /must be a number/);
  assert.match(test1({ field: "k", op: "equals", value: "yes" }), /must be a boolean/);
  assert.match(test1({ field: "role", op: "greater_than", value: 3 }), /needs a number/);
  assert.match(test1({ field: "d", op: "greater_than", value: 3 }), /needs a date/);
  assert.match(test1({ field: "n", op: "less_than", value: "x" }), /less_than|value/);
  assert.match(refused(one({ key: "c", type: "country", label: "C" }, { key: "x", type: "text", label: "X", visibleWhen: { field: "c", op: "equals", value: "Atlantis" } })), /country list/);
  assert.match(refused(one({ key: "h", type: "heading", text: "H" }, { ...name, visibleWhen: { field: "h", op: "is_not_empty" } })), /a heading/);
  assert.match(refused(one({ key: "f", type: "file", label: "F" }, { ...name, visibleWhen: { field: "f", op: "is_not_empty" } })), /file upload/);
  assert.match(refused(one(role, { ...name, visibleWhen: { all: [] } })), /all/);
  assert.match(refused(one(role, { ...name, visibleWhen: { field: "role", op: "contains", value: "a" } })), /op|Invalid/i);
});

test("two fields cannot map to the same participant attribute, and the field cap holds", () => {
  assert.match(refused(one({ ...name, maps: "email" }, { key: "e2", type: "email", label: "E", maps: "email" })), /Two fields map to "email"/);
  assert.match(refused(one({ ...name, maps: "shoeSize" })), /maps/);
  const many = (n: number) => ({ formatVersion: 1, steps: Array.from({ length: 3 }, (_, s) => ({ id: `s${s}`, title: "S", fields: Array.from({ length: n }, (_, i) => ({ key: `f${s}_${i}`, type: "text", label: "F" })) })) });
  accepted(many(60));
  assert.match(refused(many(80)), /at most 200 fields/);
});

test("isIsoDate accepts real calendar dates only", () => {
  for (const ok of ["2026-03-14", "2024-02-29", "1999-12-31"]) assert.equal(isIsoDate(ok), true, ok);
  for (const no of ["2026-02-30", "2025-02-29", "2026-13-01", "2026-3-4", "26-03-14", "2026-03-14T00:00", "", "abcd-ef-gh"]) assert.equal(isIsoDate(no), false, no);
});
