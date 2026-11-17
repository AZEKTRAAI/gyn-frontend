// The form engine: runs a parsed FormDefinition against participant answers. Pure (no database, no React), so the
// public renderer and the submit route use the same code and can't disagree.
//
// Guarantees: only fields visible for these answers are validated or kept; anything else in the payload (hidden fields,
// unknown keys, "__proto__") is dropped, never stored; values come out normalised; text is kept as text (no HTML
// stripping or interpreting, the renderer escapes).
import { z } from "zod";
import { COUNTRIES } from "./countries.ts";
import {
  isInput, isIsoDate,
  type Condition, type Leaf, type FileField, type FormDefinition, type InputField, type Field, type MapAttribute,
} from "./definition.ts";

export type Value = string | number | string[] | true;
export type FieldErrors = Record<string, string>;
/** Errors not tied to one field (payload isn't an object, unknown step) use this key. Real keys can't start with "_". */
export const FORM_ERROR = "_form";

const COUNTRY_BY_LOWER = new Map(COUNTRIES.map((c) => [c.toLowerCase(), c]));
const emailCheck = z.email();
const MAX_RAW = 100_000; // refuse longer strings before doing any work on them

const isRecord = (x: unknown): x is Record<string, unknown> => {
  if (typeof x !== "object" || x === null || Array.isArray(x)) return false;
  const p = Object.getPrototypeOf(x);
  return p === Object.prototype || p === null;
};
const own = (o: Record<string, unknown>, k: string) => (Object.hasOwn(o, k) ? o[k] : undefined);

// An unchecked box (false) counts as no answer, but only for a consent field; anywhere else false is a wrong type.
const isEmpty = (v: unknown, consent: boolean) =>
  v === undefined || v === null || (consent && v === false) || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

// ---- conditions ---------------------------------------------------------------------------------------------------
const matches = (v: Value | undefined, x: unknown) => (Array.isArray(v) ? v.includes(x as string) : v === x);

function testCondition(rule: Condition, values: Record<string, Value>): boolean {
  const leaf = (l: Leaf) => {
    const v = own(values, l.field) as Value | undefined;
    switch (l.op) {
      case "is_empty": return v === undefined;
      case "is_not_empty": return v !== undefined;
      case "equals": return matches(v, l.value);
      case "not_equals": return !matches(v, l.value);
      case "in": return l.value.some((x) => matches(v, x));
      case "greater_than": return v !== undefined && typeof v === typeof l.value && (v as number | string) > l.value;
      case "less_than": return v !== undefined && typeof v === typeof l.value && (v as number | string) < l.value;
    }
  };
  if ("any" in rule) return rule.any.some(leaf);
  if ("all" in rule) return rule.all.every(leaf);
  return leaf(rule);
}

// ---- one value ----------------------------------------------------------------------------------------------------
type Parsed = { value: Value } | { error: string };
const bad = (error: string): Parsed => ({ error });

/** Control characters out, Unicode composed (NFC), trimmed. Multi-line text keeps its line breaks. */
function cleanText(s: string, multiline: boolean): string {
  const t = multiline ? s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "") : s.replace(/[\u0000-\u001F\u007F]+/g, " ");
  return t.normalize("NFC").trim();
}

function parseText(f: Extract<InputField, { type: "text" | "textarea" | "hidden" }>, raw: unknown): Parsed {
  if (typeof raw !== "string") return bad("Enter text");
  if (raw.length > MAX_RAW) return bad(`Keep this under ${f.maxLength} characters`);
  let s = cleanText(raw, f.type === "textarea");
  if ("uppercase" in f && f.uppercase) s = s.toUpperCase();
  if (s.length > f.maxLength) return bad(`Keep this under ${f.maxLength} characters`);
  if ("minLength" in f && f.minLength && s.length < f.minLength) return bad(`Enter at least ${f.minLength} characters`);
  if ("pattern" in f && f.pattern && !new RegExp(f.pattern).test(s)) return bad(f.patternMessage ?? "Check the format");
  return { value: s };
}

function parsePhone(raw: unknown): Parsed {
  if (typeof raw !== "string") return bad("Enter a phone number");
  if (raw.length > 40) return bad("Enter a valid phone number with country code");
  const s = cleanText(raw, false).replace(/[\s().-]/g, "");
  const digits = s.startsWith("+") ? s.slice(1) : s.startsWith("00") ? s.slice(2) : null;
  if (digits === null) return bad("Include the country code, e.g. +60 12 345 6789");
  // E.164: a country code never starts with 0, and the whole number is at most 15 digits.
  if (!/^[1-9][0-9]{6,14}$/.test(digits)) return bad("Enter a valid phone number with country code, e.g. +60 12 345 6789");
  return { value: `+${digits}` };
}

