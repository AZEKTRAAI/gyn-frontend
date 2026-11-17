# Forms engine (phase 5, part 1)

The pure core of the form builder (SRS 3.4). It lives in `packages/core/src/forms/` and has no database access and no React, so the admin builder, the public renderer and the submit route can all use the same code and cannot disagree.

| File | What it is |
|---|---|
| `definition.ts` | The definition format as a zod schema (`formDefinitionSchema`), plus the cross-checks |
| `engine.ts` | `visibleFields`, `validateAnswers`, `normalizeAnswers`, `buildSubmission`, `checkFile` |
| `countries.ts` | Static country list (same names the registration form uses today) |
| `samples/sism-2026.ts` | The current SISM Forum Access / Self-Funded and Invitation Letter forms, in this format |

## The format

One JSON document. `formatVersion` is `1`; the engine refuses anything else, so a later format change is a deliberate step. Every object is strict: a misspelt setting is an error, not silently ignored.

```json
{
  "formatVersion": 1,
  "steps": [
    {
      "id": "details",
      "title": "Your details",
      "fields": [
        { "key": "fullName", "type": "text", "label": "Full name", "required": true, "minLength": 2, "maxLength": 120, "maps": "fullName" },
        { "key": "role", "type": "radio", "label": "Role", "required": true,
          "options": [{ "value": "student", "label": "Student" }, { "value": "pro", "label": "Professional" }] },
        { "key": "school", "type": "text", "label": "School", "visibleWhen": { "field": "role", "op": "equals", "value": "student" } },
        { "key": "employer", "type": "text", "label": "Employer",
          "visibleWhen": { "field": "role", "op": "equals", "value": "pro" }, "requiredWhen": { "field": "role", "op": "equals", "value": "pro" } },
        { "key": "passportNumber", "type": "text", "label": "Passport number", "required": true, "sensitive": true, "uppercase": true,
          "pattern": "^[A-Z0-9]{6,12}$", "patternMessage": "6 to 12 letters and digits" },
        { "key": "scan", "type": "file", "label": "Passport scan", "accept": ["pdf", "jpg"], "maxBytes": 5242880 },
        { "key": "terms", "type": "consent", "label": "I agree to the", "required": true,
          "link": { "text": "Terms and Conditions", "href": "/terms-conditions" } }
      ]
    }
  ]
}
```

Steps hold fields in order. A single-step form has one step. A step can have `visibleWhen` too, and then the whole step (and every field in it) is skipped when it does not apply.

### Fields

Every input field has: `key` (stable id: letters, digits and `_`, starts with a letter, up to 64, unique in the whole form, never reuse a retired one), `type`, `label`, and optionally `help`, `placeholder`, `required`, `sensitive`, `visibleWhen`, `requiredWhen`, `maps`, `errorMessage` (replaces every message for that field).

| `type` | Extra settings | Stored value |
|---|---|---|
| `text` | `minLength`, `maxLength` (default 200), `pattern` + `patternMessage`, `uppercase` | string |
| `textarea` | same, `maxLength` defaults to 5000, line breaks kept | string |
| `email` | | lower-cased string |
| `phone` | | `+<digits>` (E.164 style), country code required |
| `number` | `min`, `max`, `integer` | number |
| `date` | `min`, `max` (YYYY-MM-DD) | `YYYY-MM-DD` |
| `select`, `radio` | `options` `[{value, label}]` | the option's `value` |
| `checkboxes` | `options`, `minSelected`, `maxSelected` | array of values, in option order |
| `country` | | the name from `countries.ts` |
| `file` | `accept` (`pdf doc docx jpg png webp`), `maxBytes` (cap 25 MB), `maxFiles` (cap 10) | not an answer, see "Files" |
| `consent` | `link: { text, href }` (internal path only) | `true` |
| `hidden` | `source` (URL parameter the renderer fills it from), `maxLength` | string |
| `heading`, `info` | `text` (no answer, only `key`, `text`, `visibleWhen`) | none |

Image uploads are `file` fields with an image-only `accept` list. `maps` ties a field to a participant attribute (`fullName firstName middleName lastName email whatsapp nationality gender dateOfBirth countryOfResidence cityOfDeparture`), at most one field per attribute, so lists can sort and filter any form (SRS 3.4 G).

Limits: 20 steps, 100 fields per step, 200 fields per form, 200 options per field.

## Conditions

```json
{ "field": "role", "op": "equals", "value": "student" }
{ "all": [ <condition>, ... ] }      // every one must hold
{ "any": [ <condition>, ... ] }      // at least one must hold
```

| `op` | `value` | True when |
|---|---|---|
| `equals` | string, number or boolean | the answer is that value (for `checkboxes`: that box is ticked) |
| `not_equals` | same | it is not (an unanswered field counts as "not") |
| `in` | list | the answer is one of them (`checkboxes`: any of them is ticked) |
| `is_empty` / `is_not_empty` | none | the field has no valid answer / has one |
| `greater_than` / `less_than` | number (for `number` fields) or `YYYY-MM-DD` (for `date`) | strictly more / less; unanswered is neither |

Used in `visibleWhen` (field or step: shown only when true) and `requiredWhen` (field: required when true, only counts while the field is visible). `all` and `any` take plain tests, not nested groups.

Rules checked when the definition is saved, each with a message saying which field is wrong and why:

