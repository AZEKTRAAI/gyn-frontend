# Phase 4 + site redesign: build plan

Orchestrated by Opus, built by Sonnet agents. Written 17 Nov 2026. Read `docs/frontend-design-plan.md`, `docs/backend-plan.md` (Events and pages, phase 4) and `AGENTS.md` first.

## Goal

1. Every event has its own page at `/<slug>` (for example `/fms-thailand`, `/sism-2026`), built from data the team edits in the admin. A new event needs no code: create it in the admin, fill the sections, publish.
2. The navbar's "Past Events" and "Upcoming Events" dropdowns list events from the database. An event moves from upcoming to past by itself when its end date passes.
3. Every past event page has its own ambassadors map, edited per event in the admin.
4. All other public pages get the new design (royal + lime, glass, Plus Jakarta Sans + Inter, centred symmetric sections that fit one laptop screen).
5. Everything runs against the dev Postgres in Docker (`gyn-dev-db-1`, port 5433) and still builds and renders with no database (seed fallback), because the Vercel preview has none.

## Fixed decisions

- **Content contract:** `packages/core/src/event-schema.ts` (written, do not change field names without telling the orchestrator). One schema for all events; sections hide themselves with `visible`.
- **Storage:** the `Event` row holds details (name, dates, venue, status, SEO). Page content is one `EventSection` row per section key (`blockType` = key, `data` = that section's JSON), exactly like `home-store.ts` does with `PageSection`. Bad stored sections fall back to the default for that section.
- **No-database fallback and seed source:** `content/event-pages/<slug>.json` holds `{ details, content }` for each seeded event. The store reads these when `DATABASE_URL` is unset or the database is unreachable; the seed writes them into the database.
- **Slugs = URLs.** FMST's slug becomes `fms-thailand` (its live URL). SISM stays `sism-2026`. The seed renames the old `fmst-2026` row if it exists. Slugs are fixed after creation.
- **New column:** `Event.navLabel String?` (short dropdown label like "FMS Thailand 🇹🇭"), via a Prisma migration.
- **Timing:** `eventTiming()` in the schema file. Upcoming sorted by start date ascending, past by start date descending.
- **Design system:** `app/globals.css` tokens and utilities (`.glass`, `.glass-dark`, `.glass-lite`, `.hl`, `.hl-dark`, `.btn`, `.btn-y`, `.btn-g`, `.wrap`), `components/landing/` (`SectionHead`, `Accent`, `torn.ts`, `landing.module.css`), the home hero's royal box with scattered torn photos. Two fonts only. Lime text only on royal; on white the highlight is the lime marker (`.hl`).
- **Words:** "registration categories" / "forum access", never "tickets". No "subscriptions".
- **Never:** commit (the orchestrator commits), push, kill all node processes, touch other Docker containers, run `docker system prune`, start a second dev server on port 3000 (one is already running there without a database), add dependencies without need.

## Work packages

### A. Event store, migration, seed (core)
- `prisma/schema.prisma`: `navLabel String?` on `Event`; migration via `npm run db:migrate` (dev DB on 5433).
- `content/event-pages/fms-thailand.json` and `content/event-pages/sism-2026.json`: `{ details, content }` valid against `eventDetailsSchema` / `eventPageSchema`. Fill from the real data: `content/events.json`, `content/media.json`, `features/media/media.ts` (GALLERY, SPEAKERS, ADVISORY), `app/fms-thailand/page.tsx`, `app/sism-2026/page.tsx`, `content/home.json` (network section for FMST's ambassadors: hub Bangkok). Only real content; leave a section `visible: false` with empty lists rather than invent anything.
- `packages/core/src/event-store.ts`:
  - `listPublicEvents(): Promise<EventSummary[]>` (published, not deleted, with `timing`, `navLabel`, dates, city, country).
  - `getPublicEvent(slug): Promise<PublicEvent | null>`: details + merged content + active registration categories (name, slug, feeCents, currency, approvalMode, seatLimit, opensAt, closesAt, open flag).
  - Admin side: `listAllEvents()`, `getEventForEdit(slug)`, `createEvent({ slug, details, kind: 'past' | 'upcoming' }, meta)` (default content: past shows highlights, overview, ambassadors, chapters, schedule, speakers, gallery, videos, stories, cta; upcoming shows highlights, overview, categories, schedule, speakers, faq, cta), `saveEvent(slug, { details, content }, meta)`, `setEventStatus(slug, 'DRAFT' | 'PUBLISHED' | 'ARCHIVED', meta)`. Every write in a transaction with an `AuditLog` row (old and new value), like `saveHome`.
  - DB read errors fall back to the JSON files with `console.error` (the public site must never crash because the database is down).
- `prisma/seed.ts` + `prisma/seed-data.ts`: write details and sections from the JSON files; rename `fmst-2026` to `fms-thailand`; keep categories as today. Update `seed-data.test.ts`.
- Tests: unit tests for merge-over-default, timing, slug rules, JSON files validating against the schema (no DB). Integration test for create/save/status + audit row if the existing integration setup makes it cheap.

### B. Admin: Events module (after A)
- Move the generic schema form out of `admin/app/(panel)/home/HomeEditor.tsx` into a shared component (for example `admin/components/SchemaForm.tsx`), and make HomeEditor use it. Behaviour of the home editor must not change.
- `/events`: table of all events (name, dates, upcoming/past, status, last updated), "New event" button. Needs `events.view`; editing needs `events.manage`.
- `/events/new`: name, slug (suggested from the name, checked against `slugSchema`), past or upcoming, dates, city, country.
- `/events/[slug]`: two tabs or sections, "Details" (eventDetailsSchema fields + status buttons: publish, unpublish to draft, archive) and "Page" (the section editor generated from `eventPageSchema`, with image upload like the home editor). Links: "View page" to the website.
- Server actions validate with zod, check permissions, call the store, then `revalidateWeb([`/${slug}`, '/', '__layout'])`. Extend `app/api/internal/revalidate/route.ts` so `'__layout'` calls `revalidatePath('/', 'layout')` (the navbar lives in the layout).
- `admin/lib/modules.ts`: Events `built: true`.
- Check it in a browser against the dev DB: sign in as `events@gyn.test` (demo password in docs/dev-setup.md), create an event, edit a section, publish, see it on the website.

### C. Redesign the fixed pages (parallel with A)
Pages: `/about-us`, `/contact-us`, `/privacy-policy`, `/refund-policy`, `/terms-conditions` (shared `app/_components/PolicyLayout`), `/videos`, `/sism-forum-access`, `/sism-invitation-letter`, `/sism-self-funded`, `/sism-2026/registered`, `/sism-2026/registration-cancelled`. Not `/pitch`.
- Same look as the home page: royal page-top box (smaller than the home hero: headline centred, a few torn photos on the sides where the page has photos), `SectionHead` for every section, glass on colour only, centred and symmetric, sections fit one laptop screen.
- Keep every piece of real content and every form, link and behaviour (contact form posts to `/api/contact`, the forum access / self-funded / invitation letter pages keep their registration buttons and copy). Content edits only to fix the old-design leftovers.
- Put new CSS in your own modules (for example `components/pages/*.module.css`); do not edit `components/landing/landing.module.css`, `SiteHeader`, `SiteFooter` or `app/layout.tsx` (other agents own them). Delete components that become unused (`PageHero` and friends) only if nothing else imports them.

### D. Public event pages + navbar (after A)
- `components/event/`: one component per section of `eventPageSchema`, in the home page's style. The top is the royal box with the headline centred and the event's photos scattered with torn edges (reuse the home hero's approach; share code rather than copy where it is clean). Ambassadors reuse `components/home/Network` with `tone="light"`. Categories render the event's registration categories as glass cards with fee, open or closed, and a register button (existing pages: `/sism-forum-access`, `/sism-self-funded`, `/sism-invitation-letter`; scholarship buttons go to the application page link in the category content when open, otherwise show "Closed"). Upcoming events show a countdown to the start date.
- `app/[slug]/page.tsx`: renders any public event; `generateStaticParams` from `listPublicEvents`, `revalidate = 300`, `generateMetadata` from `content.seo`. Unknown or draft slugs: `notFound()`.
- Replace `app/fms-thailand/` (delete) and `app/sism-2026/page.tsx` (becomes a one-line render of the shared event page for `sism-2026`; keep `registered/` and `registration-cancelled/`).
- `app/layout.tsx`: build the "Past Events" and "Upcoming Events" children from `listPublicEvents()` (label = `navLabel || name`), keep the rest of `content/sitemap.json` nav. Make sure old absolute `https://thegyn.org/...` hrefs become site-relative.
- Home page: the "Our past summits" section links each edition to its event page; next-event strip unchanged.

## Checks for every package
`npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` must pass (build with the database unreachable must still succeed). Pages checked in a real browser at 1440×900, 1366×768 and 390×844: no horizontal scroll, no console errors, nothing overlapping text. Playwright-core with `channel: 'chrome'` is installed in the scratchpad `e2e/` folder (see `herobox.mjs` for a pattern).

## Order
A and C in parallel → B and D in parallel → orchestrator review, browser pass, commit, push `backend` (Vercel preview).

## Overnight queue (17 to 18 Nov 2026)

Azam is asleep and asked for work that needs no input from him, run as Opus plans and Sonnet builds. After about 10 finished tasks, a red-team agent reviews everything and flags problems, and the flags get fixed. Each task is committed on `backend` when it passes checks. Pushing `backend` is allowed (Vercel preview only); never `main`. Update the status column as you go; this table is the state to resume from after a usage-limit pause.

| # | Task | Status |
|---|---|---|
| 1 | A: event store, migration, seed | done, 50665b9 |
| 2 | C: fixed pages redesign | done, 83f63ab (forms still use the old dark submit buttons; follow-up in 11) |
| 3 | B: admin Events module | done, de0e5cd |
| 4 | D: public event pages + navbar from DB (also adds a `steps` section for SISM's application process) | done, f87f844, pushed |
| 5 | Admin users and roles screens (phase 3): list, create, deactivate, change role, Super Admin only | done (role-permission editing needs a decision: seed overwrites Role.permissions) |
| 6 | Audit log viewer (phase 3): filter by user, action, date; read only | done |
| 7 | Password change for the signed-in admin (phase 3); reset by email waits for phase 8 | done (temporary password is a notice, not forced) |
| 8 | Old URL redirects (trailing slashes, old WordPress paths in content/sitemap.json) and sitemap.xml / robots.txt from the events | done, f36f5ed (DB-managed redirects not honoured yet: look up Redirect only on a not-found slug) |
| 9 | Contact form messages saved to the DB + admin Contact inbox (phase 10 part) | done (menu flag lands with E's commit; a contact.manage permission would allow read-only access) |
| 10 | Registration categories editor inside the admin event page (fees, approval mode, seats, open/close dates) | done (register link per category waits for phase 5 forms) |
| 10b | Mobile menu lists every event in each dropdown group (G) | done |
| 10c | SISM content the schema still lacks: eligibility, scholarship criteria, co-host and APU blocks (a generic titled-list section may cover them) | |
| 11 | **Red team** review of 1 to 10 against the SRS and the plan; fix every confirmed flag | review done; fixes R1, R2, R3 running |
| 11b | Next.js printed a known-vulnerability warning for 16.4.2: check `npm audit`, move to the patched 16.x release if one exists, rerun every check. Do it when no agent is mid-build. | |
| 13 | Past and upcoming event listing pages, featured-event flag in the admin (SRS 2.2, 2.3) | |
| 12 | Phase 5 start: form definition format + engine with tests (SRS 3.4), no builder UI yet | |

## Red-team triage (18 Nov 2026, early morning)

No critical findings, no permission bypass (actions called directly as viewer/content were refused). Fixes assigned:

- **R1 core and data** (packages/core, prisma/seed.ts, lib/md-render.ts, features/seo test): seed never overwrites category edits; DB read errors at runtime keep the last good page instead of serving seed content (seed only with no DATABASE_URL or during the build); event saves refuse a stale `updatedAt`; reserved slugs include the redirect sources, tested against app/ routes; links and images refuse `//` and `/\`; daylight-saving date round trip fixed; markdown escaping of quotes; policy headings start at h2.
- **R2 admin** (admin/**): temporary passwords must be changed before anything else; event editor sends `updatedAt` and shows a "someone else saved" message; image uploads write an audit row; LOGIN_FAILED stores the typed email only when it looks like an email; admin contact topics come from core.
- **R3 public site** (components, app, content/home.json, app/api/contact, features/contact): Register buttons only where a real form exists (SISM 2026), editor-only categories say so; navbar "Book" pill and its price come from the next upcoming event's forum-access category and hide when none; navbar refreshes on its own (revalidate) so events move to Past without a redeploy; Event JSON-LD on event pages; registration close date on category cards; contact rate limit before Turnstile, one topic list; drawer label contrast; no "ticket" wording.
- **Later / needs Azam:** privacy policy wording and retention for stored IPs and contact messages; who owns role permissions (admin screen vs code); shared-IP rate limiting if deployed behind nginx (Netcup phase); past/upcoming listing pages and the featured-event flag (queued as 13); dev DB leftovers (old home hero fails the schema; test users/events).

Not tonight (needs Azam or comes last): two-step login, Netcup, merging to `main`, client sign-off items, payment keys.
