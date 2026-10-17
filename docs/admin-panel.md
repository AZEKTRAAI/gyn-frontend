# Admin panel plan

## Built: home page editor (`/admin/home`)

Every text, image, link and list on the home page is edited here, and **Publish changes** puts it live straight away (`revalidatePath('/')`).

- **Content contract:** `features/home/schema.ts` (zod). The editor form is generated from it (`z.toJSONSchema`), so a new field in the schema shows up in the editor with no UI work. The seed and fallback is `content/home.json` (copy from the live thegyn.org home page).
- **Sections (Direction J, 18 Oct 2026):** search and sharing, top of the page (headline, lead, fact chips, buttons, film strip), event strip, what you leave with (photo tile and four colour tiles), ambassadors map (pins by longitude and latitude, routes to a hub city), previous summit (ticket), next summit (countdown, seat grid), speakers, programme (days), advisory board, the wall, stories, co-host and partners, closing banner. Each section except the top two has a "Show this section" switch. Lists support add, remove and reorder; numbers are real number fields.
- **Storage:** with `DATABASE_URL`, `Page` "home" plus one `ContentBlock` per section, and an `AuditLog` row (`HOME_PAGE_UPDATED`) holding the old and new content for rollback. Without a database, development saves to `content/home.json`, and production refuses to save.
- **Images:** upload in the editor. With `CLOUDINARY_URL`, they go to Cloudinary (signed, server side). Without it, development writes to `public/uploads` and production refuses. The file type is checked from its bytes (PNG, JPG, WebP, AVIF; no SVG), with a 4 MB cap.
- **Safety:** links must start with `https://`, `/`, `#`, `mailto:` or `tel:` (no `javascript:`). Images must be `/...` or `https://res.cloudinary.com/...`. Every server action calls `requireAdmin()` (`lib/server/admin-auth.ts`), which checks `ADMIN_BASIC_AUTH` itself rather than trusting the proxy. With no `ADMIN_BASIC_AUTH`, production locks `/admin` entirely.
- **Not built yet:** drafts and preview before publishing, version history UI (the audit log has the data), per-person logins and roles (Auth.js, below), section reordering.

## The rest (plan)

Not built. `/admin` today is a static page (`app/admin/page.tsx`) with fabricated sample numbers and SVG charts, no data access and no login. `proxy.ts` puts HTTP Basic Auth in front of it when `ADMIN_BASIC_AUTH` is set. Everything below is the plan for the real thing, written against `prisma/schema.prisma` as of 16 Oct 2026. Where the plan needs something the schema doesn't have, it says so; the full list is in "Schema changes" near the end.

Target users: two to six GYN staff and a scholarship panel of volunteer reviewers. Volume, from `docs/schema.md`: 2 summits a year, about 200 confirmed seats, 1,000 to 4,000 scholarship applications, a few hundred thousand rows over the life of the database. Nothing here needs to scale past one Postgres instance.

## Auth

Auth.js (the `next-auth` v5 package) with two providers:

- **Email magic link** through Resend, which the site already uses for confirmations (`RESEND_API_KEY`, `EMAIL_FROM`). Needs the Prisma adapter (`@auth/prisma-adapter`) to store verification tokens.
- **Google**, for staff on Google accounts. Needs `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` from Google Cloud Console > Credentials, with redirect URI `https://thegyn.org/api/auth/callback/google`.

`AUTH_SECRET` is already in `.env.example`. Check that the `next-auth` release you install supports Next 16 before starting; this repo is on 16.4.2.

Rules:

