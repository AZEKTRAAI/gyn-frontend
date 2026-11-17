// The form definition format (version 1): one JSON document, steps -> fields, validated here on save.
// Pure: no database, no React. The engine (engine.ts) runs a parsed definition against participant answers.
// Strict objects everywhere, so a typo like "visibleWen" is an error instead of a silently ignored setting.
import { z } from "zod";
import { COUNTRIES } from "./countries.ts";

export const FORMAT_VERSION = 1;

/** Core participant attributes a field can be tied to, so lists can sort and filter any form by them (SRS 3.4 G). */
export const MAP_ATTRIBUTES = [
  "fullName", "firstName", "middleName", "lastName", "email", "whatsapp",
  "nationality", "gender", "dateOfBirth", "countryOfResidence", "cityOfDeparture",
] as const;
export type MapAttribute = (typeof MAP_ATTRIBUTES)[number];

export const FILE_TYPES = ["pdf", "doc", "docx", "jpg", "png", "webp"] as const;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

const KEY_RE = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date written YYYY-MM-DD (rejects 2027-02-30). */
export function isIsoDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const key = z.string().regex(KEY_RE, "Use letters, digits and underscores, starting with a letter (max 64)");
const isoDate = z.string().refine(isIsoDate, "Use a real date written YYYY-MM-DD");
const text = (max: number) => z.string().trim().min(1).max(max);

// ---- conditions ---------------------------------------------------------------------------------------------------
const scalar = z.union([z.string().max(200), z.number(), z.boolean()]);
const leafSchema = z.discriminatedUnion("op", [
  z.strictObject({ field: key, op: z.enum(["equals", "not_equals"]), value: scalar }),
  z.strictObject({ field: key, op: z.literal("in"), value: z.array(scalar).min(1).max(100) }),
  z.strictObject({ field: key, op: z.enum(["is_empty", "is_not_empty"]) }),
  z.strictObject({ field: key, op: z.enum(["greater_than", "less_than"]), value: z.union([z.number(), isoDate]) }),
]);
/** One test, or several combined: all must hold, or any one. */
export const conditionSchema = z.union([
  leafSchema,
  z.strictObject({ all: z.array(leafSchema).min(1).max(10) }),
  z.strictObject({ any: z.array(leafSchema).min(1).max(10) }),
]);
export type Leaf = z.output<typeof leafSchema>;
export type Condition = z.output<typeof conditionSchema>;

export function leavesOf(c: Condition): Leaf[] {
  return "all" in c ? c.all : "any" in c ? c.any : [c];
}

// ---- fields -------------------------------------------------------------------------------------------------------
const common = {
  key,
  label: text(300),
  help: text(1000).optional(),
  placeholder: text(200).optional(),
  required: z.boolean().default(false),
  // Encrypted at rest (passport numbers and the like). The engine only reports which keys; the store encrypts them.
  sensitive: z.boolean().default(false),
  visibleWhen: conditionSchema.optional(),
  requiredWhen: conditionSchema.optional(),
  maps: z.enum(MAP_ATTRIBUTES).optional(),
  // Replaces every message for this field ("custom error messages", SRS 3.4 D).
  errorMessage: text(200).optional(),
};
const field = <T extends string, S extends z.ZodRawShape>(type: T, shape: S) =>
  z.strictObject({ type: z.literal(type), ...common, ...shape });

const textRules = {
  minLength: z.number().int().min(0).max(10000).optional(),
  pattern: z.string().min(1).max(200).optional(),
  patternMessage: text(200).optional(),
  uppercase: z.boolean().default(false),
};
const option = z.strictObject({ value: text(100), label: text(200) });
const options = z.array(option).min(1).max(200);

const fileField = field("file", {
  // Images are files with an image-only list, so there is no separate image type.
  accept: z.array(z.enum(FILE_TYPES)).min(1).default(["pdf", "jpg", "png"]),
  maxBytes: z.number().int().min(1).max(MAX_FILE_BYTES).default(5 * 1024 * 1024),
  maxFiles: z.number().int().min(1).max(10).default(1),
});