- A condition can only look at a question that appears **earlier** in the form (earlier step, or earlier in the same step). That alone rules out loops: a field cannot depend on itself, on a later field, or on a field that is not there.
- It can only look at a question, not at a heading, info text or file upload.
- The value must suit the field: a number for a number field, one of the listed options for a choice field, a listed country for a country field, a boolean for a consent, a real date for a date.
- Keys and step ids are unique; option values are unique; `min` is not above `max`; `maps` is not used twice.
- A `pattern` must compile, needs a plain-words `patternMessage`, is at most 200 characters, and is refused if it uses back-references or a repeat inside a repeat such as `(a+)+` (these can hang a server). This is a heuristic, not a proof; see the `shortcut:` note in `definition.ts`.
- A consent link must be a path on this site (`/terms-conditions`), never a full URL.

## What the engine guarantees

- **Only visible fields count.** Conditions are resolved in order, step by step. A condition sees only answers of earlier visible fields that are valid, so a stale answer to a hidden field cannot keep other fields alive. Answers to hidden fields and hidden steps are dropped, never validated, never stored. So are unknown keys.
- **Own keys only.** Answers are read with `Object.hasOwn`, and the payload must be a plain object. `__proto__`, `constructor` and the like in a payload do nothing, and a payload with a foreign prototype is refused.
- **Values are normalised**: text trimmed, control characters removed, Unicode composed (NFC); emails lower-cased; phones as `+<digits>`; dates as `YYYY-MM-DD` (real calendar dates only); numeric strings turned into numbers; countries to the list's spelling; checkbox lists de-duplicated in option order.
- **Text stays text.** HTML or script in an answer is kept exactly as typed, not stripped and not interpreted. The renderer and the admin views must escape on output (React does by default).
- **Friendly, per-field errors** ("Email is required", "Enter a valid email address", "Choose one of the options") or the field's own `errorMessage`. Wrong types never throw. Very long strings (over 100,000 characters) are refused before any regex runs.
- **Pure**: the same inputs give the same outputs, and inputs are never changed.

### Functions

```ts
const def = formDefinitionSchema.parse(json);          // throws with readable issues, or use safeParse

visibleFields(def, answers)        // [{ step, field, required }] in order, headings and info text included
validateAnswers(def, answers, { step? })   // { ok, errors: { key: message }, values }; with step, that step only
normalizeAnswers(def, answers)     // clean values of visible, valid fields
buildSubmission(def, answers)      // { ok: true, answers, files, sensitive, mapped } or { ok: false, errors }
checkFile(fileField, { name, size })       // message or null
```

`buildSubmission` returns what to store:

- `answers`: `{ key: { label, type, value } }`, the snapshot with labels the plan asks for (renaming a field later cannot change history).
- `sensitive`: the keys whose values the store must encrypt (`crypto.ts`) before saving.
- `mapped`: values for the registration's own columns (`email`, `nationality`, ...) from fields with `maps`.
- `files`: the uploads to collect (`key`, `label`, `required` after `requiredWhen`, `accept`, `maxBytes`, `maxFiles`).

Errors for the whole payload (not an object, unknown step) use the key `_form`.

### Files

Files are not in the answers payload. The submit route gets them as separate parts, matches them to `files` by key, runs `checkFile` (size and extension from what the browser says), and the storage layer does the real check from the bytes (`storage.ts`). Whether a required file is missing is the route's job, using `files[].required`.

## SRS 3.4 coverage

| SRS | State |
|---|---|
| C. Field types: text, paragraph, email, phone with country code, number, date, dropdown, multiple choice, checkboxes, radio, file and image upload, headings, descriptive text, consent, hidden | Done (here as field types) |
| C. Conditional fields | Done |
| D. Conditional logic, required/optional, field validation, custom error messages | Done |
| D. Multi-section and multi-step forms | Done (steps; a heading field makes a section inside a step) |
| F. Existing registrations keep their labels and answers | Format side done: `buildSubmission` stores the label with every answer. Frozen published versions are the database part |
| G. A new form needs no new table, page or code | Format side done (one JSON document) |
| "Reproduces today's forms" | Done: `samples/sism-2026.ts`, tested against the live schema |

## Left for the rest of phase 5

- **Builder UI** (drag and drop, settings panel, preview, conditions editor). It should call `formDefinitionSchema.safeParse` on every save and show the issue messages as they are.
- **Public renderer**: one React component that draws a parsed definition with `visibleFields` and validates per step with `validateAnswers(..., { step })`; filling `hidden` fields from the URL; showing `help`, the consent link and the progress bar.
- **File storage wiring**: multipart submit, `checkFile`, byte-level type check, encrypted streaming to disk, `RegistrationFile` rows.
- **Persistence**: `Form` and `FormVersion` store (save draft, publish, duplicate, version history), the trigger that freezes published versions, and the rule that a field with answers is retired, not deleted.
- **Registrations**: the submit transaction (call `buildSubmission`, encrypt `sensitive` keys, copy `mapped` values to the columns, store `answers`), duplicate rule, submission limit, opens/closes, Turnstile, idempotency key.
- **Form settings** that are not part of the definition: appearance (columns, button labels, progress bar), confirmation message and emails, payment, terms page.
- Small gaps in the engine itself: "today" as a date limit (for date of birth), a per-field `defaultValue`, phone display formatting, and regex checking with a real safe engine if pattern authors ever stop being trusted admins.
- `features/registration/ui/countries.ts` is a copy of `forms/countries.ts`; when the old form is replaced by the renderer, delete the copy. The samples' `GENDERS` and `HEARD_FROM` are checked against the live schema by `samples/sism-2026.test.ts` and go the same way.
- The SRS lists no specific fields for a scholarship (Fully Funded / Partially Funded) application, only broad groups (education and work, passport, travel, accommodation, funding, documents), so there is no scholarship sample. The engine tests use a larger invented form covering every type and operator instead.