- **Invite only.** The `signIn` callback allows an email only if an `AdminUser` row exists with that email and `active = true`. Nobody can sign up. The first owner is inserted by hand (SQL or a one-off script).
- **Database sessions**, not JWT, so an owner can revoke a session by deleting the row or setting `active = false`. Session lifetime 8 hours, sliding.
- **Role check on every server action and route handler**, not only in `proxy.ts` (Next 16's name for middleware). The proxy is a convenience redirect to the sign-in page; a role check inside the action is the boundary. The Basic Auth check in `proxy.ts` goes once Auth.js is in.

Schema impact: `@auth/prisma-adapter` expects models named `User`, `Account`, `Session` and `VerificationToken`. `AdminUser` has `hashedPassword String` (required) and none of `emailVerified` or `image`. The least disruptive fix is to rename the model to `User` with `@@map("AdminUser")` (table name unchanged), make `hashedPassword` optional or drop it, add `emailVerified DateTime?` and `image String?`, and add the three adapter models.

## Roles

The task asks for owner, editor, reviewer and finance. The schema's `AdminRole` enum has `SUPER_ADMIN`, `REVIEWER` and `CONTENT_EDITOR`. Mapping: owner = `SUPER_ADMIN`, editor = `CONTENT_EDITOR`, reviewer = `REVIEWER`. There is no finance role; add `FINANCE` to the enum (and rename `SUPER_ADMIN` to `OWNER` in the same migration if you want the names to match the UI).

One role per person, as the schema has it. If someone needs two (a staff member who also reviews), give them owner, or change `role` to `AdminRole[]`.

### Permission matrix

"Read" means they see the screen but can't change anything. "No" means the screen isn't in their navigation and the server refuses the request.

| Action | Owner | Editor | Reviewer | Finance |
|---|---|---|---|---|
| Events: create, edit, publish | yes | yes | no | read |
| Ticket types: name, seats, open/close | yes | yes | no | read |
| Ticket types: price | yes | read | no | yes |
| Registrations: list and detail (PII) | yes | no | no | yes |
| Registrations: CSV export | yes | no | no | yes |
| Registrations: cancel | yes | no | no | yes |
| Scholarship: score assigned applications | yes | no | yes (assigned only) | no |
| Scholarship: assign reviewers, set threshold, decide | yes | no | no | no |
| Scholarship: send result emails | yes | no | no | no |
| Videos and categories | yes | yes | no | no |
| Media library: upload, edit alt text | yes | yes | no | no |
| Media library: delete | yes | yes (if unused) | no | no |
| Pages and content blocks: edit | yes | yes | no | no |
| Pages: publish | yes | yes | no | no |
| Form builder | yes | yes | no | no |
| Refunds: issue | yes | no | no | yes |
| Vouchers and discount codes | yes | no | no | yes |
| Admin users and roles | yes | no | no | no |
| Audit log | yes | no | no | read (money entries only) |
| Job queue status | yes | no | no | read |

Reviewers see the personal statement, field of study, country and the link they submitted. They don't see email, WhatsApp number or payment details; the panel scores the application, not the person's contact data.

## Screens

Each screen lists the models it reads and writes, then what the schema is missing for it.

### 1. Events and ticket types

List of events with status (`DRAFT`, `OPEN`, `CLOSED`, `PAST`), dates and seats sold. Edit form per event, ticket types as a table inside it.

- Models: `Event`, `TicketType`. Seats sold = count of `Registration` rows for the ticket with status `PENDING` (younger than the Checkout expiry) or `CONFIRMED`.
- Saving revalidates the public event page (`revalidatePath('/<slug>')`).
- Missing in `Event`: summary, theme, timezone, hero image (`MediaAsset` relation), registration open/close dates, application deadline, results date, co-host. Today these live in `content/events.json` and the page reads them from there.
- Missing in `TicketType`: description, `includes` (the feature list on each tier card), `sortOrder`, sales start/end, and which form the ticket uses (`TICKETS[...].form` in code today, `attendee` or `invitation`; should become a `formDefinitionId` or an enum).
- Missing everywhere: speakers, schedule, FAQs, eligibility. Either `ContentBlock` rows on the event's page (needs `Page.eventId`) or a `Person` model for speakers, advisory board and ambassadors. A `Person` model is better: the same people appear on several pages.

Code change this screen depends on: `features/registration/server/register.ts` charges `TICKETS[input.ticket].amountCents` and validates against the `TICKETS` keys in `features/registration/schema.ts`. Until it reads `TicketType.priceCents` and the form type from the database, a price edited in the admin panel changes nothing.

### 2. Registrations

Table with filters: event, ticket type, status, country of residence, nationality, date range, and a search box for reference or email. Row opens a detail view: attendee, payments, refunds, notes, audit trail for that registration.

- Models: `Registration` joined to `Attendee`, `TicketType`, `Payment`, `Refund`.
- Actions: cancel (sets `CANCELLED`, writes `AuditLog`), add a note (`Registration.notes`), resend confirmation email.
- CSV export of the current filter: reference, created date, status, ticket, amount, name, email, WhatsApp, nationality, country, gender, how they heard. Every export writes an `AuditLog` row with the filter and row count, because the file holds PII.
- Missing: an index on `Registration.createdAt` for date-range filters (cheap to add). No check-in field, if on-site check-in is ever wanted.

### 3. Scholarship review queue

For the $18.50 application track. Owner assigns applications to reviewers; each reviewer sees their queue, reads one application at a time and scores it on a rubric; owner sees the ranked list and decides.

- Proposed rubric, built from `scholarshipCriteria` in `content/events.json` (statement, leadership, passion for the SDGs, volunteering or leadership experience preferred): personal statement (0 to 25), leadership (0 to 25), commitment to the SDGs (0 to 25), evidence of work from the submitted link (0 to 25). Total out of 100, matching `score Float? // 0-100`. GYN should confirm the weights; they're editable per event.
- Proposed panel: two reviewers per application, scores averaged, a third reviewer when the two differ by more than 20 points. The ranked list then splits the way the live copy describes: top 15 fully funded, next 15 partially funded, then waitlist.
- Results: owner sets `ACCEPTED`, `WAITLISTED`, `REJECTED` in bulk from the ranked list, then queues the result emails (see Queue).
- Models: `ScholarshipApplication`, `AdminUser` (reviewer), `Registration` (the fee payment).
- Missing: `ScholarshipApplication` holds one `reviewerId`, one `score` and one `reviewerNotes`, so it can't hold two reviewers' scores or per-criterion marks. Add `ScholarshipReview` (`applicationId`, `reviewerId`, `criteria Json`, `total Float`, `notes`, `submittedAt`, unique on `applicationId + reviewerId`) and keep `ScholarshipApplication.score` as the computed average. The application also has no columns for field of study, the credible link, or which tier (fully or partially funded) was awarded; `category` records what they applied for, not what they got. Add `fieldOfStudy`, `evidenceUrl` and `awardedCategory`.
- Missing outside the schema: the public scholarship application isn't built. `TICKETS` has no scholarship ticket and the handler returns 409 for `fully-funded` and `partially-funded`. The queue has no data until the next application round has a form.

### 4. Videos and categories

Add a video by pasting a YouTube URL; the server pulls the title and thumbnail from YouTube oEmbed. Drag to reorder within a category, pick the event it belongs to, mark it published.

- Models: `Video`, `VideoCategory`.
- Missing: `content/media.json` records a `format` (short or long), a `page` and a `section` per video, which decide where it shows up. `Video` has none of them. Add `format`, and either `placements Json` or a join table to pages. `thumbnailUrl` is also worth storing so the site doesn't depend on `i.ytimg.com` URL patterns.

### 5. Media library

Grid of uploaded images and videos with search by page, slot and alt text. Upload through the Cloudinary Upload Widget with signed uploads: a route handler signs the upload parameters with `CLOUDINARY_API_SECRET`, and the signature fixes the folder to `thegyn/{page}/` so files follow the scheme in the README. After upload, the widget callback saves a `MediaAsset` row with public ID, format, width, height and bytes.

- Models: `MediaAsset`.
- Alt text is required before an image can be placed on a page. Caption is optional but must be true to the photo (see `docs/handoff.md`, Imagery).
- Delete is blocked while the asset is used by a page block, event or person.
- Missing: `MediaAsset` has no `page` or `slot` fields to mirror `thegyn/{page}/{slot}`, `altText` is optional, and nothing records where an asset is used. Add `page String`, `slot String` (unique together), make `altText` required for `IMAGE`, and track usage either with relations from the using models or a `MediaUsage` join.
- Env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` exist in `.env.example`; add `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` for the widget. Add `res.cloudinary.com` and `upload-widget.cloudinary.com` to the CSP in `next.config.ts`.

### 6. Pages and content blocks

Per page: SEO fields (title, meta description, OG image) and an ordered list of blocks. Each block type has a fixed form: hero, rich text, schedule, speakers, FAQ, ticket tiers, gallery, video row, CTA. Editors fill fields; they don't write layout or CSS. Block forms are defined in code with Zod (the same library as the public forms), and the block's `data` is validated against it on save.

- Models: `Page`, `ContentBlock`.
- Publishing calls `revalidatePath` for that page. This screen is what makes the database CMS adapter (README, "Swapping to a database adapter") worth building.
- Missing: blocks have no draft state. Editing a block changes the live page on the next revalidation. Add `status` (`DRAFT`/`PUBLISHED`) to `ContentBlock`, or a `PageRevision` model that stores the whole block list as JSON per publish, which also gives undo. `Page` has no `eventId` to tie an event's page to its event.

### 7. Form builder

Build forms such as a new ticket's registration form without a code change. Field list editor (text, email, phone, country, select, checkbox, long text with word limits, URL), with label, help text, required, and validation. Output is a JSON Schema (draft-07) in `FormDefinition.schema`, as the schema doc intends. The public form renderer reads it and builds the react-hook-form fields; the server validates submissions against the same schema with a JSON Schema validator (ajv is the usual one; it would be a new dependency).

- Models: `FormDefinition`, `FormSubmission`.
- Every field has a "do not store" switch. Passport numbers (D16, D34) use it: the value is used for the request (to draft the invitation letter) and dropped before the `FormSubmission` insert.
- Missing: no version on `FormDefinition`, so editing a form after people have submitted it makes old submissions unreadable against the new schema. Add `version Int` and store it on each `FormSubmission`. No link from `TicketType` to the form it uses (see screen 1).
- Note: the contact form is supposed to save through `FormSubmission`, but `PrismaRepo.saveContactSubmission` only logs today because no `FormDefinition` row is seeded. With `DATABASE_URL` set, contact messages are lost. Seed a `contact` form definition (or add a `ContactMessage` model) before the database goes live, independent of the admin panel.

### 8. Refunds, vouchers and discount codes

From a registration's detail view, finance issues a refund following the policy table in `docs/payments.md`: the screen shows days until the event and the policy tier (45+ days full, 30 days 50%, 15 days 25%, under 15 none, scholarship fee never), pre-fills the amount, and finance confirms.

- Stripe call: `POST /v1/refunds` with an `Idempotency-Key`, through `features/payments/stripe.ts`. The `charge.refunded` webhook (already handled) marks the `Refund` row `ISSUED`.
- Voucher (GYN Credit Voucher): generated code, amount, expiry, shown on the refund and emailed to the attendee.
- Discount codes: create, set limits and dates, see usage.
- Models: `Refund`, `Payment`, `Registration`, `DiscountCode`.
- Open question that blocks this screen: `docs/payments.md` notes the refund policy promises vouchers, while the mapping table sends cash back through Stripe. Decide which before building.
- Missing: `docs/payments.md` says outbound refunds use `Refund.idempotencyKey`, but `Refund` has no such field. Add it (unique). No record of which admin issued a refund (`issuedById`). Vouchers are only a `voucherCode` on `Refund`; there is no way to redeem one, track a balance or see which registration used it. Add a `Voucher` model (`code`, `amountCents`, `remainingCents`, `expiresAt`, `refundId`, `attendeeId`) and a `voucherId` on `Registration`. `DiscountCode` has no `stripeCouponId`, and the registration handler doesn't accept a code at all yet.

### 9. Audit log

Read-only table: when, who, action, entity, before/after diff, IP. Filters by entity type and id, admin, action, date. Linked from every detail view ("history").

- Models: `AuditLog`.
- Missing: `userAgent`. Nothing stops the app from updating or deleting audit rows; see Security.

### 10. Admin users (owner only)

Invite by email (creates `AdminUser`, sends the magic link), change role, deactivate. Shows last sign-in and 2FA status.

- Missing: `invitedById`, `invitedAt`, and the 2FA fields below.

## Queue for CSV exports and emails

Two kinds of slow work:

- **Bulk email.** Scholarship results go to 1,000 to 4,000 applicants at once (`docs/schema.md` estimate). Resend has rate limits and a batch endpoint; check both against the plan before the first results day. Sending that many inside one request would time out.
- **CSV export.** At these volumes (a few thousand rows) an export streams from a route handler in well under a second, so launch with a direct streamed download. Move it to the queue only if an export ever gets near the function timeout.

Design: a `Job` table in Postgres (`id`, `type`, `payload Json`, `status` `QUEUED`/`RUNNING`/`DONE`/`FAILED`, `attempts`, `runAfter`, `lastError`, `createdById`, `createdAt`, `finishedAt`). The admin action inserts jobs in the same transaction as the decision that caused them, so "applications marked accepted" and "emails queued" can't drift apart. A worker route (`/api/jobs/run`) claims a batch with `SELECT ... FOR UPDATE SKIP LOCKED`, sends, marks done, and retries with backoff up to 5 attempts.

Something has to call the worker. `docs/infrastructure.md` already names Upstash QStash as the step after the first Resend 429, so use it: same vendor as the rate limiter, it calls `/api/jobs/run` on a schedule or once per enqueued job and retries on failure. The worker verifies QStash's request signature (two signing keys, new env vars). Vercel Cron is the fallback if adding QStash is unwanted; confirm the plan's cron frequency before relying on a one-minute schedule.

Each sent email also gets an `EmailLog` row (`to`, `template`, `entityId`, `providerId`, `status`) so "did they get the email?" has an answer. Resend's delivery webhooks can update it later.

None of `Job` or `EmailLog` exists in the schema yet.

## Security

- **2FA for owner and finance.** Auth.js has no TOTP. After sign-in, owner and finance accounts go through a second step: TOTP (a small library such as otplib, new dependency) with the secret stored encrypted (AES-256-GCM, key in Vercel env), plus 10 single-use recovery codes stored hashed. Passkeys through Auth.js's WebAuthn provider are the alternative, but Auth.js labels that provider experimental, so check its status before choosing it. Until the second factor passes, the session can't reach any screen. Missing: `totpSecretEncrypted`, `totpEnabledAt` on `AdminUser`, and a `RecoveryCode` model.
- **Audit every write.** One helper wraps every admin server action: it loads the old row, runs the change and writes `AuditLog` (`adminUserId`, `action`, `entityType`, `entityId`, `oldValue`, `newValue`, `ipAddress`) in one transaction. A write that can't be audited doesn't happen. Reads of PII are audited for exports only.
- **Audit log is append-only.** Run the app as a Postgres role that has `INSERT` and `SELECT` on `AuditLog` but not `UPDATE` or `DELETE`. Retention is 3 years (`docs/schema.md`); deletion after that is a separate scheduled job under a different role.
- **Server actions** check role and, for owner/finance, the second factor, on every call. Next's server actions already reject cross-origin posts; keep the admin on the same origin.
- **PII.** Reviewers and editors never receive contact fields from the server (don't hide them in the UI only). Passport numbers are never stored. Exports carry a warning and are logged.
- **Sign-in abuse.** Rate-limit magic-link requests per email and per IP with the existing `lib/server/rate-limit.ts`.
- **Headers.** `/admin` sends `X-Robots-Tag: noindex` and `Cache-Control: no-store`.

## Schema changes, consolidated

| Change | For |
|---|---|
| `AdminUser` → `User` with `@@map("AdminUser")`; `hashedPassword` optional; add `emailVerified`, `image`, `invitedById`, `invitedAt`, `totpSecretEncrypted`, `totpEnabledAt` | Auth.js, invites, 2FA |
| Add `Account`, `Session`, `VerificationToken` (Auth.js adapter shapes), `RecoveryCode` | Auth.js, 2FA |
| `AdminRole`: add `FINANCE` (optionally rename `SUPER_ADMIN` → `OWNER`) | Roles |
| `Event`: summary, theme, timezone, hero image, registration open/close, application deadline, results date | Events screen, DB CMS |
| `TicketType`: description, `includes String[]`, `sortOrder`, sales start/end, form link | Events screen, registration |
| `Person` model (speakers, advisory board, ambassadors) with `MediaAsset` relation | Event pages, about page |
| `ScholarshipReview` model; `ScholarshipApplication.fieldOfStudy`, `evidenceUrl`, `awardedCategory` | Review queue |
| `Video.format`, `Video.thumbnailUrl`, placement on pages | Videos screen |
| `MediaAsset.page`, `slot` (unique together), `altText` required for images, usage tracking | Media library |
| `ContentBlock.status` or `PageRevision`; `Page.eventId` | Pages screen |
| `FormDefinition.version`, `FormSubmission.formVersion`; seed a `contact` definition | Form builder, contact form |
| `Refund.idempotencyKey` (unique), `Refund.issuedById`; `Voucher` model; `Registration.voucherId`; `DiscountCode.stripeCouponId` | Refunds and vouchers |
| `AuditLog.userAgent` | Audit log |
| `Job`, `EmailLog` | Queue |
| Index on `Registration.createdAt` | Registration filters |

## Build estimate

One developer who knows Next.js and Prisma, working days. Includes tests for the money and permission paths, not polish.

| Phase | Scope | Days |
|---|---|---|
| 0 | Schema migration for auth, roles, 2FA, audit; Auth.js with magic link and Google; role guard; audit helper; admin layout and navigation | 4 |
| 1 | Events and ticket types CRUD; registration handler reads price and form type from `TicketType`; database CMS adapter for events; revalidation | 4 |
| 2 | Registrations list, filters, detail view, cancel, streamed CSV export | 3 |
| 3 | Refunds (Stripe API, policy tiers), vouchers (issue and redeem at checkout), discount codes | 4 |
| 4 | Scholarship review queue: assignment, rubric scoring, ranking, bulk decisions | 4 |
| 4a | Public scholarship application form and $18.50 payment, if the next round needs it | 3 |
| 5 | Media library with signed Cloudinary uploads; videos and categories | 3 |
| 6 | Pages and content blocks editor, drafts, database adapter for pages | 5 |
| 7 | Form builder and the renderer that reads `FormDefinition` | 5 |
| 8 | Job queue, email log, results emails, audit log viewer, TOTP and recovery codes, security review | 4 |
| | **Total** | **39** |

Add about 20% for review rounds and content entry, so plan on eight to nine weeks of calendar time.

Order matters more than the total. Phases 0 to 3 (15 days) cover what a paid summit needs: change prices, see who registered, export the list, refund. Phase 4 has to land before the next scholarship results day. Phases 5 to 7 replace the file-based content and can wait until the team actually wants to edit pages without a developer.
