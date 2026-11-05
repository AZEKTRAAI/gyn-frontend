# Backend plan: GYN website and registration system

Written 6 Nov 2026 against SRS v1.2 (`GYN_SRS_v1.2_updated_with_reference_screenshots.pdf`, 5 Nov 2026). Where v1.2 and v1.1 differ, v1.2 wins. This replaces the auth and hosting parts of `docs/admin-panel.md` (that doc assumed Vercel, Resend magic links and Google sign-in).

Scope of this plan: the backend and the admin panel. The public frontend redesign (shorter home page, glass effect, final colours, fonts) comes after and is out of scope here, except where the backend has to feed it (event pages, navbar dropdowns).

## Fixed decisions

These are settled with Azam. Change them only if he says so.

| Decision | Choice | Why |
|---|---|---|
| Hosting | GYN's Netcup VPS (about 20 GB disk, RAM unknown until 7 Nov) | GYN already pays for it; the old WordPress site runs there now |
| Runtime | One Next.js 16 app (`output: 'standalone'`) plus one worker process from the same codebase, in Docker Compose | One image to build, one command to deploy, same setup in dev and prod |
| Database | Postgres 17 in a container on the VPS. No Neon | Data stays on GYN's server; no extra bill |
| Files | Server disk, a Docker volume. No Cloudinary | Same reason; resized at upload with `sharp` (already shipped with Next) |
| HTTPS and proxy | Caddy in front (automatic Let's Encrypt). Next docs recommend a reverse proxy when self-hosting | Free certificates, gzip, upload size limits, slow-client protection |
| Email | Plain SMTP through `nodemailer`, provider set in env | Works with any provider; GYN hasn't picked one |
| Old data | Not imported. GYN starts fresh in the new system | Azam, 6 Nov |
| Naming | "Registration categories" and "forum access", never "tickets" | GYN sells admissions to forums, not tickets |
| Dashboard "subscriptions" | Dropped. Cards show revenue and paid registrations | GYN has no subscriptions; the old WordPress card was generic. SRS 3.1 still lists them, so tell GYN in writing |
| Out of scope | SRS 13 "future enhancements": participant login portal, QR check-in, certificates, bulk email, WhatsApp, CRM | The SRS says they are not part of the first phase |
| Frontend | Untouched in this plan except event pages and navbar data | Azam: backend first |

## Architecture

```
            internet
               |
            Caddy :443  (HTTPS, gzip, 25 MB body limit, /media/* served from disk)
               |
          app (Next.js standalone, node server.js)
           |        \
       Postgres    /data/uploads  (volume)
           |        /
          worker (same image, `node worker/index.ts`)
           - email outbox, letter PDFs, payment re-checks,
             auto-close forms, nightly reconciliation
          backup (cron: pg_dump + uploads, copied off-server)
```

- **Route handlers** for the public API (form submit, payment webhooks, file download). **Server actions** for the admin. Every action and handler checks the session and permission itself; `proxy.ts` only redirects to the login page.
- **One instance.** Next caches to local disk by default, which works for a single `next start` (self-hosting guide). No Redis, no multi-instance cache work.
- **Worker** polls an `outbox` style table with `SELECT ... FOR UPDATE SKIP LOCKED`. No queue service. If the worker is down, jobs wait; nothing is lost.
- **Public vs private files.** Public media (event photos, logos) lives under `/data/uploads/public` and Caddy serves it at `/media/...` with long cache headers. Participant documents (passports, CVs) live under `/data/uploads/private`, never served directly, and only come out through an admin-only route that checks permission, logs the download, and sends `Content-Disposition: attachment`.

## Data model

Fresh baseline migration. Nothing is live, so the three existing migrations and the old models built around fixed ticket types (`TicketType`, `content/events.json`, `TICKETS` in code) are replaced, not patched. Keep: the soft-delete convention (`deletedAt`), money in minor units plus currency, idempotency keys, `AuditLog`, `WebhookEvent`, `ContactMessage`.

### Events and pages

- **Event**: slug, name, theme, description, start and end dates, registration open and close dates, venue, city, country, banner, logo, status (`DRAFT`, `PUBLISHED`, `ARCHIVED`), `featured`, `timingOverride` (null, `UPCOMING`, `PAST`), SEO fields. Upcoming or past is **computed from the end date**, so an event moves to Previous Events on its own; the override exists for edge cases.
- **EventSection**: eventId, type, order, visible, data (JSON). Types come from a fixed library defined in code with a zod schema each: hero, overview, announcements (with the registration deadline pulled from the event's close date, SRS 2.3), highlights (numbers), activities, gallery, videos, speakers, programme, testimonials, partners, FAQ, registration categories and packages (the cards with Register buttons), outcomes, call to action. The admin editor is generated from the zod schema, the same way `/admin/home` already works (`z.toJSONSchema`). New event pages need no code: the team creates an event, picks sections, fills them in.
  - Default section sets: an upcoming event starts with hero, overview, categories, programme, speakers, FAQ. A past event starts with hero, highlights, gallery, videos, testimonials, outcomes.
- **RegistrationCategory**: eventId, name (Fully Funded, Partially Funded, Self-Funded, Forum Access, Invitation Letter, anything new), description, fee and currency, **`approvalMode`**, order, active. `AUTOMATIC` (Self-Funded and Forum Access: full attendance, accepted as soon as payment is verified) or `MANUAL_REVIEW` (scholarship applications and any other scenario GYN adds). It's a setting on the category, so a new scenario is a settings change in the admin, not new code. An event has many categories; a category has many forms.
- **Page and PageSection**: same pattern for Home, About, Contact and the policy pages. Policies are one rich-text section each and keep a version number, so a registration can record which terms version was accepted. The Contact page has an optional Google Maps section (SRS 2.5; the map embed host is added to the Content Security Policy). Every page and event has SEO fields: title, meta description, slug, canonical URL, Open Graph image, and a "hide from search engines" switch (SRS 6).
- **Redirect**: from, to, code. Changing a slug writes a redirect automatically. Seed it with `/sism-2026` and `/fms-thailand` pointing at the new event URLs.

### Forms (SRS 3.4, the core requirement)

- **Form**: name, slug, eventId (optional, so standalone forms work), categoryId (optional), status (`DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED`), `publishedVersionId`, settings: opens and closes at, submission limit, duplicate rule (none, one per email per form, one per email per event), confirmation message, the confirmation email the participant gets, admin notification recipients, payment required, fee override, allowed gateways, terms page required, and appearance (SRS 3.4 B "design, layout": intro text and cover image, one or two columns per section, button labels, progress bar on multi-step forms).
- **FormVersion**: formId, version number, `definition` (JSON), createdBy, createdAt, note. A published version is **never edited**; editing creates a new draft version. Every submission points at the exact version it was made with, so editing a form can't change history (SRS 3.4 F).
- **Definition format** (one JSON document, validated by zod on save):
  - steps → sections → fields. Single-step forms have one step.
  - Each field: stable `id` (never reused), type, label, help text, required, placeholder, options, validation (min, max, pattern, allowed file types, max size), custom error message, default value, `visibleWhen` and `requiredWhen` conditions, and an optional `maps` key.
  - Field types: short text, long text, email, phone (with country code), number, date, dropdown, multiple choice, checkboxes, radio, file, image, section heading, description text, consent checkbox, hidden (filled from the URL, for UTM codes), country, nationality.
  - Conditions: `{ field, op, value }` with `equals`, `not_equals`, `in`, `is_empty`, `is_not_empty`, `greater_than`, `less_than`, combined with all or any.
  - `maps` ties a field to a core participant attribute (first name, middle name, last name, email, WhatsApp, nationality, gender, date of birth, country of residence, city of departure). That is how the registration list can sort and filter by nationality or gender for any form, without new tables (SRS 3.4 G: "a new form must not require a new database table").
- **Editing a live form is always possible and always safe.** Admins can change labels, help text, options, required settings, order, and add or remove fields at any time. The change goes into a draft version with a preview; publishing makes it live for new registrations. A field that already has answers is **retired, not deleted**: it disappears from the form, but every past answer to it stays in the records and exports. Each field also has a `sensitive` switch (see Security).
- **One shared engine** in `features/forms/engine/`: takes a definition and answers, evaluates conditions, and builds the zod schema at runtime. The public renderer and the server both use it, so client and server validation can't drift. This module gets the heaviest unit tests.

### Registrations

- **Registration**: global `entryNumber` (Postgres sequence, shown as "Entry #8001"), human `reference` (e.g. `SISM26-7K3QX`), eventId, categoryId, formId, formVersionId, the mapped participant columns (copied from the answers at submit time), `answers` JSON stored as a **snapshot with labels** (`{ fieldId: { label, type, value } }`), `paymentStatus`, `applicationStatus` (kept separate, SRS 3.10 C), `termsVersion` and `termsAcceptedAt`, favourite, read, spam, trashed (soft delete), IP, user agent, created and updated.
  - `paymentStatus`: `NOT_REQUIRED`, `PENDING`, `PAID`, `FAILED`, `ACTION_REQUIRED`, `REFUNDED`, `PARTIALLY_REFUNDED`.
  - `applicationStatus` (only on `MANUAL_REVIEW` categories; `AUTOMATIC` ones go straight to `ACCEPTED` when payment is verified): `SUBMITTED`, `UNDER_REVIEW`, `ACCEPTED`, `WAITLISTED`, `REJECTED`. A failed payment never sets this to rejected; a successful payment never sets it to accepted on a review category.
  - Decision fields: who decided, when, and a note, so the review panel can list and filter by them. The full history is in `AuditLog`.
- **RegistrationFile**: registrationId, fieldId, storage key (random), original name, MIME type checked from the bytes, size, SHA-256.
- **RegistrationNote**: internal notes by admins. Edit history comes from `AuditLog` (old and new values).

### Payments

- **Payment**: one row per attempt, so a failed attempt and a later successful retry are both kept. registrationId, provider (`STRIPE`, `PAYPAL`), provider IDs (session, order, payment intent, capture), amount, currency, status, failure reason, gateway response (no card data), idempotency key, timestamps.
- **Refund**: as today, plus PayPal refund IDs.
- **WebhookEvent**: keep as is (unique provider event ID, so a repeated delivery does nothing).

### Letters and email (SRS v1.2, 3.8 to 3.10)

- **LetterTemplate** and **LetterTemplateVersion**: name, purpose, assignment (event, category, trigger), status (active, inactive, archived), body as rich-text JSON with merge fields, header, footer, signatory and logo. Versioned like forms; every change records who and when. Admins can duplicate and preview a template. For the SRS's "upload an approved document template" (3.8 A), the admin uploads GYN's letterhead as a one-page PDF or A4 image and the letter text is printed on top of it, so letters look exactly like GYN's official paper.
- **Delivery options per template**: attach the PDF to the email, or send a secure download link instead (signed, expires after a set number of days). Send only after verified payment (the default), or before payment if GYN switches that on for a category (SRS 3.9).
- **Triggers**: `REGISTRATION_SUBMITTED`, `PAYMENT_SUCCEEDED`, `PAYMENT_FAILED`, `APPLICATION_ACCEPTED`, `APPLICATION_WAITLISTED`, `APPLICATION_REJECTED`, plus `MANUAL`.
- **Two routes to the personalised acceptance email** (Azam, 6 Nov):
  1. **Automatic**, for `AUTOMATIC` categories (Self-Funded, Forum Access, Invitation Letter): the moment payment is verified, the worker generates the personalised email (and the PDF letter, if the template has one) and sends it. Nothing for an admin to do.
  2. **Sent by an admin**, for `MANUAL_REVIEW` categories: nothing is sent when the application comes in. It waits in the review panel (see Applications below). When the admin accepts someone, the panel shows the personalised email and letter already filled in for that person. The admin can edit the text for that person, then chooses **Accept and send** (accepts and sends together) or **Accept, send later** (the person appears in a "ready to send" list). The email goes out only when the admin presses send. Waitlist and rejection emails work the same way and are never automatic.
  Which route a category uses is its `approvalMode`. Tomorrow's extra scenarios plug in here.
- **GeneratedLetter**: registrationId, template version, file key (private), status (`AWAITING_ACTION`, `GENERATED`, `SENT`, `FAILED`, `NEEDS_REVIEW`; `AWAITING_ACTION` is shown on a review-category registration until an admin decides), recipient email, admin who sent it (for the manual route), the admin's edits to the text if any, generated at, error. Unique on (registration, trigger, template) for automatic sends, so no duplicates; a manual resend or regenerate makes a new row with a reason.
- **Merge fields** (`{{participant.fullName}}`, `{{registration.reference}}`, `{{event.name}}`, `{{event.dates}}`, `{{event.venue}}`, `{{category.name}}`, `{{application.outcome}}`, `{{letter.issueDate}}`, plus any form field by id). A required field that's empty puts the letter in `NEEDS_REVIEW` instead of sending a broken letter.
- **EmailTemplate** for the registration confirmation, payment success (with the registration reference and next steps), payment failed (with a retry link), contact auto-reply and admin notifications. Same merge fields. No email goes out while a payment is still pending. The default payment-failed wording says the payment didn't go through and never says the application was rejected (SRS 3.10 B); GYN can edit the text, and the editor shows that rule next to the template.
- **EmailMessage** (the outbox and the notification log in one table): to, template and version, subject, status (`QUEUED`, `SENT`, `FAILED`), attempts, last error, sent at, attachment keys.

### Admin, settings, SEO

- **User**: email, name, password hash (Node's built-in `crypto.scrypt`, no dependency), role, active, last login, failed-login counter and lockout time.
- **Role**: name plus a list of permission strings, seeded with the six SRS roles: Super Administrator, Event Manager, Registration Manager, Finance Manager, Content Manager, Viewer. The Super Administrator can create users, assign roles and edit a role's permissions (SRS 7). Permissions are checked by name in code (`registrations.export`, `payments.refund`, `forms.publish`...), never by role name.
- **Session**: hashed token, user, expiry (8 hours, sliding), IP, user agent. httpOnly, Secure, SameSite=Lax cookie. Revoked by deleting the row.
- **Setting**: key and value. Site timezone for "Today" and "Yesterday" on the dashboard, upload limits, GA4 measurement ID, Search Console verification token, robots.txt text, default currency, sender address.
- **MediaAsset** and **Gallery**: rewritten for local storage (storage key, variants, width, height, bytes, alt text, title, event, gallery, order). Images: JPG, JPEG, PNG and WebP. Videos: MP4 and WebM uploads are supported (SRS 3.6), with a file-size limit GYN sets in Settings; YouTube links work too and are recommended for long videos because of the disk budget.

## Admin panel modules

Mapped to SRS sections. Each is a screen under `/admin`.

| Module | SRS | Contents |
|---|---|---|
| Dashboard | 3.1 | Today, Yesterday, Last 30 days, Total: revenue and number of paid registrations. Filters: day, week, month, custom range, event, category, form, payment status. Registrations and payments are counted separately so nothing is counted twice |
| Applications (review panel) | 3.8, 3.9, v1.2 | The **incoming applications** queue for `MANUAL_REVIEW` categories. Tabs: Incoming, Under review, Accepted, Waitlisted, Rejected, Ready to send. Filters: event, category, payment status (default: paid), date. Open an application to see the answers and documents, add notes, assign it to a reviewer. Actions: Accept, Waitlist, Reject, each with an editable personalised-email preview and "send now" or "send later". Bulk accept and bulk send for a selected group. Every decision and every send is logged. Permissions: `applications.view`, `applications.decide`, `applications.send_email`, so GYN chooses who can review and who can send |
| Registrations | 3.2, 3.3 | List with the screenshot's columns (select, favourite, name, nationality, gender, payment status, email, WhatsApp, entry date), column picker, sort, search by name, email or entry number, filters, bulk actions (mark read, spam, trash, favourite, export), pagination. Detail view in sections (registration, personal, additional), "show empty fields" toggle, edit with audit, notes, document download, payments, letters and emails sent, history |
| Forms | 3.4 | Forms table (name, event, category, status, submissions, created, modified, actions: edit, duplicate, preview, view entries, archive). Builder: drag-and-drop fields and sections, field settings panel, steps, conditions, preview, save draft, publish, version history |
| Events | 3.5 | Create and edit events, categories and fees, assign forms, sections editor, media, status, featured, move between upcoming and past |
| Payments | 5.3, 5.4 | All payments with participant, entry number, event, category, form, gateway, transaction ID, amount, currency, date, status. Refunds (Finance permission, audited). Manual status change for edge cases (a bank transfer confirmed by email, a gateway error), only with its own permission, a required reason, and an audit entry (SRS 5.3). "Resend payment instructions" on failed and pending registrations (SRS 3.10 B). Reconciliation report: payments without a completed registration, registrations with pending or failed payments, gateway vs database mismatches |
| Letters and emails | 3.8 to 3.10 | Letter templates (rich-text editor, merge fields, test with a sample registration, activate), email templates, delivery log with resend |
| Reports | 3.7 | Registration and financial reports, all SRS breakdowns, exports to Excel, CSV and PDF |
| Media | 3.6 | Upload, galleries by event, alt text, replace, delete, pick for pages |
| Pages and SEO | 2.1, 2.4 to 2.6, 6 | Home, About, Contact and policy content, per-page SEO, redirects, sitemap, robots.txt, analytics IDs |
| Contact inbox | 2.5 | Contact form messages, read and archived |
| Users and roles | 7 | Users, roles, permissions, audit log viewer |

## Public site changes the backend drives

- `/events/upcoming`, `/events/past`, `/events/[slug]` rendered from the database. Each event page renders its sections in order.
- Navbar "Past Events" and "Upcoming Events" dropdowns read published events from the database, newest first.
- Registration pages: `/events/[slug]/register/[form-slug]`, rendered from the published form version. On submit: validate with the engine, check duplicates and Turnstile, create the registration with its entry number, then either show the confirmation or send the participant to Stripe or PayPal.
- `/pay/[reference]?t=...`: signed retry link from the failed-payment email.
- Payment return pages never decide the result; they show "confirming your payment" and poll the registration status, which only the webhook changes (SRS 5.4).
- `sitemap.xml`, `robots.txt`, and Event and Organization JSON-LD generated from the database.

## Payments in detail

- **Stripe**: keep the fetch-based Checkout code in `features/payments/stripe.ts` and the webhook route, moved onto the new Payment model. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`.
- **PayPal**: Orders v2 REST API over fetch (no SDK). Create the order, capture after approval, then confirm through webhooks (`PAYMENT.CAPTURE.COMPLETED`, `DENIED`, `PENDING`, `REFUNDED`), each verified with PayPal's verify-webhook-signature call. A browser return alone never marks a registration paid.
- **Idempotency**: unique webhook event IDs, an idempotency key per attempt, and status changes only in allowed directions (a `PAID` registration can't drop back to `PENDING`).
- **Worker re-checks** any payment still pending after 30 minutes by asking the gateway, so a missed webhook can't leave someone stuck.
- **Nightly reconciliation**: pull the day's Stripe and PayPal transactions and match them by reference; mismatches show in the Payments module.

## Load, no data loss, uptime and security

Azam, 6 Nov: the system must take a heavy day (1,000 registrations or more) without losing or missing a single one, stay up, and keep participant data from leaking.

### Targets

| Target | Number we test against |
|---|---|
| Daily volume | 1,000 registrations a day is the stated case; we test **10 times that**: 1,000 in one hour |
| Deadline spike | 50 people submitting at the same moment, with file uploads |
| Speed | Form submit (without files) answers in under 1 second for 95% of requests at that load |
| Data loss | Zero accepted registrations lost. If the server dies mid-day, at most 5 minutes of data at risk, recovered from the database's change log |
| Missed work | Zero missed confirmation emails, letters or payment updates; everything owed is retried until done or flagged |
| Uptime | No downtime during deploys; automatic restart after a crash; an alert to AZEKTRA within 2 minutes if the site is unreachable |

A thousand a day is small for Postgres (under one a minute on average). The real risks are a deadline spike, large uploads, and the fact that everything runs on one server. The design handles those three.

### Handling load

- **The submit request does as little as possible.** Validate, save the registration, its files and its follow-up jobs in **one database transaction**, answer. Emails, letters, PDFs and notifications run later in the worker. A slow email provider can't slow down or break a submission.
- **Uploads stream to disk** instead of being held in memory, with a cap on how many upload at once and Caddy's body-size limit in front. The form submit and its files are one request, so a registration never exists with half its documents.
- **Public pages are pre-rendered** and refreshed when an admin publishes, so a traffic spike on an event page doesn't touch the database at all. Only the submit and payment routes hit Postgres.
- **Database**: a fixed connection pool sized to the server, indexes on every column the registration list filters or sorts by, and keyset pagination so page 200 of the list is as fast as page 1.
- **Rate limits** generous enough for many applicants behind one university or office IP, strict enough to stop a bot. Turnstile does the real bot filtering.
- **Load test before launch** with k6 (run from a Docker image, not a project dependency) against staging on the real Netcup server: the hour-long 1,000-registration run and the 50-at-once spike, with files. Launch waits until both pass.

### No data loss, nothing missed

- **Idempotency key on every submit**, so a double click, a refresh or a phone losing signal can't create two registrations, and a retry after a timeout finds the one that already saved instead of failing.
- **Outbox pattern**: the jobs a registration needs (confirmation email, letter, admin notification) are written in the same transaction as the registration. If the registration is saved, its jobs exist. The worker retries failed jobs with backoff and flags anything still failing after 24 hours in the admin.
- **Form drafts in the browser**: the participant's typed answers (not files, not sensitive fields) are kept on their device while they fill a long form, so a closed tab or a dropped connection doesn't lose 20 minutes of typing.
- **Files** are written to a temporary name, flushed to disk, and moved into place before the database commit. A nightly job removes any file that never got a registration.
- **Postgres** keeps its safe defaults (`fsync` and `synchronous_commit` on), with data checksums turned on at creation, so corruption is detected instead of silently spreading.
- **Backups**: a full encrypted backup every night, plus the database's change log (WAL) shipped off the server every 5 minutes, so we can restore to any minute. Uploads copied off the server nightly. Backups go **off the server**: a backup on the same disk dies with the disk. We do a test restore before launch and once a month after.
- **Disk-full protection**: an alert at 75% full, and uploads are refused with a clear message before the disk fills, because a full disk is how a database stops accepting writes.
- **Payments** already can't be missed: webhooks are verified and recorded once each, and the worker asks the gateway about anything still pending after 30 minutes (see Payments).

### Staying up

- Docker restarts any crashed container; health checks on the app, worker and database.
- **Deploys without downtime**: the new version starts next to the old one, Caddy switches traffic once the new one passes its health check, then the old one stops. A Netcup snapshot is taken before every deploy so a bad release rolls back in minutes.
- **Deploy freeze** on registration deadline days.
- An external uptime check pings a health URL every minute and alerts AZEKTRA. Server errors are logged (without participant data) and emailed.
- Honest limit: one server is one point of failure. If Netcup's hardware fails, the site is down until it's restored on new hardware from backup. A second server is the fix if GYN ever needs more than that.

### Security

SRS 8.3, plus protecting the most sensitive data (passports and personal details) as if a leak is the worst outcome for GYN, because it is.

**People and access**

- Every admin account gets **two-step login** (an authenticator app code, TOTP built with Node's crypto, no dependency). Required, not optional.
- Login rate limit and lockout, session rotation on login, 8-hour sessions, every session revocable.
- Least privilege: permissions per action. Exporting data and downloading documents are separate permissions, and **every export and every document download is logged** with who, when and what.
- The Viewer role sees participant data with sensitive fields hidden.

**The data itself**

- **Sensitive fields are encrypted in the database.** The form builder has a "sensitive" switch on each field (passport number, date of birth, ID numbers, anything GYN marks). Those values are stored encrypted (AES-256-GCM) with a key that lives only in the server's environment, not in the database or the backups. A stolen database dump shows ciphertext for those fields.
- **Participant documents are encrypted on disk** with the same scheme, so a copied upload folder is unreadable.
- **Backups are encrypted** before they leave the server.
- Data retention: documents of past events are removed or archived off the server after the period GYN chooses (open question 7).

**The application**

- Permission check inside every server action and route handler; `proxy.ts` is only a redirect. Every admin change writes an `AuditLog` row with the old and new value.
- zod validation on every input; Prisma queries only, no raw SQL with user input (SQL injection). Rich text is stored as JSON and rendered by our own renderer, never as raw HTML (cross-site scripting).
- Strict security headers: HSTS, a Content Security Policy, no framing. Route handlers check the request origin; server actions already do.
- Uploads: type checked from the bytes (the existing `sniffImage` approach, extended to PDF), size limits, random file names, stored outside the web root, private files only through the admin download route. Virus scanning with ClamAV if the server has the RAM for it (about 1 GB).
- Turnstile and a honeypot on public forms (both exist today), plus rate limits.
- No card data ever touches the server; Stripe and PayPal host the payment pages.
- Secrets only in the server's env file, never in the image or the repository. `npm audit` on every build.

**The server**

- SSH with keys only, no password logins, no root login.
- Firewall: only ports 22, 80 and 443 open. Postgres is reachable only inside Docker's private network, never from the internet.
- Containers run as non-root users. Automatic security updates for the operating system. fail2ban on SSH.

**Before launch:** a full security review of the code and the server against the OWASP checklist (by a separate security-focused review pass), and the issues fixed before GYN's data goes in.

## Storage budget (the "practical limit" the SRS asks us to disclose)

About 20 GB total. Estimates, to confirm once the server specs arrive:

| Use | Estimate |
|---|---|
| OS, Docker, images (app, Postgres, Caddy) | 5 to 6 GB |
| Database | under 1 GB for years (about 4,000 applications per event, from `docs/schema.md`) |
| Local backups (last 7 nights, compressed) | 1 to 2 GB |
| Event photos (resized at upload, about 300 KB each) | about 0.5 GB per event |
| Participant documents | **the big one**: 4,000 applicants with two 2 MB files is 16 GB per event |

So participant uploads need hard limits: 2 MB per file, PDF, JPG and PNG only, images shrunk on upload, and the documents of past events moved off the server (downloadable archive) after a set time. Video uploads are allowed with a size limit GYN sets, but long videos should go on YouTube. This goes to GYN in writing before launch.

## Progress

**Phase 1 (foundation) is done**, on the `backend` branch (not merged to `master`, so the live Vercel pitch site is untouched). Details and how to run it are in `docs/dev-setup.md`.

- New baseline schema (all models above) and migration, with the database-level rules added by hand: frozen published form versions, frozen letter template versions, append-only audit log, form capacity and money CHECK constraints.
- `lib/server/crypto.ts` (AES-256-GCM, key rotation, values bound to their record), `lib/server/storage.ts` (random keys, atomic writes, refuses when the disk is nearly full, private files encrypted), `lib/server/jobs.ts` and `worker/` (outbox queue, retries with backoff, stuck-job recovery, graceful shutdown), `/api/health`.
- Dev Postgres in Docker, seed for SISM 2026 and FMST 2026 with their categories (scholarships `MANUAL_REVIEW`; Forum Access, Self-Funded and Invitation Letter `AUTOMATIC`), 63 unit tests and 20 integration tests.
- `output: 'standalone'` for the Docker image; production Dockerfile, compose stack, Caddy config and the Netcup runbook (`docs/netcup-deploy.md`). The whole stack was run locally the way it will run on Netcup: migrations applied (30 tables, 3 safety triggers), all containers healthy, real pages served through Caddy, `/admin` locked, `/.env` blocked, a 30 MB upload refused with 413, the worker ran a queued job, the database has no internet access, the worker can reach the internet, and the app restarted itself after its process exited. Two bugs found and fixed in review: the health check used `wget`, which the slim Node image does not have (the stack would never have come up), and the worker was on the no-internet network (it could not have reached email, Stripe or PayPal).
- Finding from the load test: Prisma gives up after 2 seconds waiting for a database connection, which lost 22 of 300 simultaneous submissions. Fixed with `createPrismaClient` (15 second wait). With it, 300 simultaneous submits finish in about 3 seconds on a 20-connection pool with none lost, and exactly 250 of 300 take the 250 available places.
- The old fixed-ticket registration flow is switched off when a database is configured; phase 6 replaces it.

Not started: everything from phase 2 on. Phase 2 waits for the Netcup details.

## Build order

Each phase ends working, tested and committed. Sizes are relative (S, M, L).

1. **Foundation (M).** Docker Compose for dev (Postgres) and prod (app, worker, db, Caddy, backup). New baseline Prisma schema. Local storage module. Worker skeleton with the job table. Test setup against a real Postgres in Docker. Seed SISM 2026 and FMST 2026 from `content/events.json` (our own content, not old WordPress data).
2. **Staging on Netcup (S), as soon as access arrives.** Deploy the skeleton next to WordPress on a test subdomain (for example `new.thegyn.org`), so server problems show up in week one, not at launch. WordPress keeps the main domain until cutover.
3. **Admin accounts and roles (M).** Login, sessions, users, roles and permissions, audit log, admin shell (sidebar, header, layout). Replaces `ADMIN_BASIC_AUTH`.
4. **Events and categories (M).** Event CRUD, categories and fees, section editor, upcoming and past computed from dates, public event pages and navbar dropdowns from the database, redirects from the old URLs.
5. **Form engine and builder (L).** Definition format, engine with tests, public renderer (steps, conditions, file uploads), builder with drag and drop, preview, drafts, publishing, versions, forms table, duplicate and archive.
6. **Registrations (L).** Submit flow, listing, detail view, edit with audit, notes, documents, CSV and Excel export, and the **applications review panel** with accept, waitlist and reject (the decisions and statuses; the email sending comes in phase 8).
7. **Payments (L).** Stripe on the new model, PayPal, retry links, refunds, payments module, worker re-checks, reconciliation.
8. **Email and letters (L).** SMTP outbox, email templates, letter templates with rich text and merge fields, PDF generation, the automatic flow for Self-Funded, Forum Access and Invitation Letter, the admin-sent flow for review categories (personalised preview, per-person edits, "send now / send later", bulk send, ready-to-send list), delivery log, resend and regenerate, test with sample data.
9. **Dashboard and reports (M).** Cards, filters, report pages, Excel, CSV and PDF exports.
10. **Media, pages, SEO, contact inbox (M).** Media library and galleries, page sections for Home, About, Contact and policies, SEO fields, sitemap, robots, analytics settings.
11. **Launch (L).** Off-server encrypted backups with WAL shipping and a tested restore, zero-downtime deploys, uptime alerts, error logging, server hardening, the k6 load tests (1,000 registrations in an hour, 50 at once with files) passing on the real server, the security review with its fixes, UAT against SRS section 11, DNS cutover from WordPress, a week of watching.

Built in from phase 1, not bolted on at the end: the outbox table, idempotency keys, field encryption, the audit log, and the two-step login in phase 3.

The frontend redesign starts after phase 4, when event data comes from the database.

## New dependencies

Each one replaces a lot of code we'd otherwise write and maintain.

| Package | For | Why not built in |
|---|---|---|
| `nodemailer` | SMTP sending | SMTP and attachments by hand is error-prone |
| `@dnd-kit/core`, `@dnd-kit/sortable` | Form builder drag and drop | Keyboard-accessible dragging; native HTML drag and drop isn't |
| `@tiptap/react`, `@tiptap/starter-kit` | Rich-text editor for letters, emails, policies | Stores JSON, so we render it safely ourselves |
| `@react-pdf/renderer` | Letter and report PDFs | Pure Node, no headless Chrome to fit in a small VPS's RAM |
| `exceljs` | `.xlsx` exports | The SRS asks for Excel, not just CSV |
| `@playwright/test` (dev only) | End-to-end tests of the main workflows | UAT against the acceptance criteria |

Stripe and PayPal stay on plain `fetch`, as Stripe already does.

## Testing

- **Unit:** form engine (every field type, every condition, versioning), merge fields, permissions, payment state changes, webhook idempotency. Uses the existing `node --test` setup.
- **Integration:** against Postgres in Docker. Submit, pay (Stripe and PayPal test mode, webhooks replayed), letter generated and queued, dashboard numbers match.
- **Browsers (SRS 8.6):** the end-to-end tests run in Chromium, Firefox and WebKit (Safari's engine), and on phone, tablet and desktop sizes. The admin panel has to work on all three sizes too (SRS 8.1).
- **End to end:** Playwright on the SRS section 10 workflows (create event, create form, register and pay, manage registrations, run a report).
- Before each phase is called done: `tsc`, lint, tests, build, and the axe check on any public page it touched.

## SRS coverage

Every SRS section and where this plan handles it. Checked line by line on 6 Nov 2026.

| SRS | Requirement | Plan section | Phase |
|---|---|---|---|
| 1.2, 1.3 | Objectives and scope | Whole plan | all |
| 2.1 | Home page, manageable from the backend | Page and PageSection; featured events | 4, 10 |
| 2.2 | Previous events: dropdown, listing, detail pages, publish, unpublish, archive | Event, EventSection; public site | 4 |
| 2.3 | Upcoming events: details, packages, categories, register buttons, announcements, deadlines, auto upcoming or past, featured | Event, EventSection, RegistrationCategory | 4 |
| 2.4 | About Us | Page and PageSection | 10 |
| 2.5 | Contact: details, form, optional Google Maps, submissions in the backend | Page sections; contact inbox | 10 |
| 2.6 | Legal pages, editable, in the footer, terms acceptance recorded | Page and PageSection; Registration `termsVersion` | 6, 10 |
| 2.7 | Registration pages per category, field types, validation, entry number, payment status, mobile | Forms; registrations; public site | 5, 6 |
| 3.1 | Dashboard cards and filters (subscriptions dropped, see Fixed decisions) | Admin modules: Dashboard | 9 |
| 3.2 | Registration list: columns, sort, search, filter, select, export, pagination, edit | Admin modules: Registrations | 6 |
| 3.3 | Registration detail: sections, edit, notes, documents, payments, history, empty fields toggle | Admin modules: Registrations | 6 |
| 3.4 A to G | Unlimited form builder: creation, editing, field types, conditions, steps, limits, dashboard, versions, data | Forms | 5 |
| 3.5 | Event management: create, upcoming, previous | Events and pages; admin modules: Events | 4 |
| 3.6 | Media: images and videos, galleries, alt text, replace, size limits | MediaAsset and Gallery; admin modules: Media | 10 |
| 3.7 | Registration and financial reports, filters, Excel, CSV, PDF | Admin modules: Reports | 9 |
| 3.8 | Letter templates: editor, letterhead upload, merge fields, versions, test, delivery log | Letters and email | 8 |
| 3.9 | Automatic letters for Self-Funded / Forum Access and Invitation Letter; held until approval when review is required | Letters and email (two routes); Applications review panel | 6, 8 |
| 3.10 | Payment outcomes, success and failure emails, separate payment and application status | Registrations; Letters and email; Payments in detail | 7, 8 |
| 4.1 to 4.4 | Central database, relationships, no data loss, historical records | Data model; No data loss | 1, 6 |
| 5.1, 5.2 | Stripe and PayPal | Payments in detail | 7 |
| 5.3 | Payment management, manual changes audited | Admin modules: Payments | 7 |
| 5.4 | Reconciliation, never trust redirects | Payments in detail | 7 |
| 6 | SEO tools | Page SEO fields; Pages and SEO module | 10 |
| 7 | Six roles, editable permissions | Admin, settings, SEO | 3 |
| 8.1 | Responsive site and admin | Testing | all |
| 8.2, 8.5 | Performance and scalability | Handling load | all, 11 |
| 8.3 | Security | Security | 1, 3, 11 |
| 8.4 | Backups, exports, secure documents | No data loss; Security | 11 |
| 8.6 | Chrome, Firefox, Edge, Safari | Testing | all |
| 9, 14 | Content and access GYN provides | Open questions | n/a |
| 10 | Workflows | Testing (end to end) | 11 |
| 11 | Acceptance criteria (v1.1 and v1.2) | Build order, launch phase UAT | 11 |
| 12 | Deliverables | Build order | all |
| 13 | Future enhancements | Out of scope (Fixed decisions) | later |

## Open questions

For Azam or GYN. Each one blocks only the phase named.

1. **Netcup (phase 2):** plan, RAM and CPU, operating system, root SSH, and what serves ports 80 and 443 today (Apache, nginx, Plesk?). Who controls DNS for thegyn.org?
2. **SMTP provider (phase 8):** which service sends GYN's email, and from which address?
3. **Stripe and PayPal (phase 7):** test keys now, live keys before launch. USD only, or other currencies?
4. **Entry numbers (phase 6):** start after the old site's numbers (above 7,000) so staff don't mix them up?
5. **Dashboard timezone (phase 9):** which timezone is "Today" for GYN?
6. **Review scenarios (phases 6 and 8), Azam is sending these on 7 Nov:** which categories and situations go to the review panel besides scholarships. Also: should an application show in the panel only after its fee is paid (the default we assume), who is allowed to review and who to send, and whether waitlist and rejection emails are needed or only acceptance.
7. **Document retention (phase 6):** how long to keep passport scans and CVs after an event?
8. **Admin users (phase 3):** names, emails and roles of the first GYN users.
9. **Off-server backup target (phase 11):** where encrypted backups go. Any S3-compatible storage or an SFTP box works; it must not be the same server.