// Non-input items: no answer, only a key (so a condition can show or hide them).
const display = <T extends string>(type: T, max: number) =>
  z.strictObject({ type: z.literal(type), key, text: text(max), visibleWhen: conditionSchema.optional() });

const fieldSchema = z.discriminatedUnion("type", [
  field("text", { ...textRules, maxLength: z.number().int().min(1).max(10000).default(200) }),
  field("textarea", { ...textRules, maxLength: z.number().int().min(1).max(10000).default(5000) }),
  field("email", {}),
  field("phone", {}),
  field("number", { min: z.number().optional(), max: z.number().optional(), integer: z.boolean().default(false) }),
  field("date", { min: isoDate.optional(), max: isoDate.optional() }),
  field("select", { options }),
  field("radio", { options }),
  field("checkboxes", {
    options,
    minSelected: z.number().int().min(1).max(200).optional(),
    maxSelected: z.number().int().min(1).max(200).optional(),
  }),
  field("country", {}),
  fileField,
  field("consent", {
    // The policy page the participant agrees to: an internal path such as /terms-conditions.
    link: z.strictObject({ text: text(100), href: z.string().regex(/^\/(?!\/)[A-Za-z0-9\-_/]*$/, "Use a path on this site, like /terms-conditions") }).optional(),
  }),
  // Filled from the URL (a UTM code) by the renderer; stored as text.
  field("hidden", { source: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/).optional(), maxLength: z.number().int().min(1).max(500).default(200) }),
  display("heading", 300),
  display("info", 2000),
]);
export type Field = z.output<typeof fieldSchema>;
export type InputField = Exclude<Field, { type: "heading" | "info" }>;
export type FileField = Extract<Field, { type: "file" }>;
export type ChoiceField = Extract<Field, { type: "select" | "radio" | "checkboxes" }>;

export const isInput = (f: Field): f is InputField => f.type !== "heading" && f.type !== "info";

const stepSchema = z.strictObject({
  id: key,
  title: text(200),
  description: text(1000).optional(),
  visibleWhen: conditionSchema.optional(),
  fields: z.array(fieldSchema).min(1).max(100),
});

// ---- cross-checks -------------------------------------------------------------------------------------------------
// shortcut: a heuristic, not a proof of safety. It refuses back-references and a quantified group that itself holds a
// quantifier ("(a+)+"). Upgrade to a real regex engine (RE2) if admins ever get untrusted pattern authors.
function patternProblem(p: string): string | null {
  try { new RegExp(p); } catch { return "is not a valid pattern"; }
  if (/\\[1-9k]/.test(p)) return "must not use back-references";
  if (/\([^()]*(?:[+*]|\{\d+,\d*\})[^()]*\)(?:[+*]|\{\d+,\d*\})/.test(p)) return "has a repeat inside a repeat, which can hang the server";
  return null;
}

/** Why `leaf` cannot be evaluated against `target`, or null when it is fine. */
function leafProblem(leaf: Leaf, target: Field): string | null {
  if (!isInput(target)) return `"${leaf.field}" is ${target.type === "heading" ? "a heading" : "info text"}, not a question`;
  if (target.type === "file") return `"${leaf.field}" is a file upload; conditions can't look at files`;
  if (leaf.op === "is_empty" || leaf.op === "is_not_empty") return null;
  if (leaf.op === "greater_than" || leaf.op === "less_than") {
    if (target.type === "number" && typeof leaf.value === "number") return null;
    if (target.type === "date" && typeof leaf.value === "string") return null;
    return `"${leaf.field}" is a ${target.type} field, so ${leaf.op} needs a ${target.type === "date" ? "date" : "number"} to compare with`;
  }
  const values: unknown[] = leaf.op === "in" ? leaf.value : "value" in leaf ? [leaf.value] : [];
  const want = target.type === "number" ? "number" : target.type === "consent" ? "boolean" : "string";
  if (values.some((v) => typeof v !== want)) return `"${leaf.field}" is a ${target.type} field, so the value must be a ${want}`;
  if ("options" in target) {
    const ok = new Set(target.options.map((o) => o.value));
    const bad = values.find((v) => !ok.has(v as string));
    if (bad !== undefined) return `"${String(bad)}" is not one of the options of "${leaf.field}"`;
  }
  if (target.type === "country") {
    const bad = values.find((v) => !COUNTRIES.includes(v as string));
    if (bad !== undefined) return `"${String(bad)}" is not in the country list`;
  }
  return null;
}