function parseNumber(f: Extract<InputField, { type: "number" }>, raw: unknown): Parsed {
  const n = typeof raw === "number" ? raw : typeof raw === "string" && /^-?\d{1,15}(\.\d{1,10})?$/.test(raw.trim()) ? Number(raw.trim()) : NaN;
  if (!Number.isFinite(n)) return bad("Enter a number");
  if (f.integer && !Number.isInteger(n)) return bad("Enter a whole number");
  if (f.min !== undefined && n < f.min) return bad(`Enter a number of ${f.min} or more`);
  if (f.max !== undefined && n > f.max) return bad(`Enter a number of ${f.max} or less`);
  return { value: n };
}

function parseDate(f: Extract<InputField, { type: "date" }>, raw: unknown): Parsed {
  const m = typeof raw === "string" && raw.length < 20 ? /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(raw.trim()) : null;
  const s = m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : "";
  if (!isIsoDate(s)) return bad("Enter a valid date, e.g. 2026-03-14");
  if (f.min && s < f.min) return bad(`Choose a date on or after ${f.min}`);
  if (f.max && s > f.max) return bad(`Choose a date on or before ${f.max}`);
  return { value: s };
}

function parseValue(f: InputField, raw: unknown): Parsed {
  switch (f.type) {
    case "text": case "textarea": case "hidden": return parseText(f, raw);
    case "email": {
      if (typeof raw !== "string" || raw.length > 254) return bad("Enter a valid email address");
      const s = cleanText(raw, false).toLowerCase();
      return emailCheck.safeParse(s).success ? { value: s } : bad("Enter a valid email address");
    }
    case "phone": return parsePhone(raw);
    case "number": return parseNumber(f, raw);
    case "date": return parseDate(f, raw);
    case "select": case "radio": {
      const s = typeof raw === "string" ? raw.trim() : "";
      return f.options.some((o) => o.value === s) ? { value: s } : bad("Choose one of the options");
    }
    case "checkboxes": {
      if (!Array.isArray(raw) || raw.length > 1000 || raw.some((x) => typeof x !== "string")) return bad("Choose from the options");
      const picked = new Set((raw as string[]).map((x) => x.trim()));
      const known = f.options.map((o) => o.value);
      if ([...picked].some((x) => !known.includes(x))) return bad("Choose from the options");
      const value = known.filter((x) => picked.has(x)); // option order, no duplicates
      if (f.minSelected && value.length < f.minSelected) return bad(`Choose at least ${f.minSelected}`);
      if (f.maxSelected && value.length > f.maxSelected) return bad(`Choose at most ${f.maxSelected}`);
      return { value };
    }
    case "country": {
      const c = typeof raw === "string" && raw.length < 100 ? COUNTRY_BY_LOWER.get(raw.trim().toLowerCase()) : undefined;
      return c ? { value: c } : bad("Choose a country from the list");
    }
    case "consent": return raw === true ? { value: true } : bad("You need to agree to continue");
    case "file": return bad("Upload the file separately");
  }
}

// ---- the walk -----------------------------------------------------------------------------------------------------
type Resolved = { stepId: string; field: Field; required: boolean; error?: string };

/** Walks the form in order. A condition only sees answers of earlier visible, valid fields, so hidden answers can't leak in. */
function resolve(def: FormDefinition, answers: Record<string, unknown>) {
  const items: Resolved[] = [];
  const values: Record<string, Value> = {};
  for (const step of def.steps) {
    if (step.visibleWhen && !testCondition(step.visibleWhen, values)) continue;
    for (const field of step.fields) {
      if (field.visibleWhen && !testCondition(field.visibleWhen, values)) continue;
      if (!isInput(field)) { items.push({ stepId: step.id, field, required: false }); continue; }
      const required = field.required || (!!field.requiredWhen && testCondition(field.requiredWhen, values));
      const item: Resolved = { stepId: step.id, field, required };
      items.push(item);
      if (field.type === "file") continue; // files arrive separately; see expected files and checkFile
      const raw = own(answers, field.key);
      if (isEmpty(raw, field.type === "consent")) {
        if (required) item.error = field.errorMessage ?? (field.type === "consent" ? "You need to agree to continue" : `${field.label} is required`);
        continue;
      }
      const r = parseValue(field, raw);
      if ("error" in r) item.error = field.errorMessage ?? r.error;
      else values[field.key] = r.value;
    }
  }
  return { items, values };
}

export type VisibleField = { step: string; field: Field; required: boolean };

/** The fields (and headings, info text) to show for these answers, in order, with `required` resolved. */
export function visibleFields(def: FormDefinition, answers: unknown): VisibleField[] {
  return resolve(def, isRecord(answers) ? answers : {}).items.map(({ stepId, field, required }) => ({ step: stepId, field, required }));
}

/** Clean values of the visible fields that hold a valid answer. Everything else is dropped. */
export function normalizeAnswers(def: FormDefinition, answers: unknown): Record<string, Value> {
  return resolve(def, isRecord(answers) ? answers : {}).values;
}

export type Validation = { ok: boolean; errors: FieldErrors; values: Record<string, Value> };

/** Per-field errors for visible fields only. With `step`, only that step's fields are checked and returned. */
export function validateAnswers(def: FormDefinition, answers: unknown, opts: { step?: string } = {}): Validation {
  if (!isRecord(answers)) return { ok: false, errors: { [FORM_ERROR]: "The form data could not be read. Please reload and try again." }, values: {} };
  if (opts.step !== undefined && !def.steps.some((s) => s.id === opts.step)) return { ok: false, errors: { [FORM_ERROR]: "Unknown step" }, values: {} };
  const { items, values } = resolve(def, answers);
  const scope = opts.step === undefined ? items : items.filter((i) => i.stepId === opts.step);
  const errors: FieldErrors = {};
  const out: Record<string, Value> = {};
  for (const i of scope) {
    if (i.error) errors[i.field.key] = i.error;
    else if (Object.hasOwn(values, i.field.key)) out[i.field.key] = values[i.field.key];
  }
  return { ok: Object.keys(errors).length === 0, errors, values: out };
}

// ---- files --------------------------------------------------------------------------------------------------------
export type ExpectedFile = { key: string; label: string; required: boolean; accept: FileField["accept"]; maxBytes: number; maxFiles: number };

/** Cheap checks on what the browser says about a file. The real type check (from the bytes) belongs to the storage layer. */
export function checkFile(f: FileField, file: { name: string; size: number }): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const accepted = new Set<string>(f.accept);
  if (accepted.has("jpg")) accepted.add("jpeg");
  if (file.size <= 0) return "That file is empty";
  if (file.size > f.maxBytes) return `That file is too large (the limit is ${Math.floor(f.maxBytes / 1024 / 1024) || "under 1"} MB)`;
  if (!file.name.includes(".") || !accepted.has(ext)) return `Upload a ${f.accept.join(", ").toUpperCase()} file`;
  return null;
}

// ---- submission ---------------------------------------------------------------------------------------------------
export type StoredAnswer = { label: string; type: string; value: Value };
export type Submission =
  | { ok: true; answers: Record<string, StoredAnswer>; files: ExpectedFile[]; sensitive: string[]; mapped: Partial<Record<MapAttribute, string>> }
  | { ok: false; errors: FieldErrors };

/**
 * The clean record to store: `answers` is a snapshot with labels (so renaming a field later can't change history),
 * `sensitive` lists the keys the store must encrypt, `mapped` the values for the registration's own columns, and
 * `files` the uploads to collect (the engine can't see files; the caller matches them up and runs checkFile).
 */
export function buildSubmission(def: FormDefinition, answers: unknown): Submission {
  const v = validateAnswers(def, answers);
  if (!v.ok) return { ok: false, errors: v.errors };
  const out: Record<string, StoredAnswer> = {};
  const files: ExpectedFile[] = [];
  const sensitive: string[] = [];
  const mapped: Partial<Record<MapAttribute, string>> = {};
  for (const { field, required } of resolve(def, answers as Record<string, unknown>).items) {
    if (!isInput(field)) continue;
    if (field.type === "file") {
      files.push({ key: field.key, label: field.label, required, accept: field.accept, maxBytes: field.maxBytes, maxFiles: field.maxFiles });
      continue;
    }
    if (!Object.hasOwn(v.values, field.key)) continue;
    const value = v.values[field.key];
    out[field.key] = { label: field.label, type: field.type, value };
    if (field.sensitive) sensitive.push(field.key);
    if (field.maps && typeof value === "string") mapped[field.maps] = value;
  }
  return { ok: true, answers: out, files, sensitive, mapped };
}