const formDefinitionBase = z.strictObject({
  formatVersion: z.literal(FORMAT_VERSION, `This engine reads formatVersion ${FORMAT_VERSION}`),
  steps: z.array(stepSchema).min(1).max(20),
});

export const formDefinitionSchema = formDefinitionBase.superRefine((def, ctx) => {
  const issue = (path: readonly (string | number)[], message: string) => ctx.addIssue({ code: "custom", path: [...path], message });
  const stepIds = new Set<string>();
  const known = new Map<string, Field>(); // fields seen so far, in form order
  const mapped = new Set<string>();
  let total = 0;

  const checkRule = (rule: Condition | undefined, path: (string | number)[], who: string, selfKey?: string) => {
    if (!rule) return;
    for (const leaf of leavesOf(rule)) {
      const target = known.get(leaf.field);
      if (leaf.field === selfKey) issue(path, `${who} has a condition on itself`);
      else if (!target) {
        issue(path, `${who} depends on "${leaf.field}", which is either not in the form or comes later. A condition can only look at a question that appears earlier.`);
      } else {
        const problem = leafProblem(leaf, target);
        if (problem) issue(path, `${who}: ${problem}`);
      }
    }
  };

  def.steps.forEach((step, si) => {
    const sp = ["steps", si] as const;
    if (stepIds.has(step.id)) issue([...sp, "id"], `Step id "${step.id}" is used twice`);
    stepIds.add(step.id);
    checkRule(step.visibleWhen, [...sp, "visibleWhen"], `Step "${step.id}"`);

    step.fields.forEach((f, fi) => {
      const fp = [...sp, "fields", fi] as const;
      const who = `Field "${f.key}"`;
      if (++total > 200) issue(fp, "A form can have at most 200 fields");
      if (known.has(f.key)) issue([...fp, "key"], `Field key "${f.key}" is used twice`);
      checkRule(f.visibleWhen, [...fp, "visibleWhen"], who, f.key);
      if ("requiredWhen" in f) checkRule(f.requiredWhen, [...fp, "requiredWhen"], who, f.key);
      known.set(f.key, f);
      if (!isInput(f)) return;

      if ("options" in f) {
        const vals = f.options.map((o) => o.value);
        if (new Set(vals).size !== vals.length) issue([...fp, "options"], `${who} has two options with the same value`);
      }
      if ("pattern" in f && f.pattern !== undefined) {
        const problem = patternProblem(f.pattern);
        if (problem) issue([...fp, "pattern"], `${who}: the pattern ${problem}`);
        if (!f.patternMessage) issue([...fp, "patternMessage"], `${who}: say in plain words what the pattern expects (patternMessage)`);
      }
      if ("minLength" in f && f.minLength !== undefined && f.minLength > f.maxLength) issue([...fp, "minLength"], `${who}: minLength is more than maxLength`);
      if (f.type === "number" && f.min !== undefined && f.max !== undefined && f.min > f.max) issue([...fp, "min"], `${who}: min is more than max`);
      if (f.type === "date" && f.min && f.max && f.min > f.max) issue([...fp, "min"], `${who}: min is after max`);
      if (f.type === "checkboxes") {
        const lo = f.minSelected ?? 0, hi = f.maxSelected ?? f.options.length;
        if (lo > hi || lo > f.options.length) issue([...fp, "minSelected"], `${who}: minSelected can't be met`);
      }
      if (f.maps) {
        if (mapped.has(f.maps)) issue([...fp, "maps"], `Two fields map to "${f.maps}"`);
        mapped.add(f.maps);
      }
    });
  });
});

export type FormDefinition = z.output<typeof formDefinitionSchema>;
export type FormStep = FormDefinition["steps"][number];
