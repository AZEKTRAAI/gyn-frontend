# thegyn.org redesign

Next.js rebuild of thegyn.org, the Global Youth Network site: summit pages for SISM 2026 (Kuala Lumpur, 19 to 22 Nov 2026) and FMS Thailand 2026, paid registration through Stripe Checkout, and a contact form.
The design is direction G, "Deep Field" (see `docs/DECISIONS.md` D13 and `docs/handoff.md`). URLs match the live WordPress site so existing links keep working.

## Stack

Versions are exact pins from `package.json` unless marked with a caret.

| Package | Version |
|---|---|
| next | 16.4.2 (App Router, `next dev --turbopack`) |
| react / react-dom | 19.3.1 |
| typescript | ^5.9.3 (5.9.3 installed) |
| tailwindcss / @tailwindcss/postcss | 4.3.3 |
| prisma / @prisma/client / @prisma/adapter-pg | 7.10.1 |
| zod | 4.6.7 |
| react-hook-form | 7.90.0 |
| @hookform/resolvers | 5.9.1 |
| motion | 14.3.0 |
| lenis | 1.3.27 |
| gray-matter | 4.0.3 |
| eslint | 10.12.0 |
| eslint-config-next | 16.4.2 |
| @types/node | 26.6.5 |
| @types/react / @types/react-dom | 19.3.0 |
| @types/pg | 8.23.1 |

Not installed on purpose: the `stripe` SDK (the adapter in `features/payments/stripe.ts` calls the REST API with `fetch`, D20), `next-cloudinary`, Auth.js, a markdown library (`lib/md-render.ts` is a 100-line renderer, D26). `pg` is imported by `lib/db.ts` but only arrives as a dependency of `@prisma/adapter-pg`; add it to `package.json` before relying on it.

Fonts are Krona One (display) and Schibsted Grotesk (body), self-hosted through `next/font/google` in `app/layout.tsx`.

## Quick start

Node 22 (tested on 22.20.0).

```bash
npm install
npm run dev
```

Open http://localhost:3000. No `.env.local` is needed.

### Demo mode

With no env vars set, every external service has a local stand-in:

| Missing | What happens instead |
|---|---|
| `DATABASE_URL` | `lib/db.ts` returns `DemoStore` (`lib/server/repo.ts`), an in-memory store seeded from `TICKETS`. Everything is lost on restart. |
| `STRIPE_SECRET_KEY` | `POST /api/registrations` skips Stripe and returns `/sism-2026/registered?ref=...&ticket=...&demo=1`. That page says no payment was taken. |
| `STRIPE_WEBHOOK_SECRET` | `/api/webhooks/stripe` rejects every request with 400. |
| `RESEND_API_KEY` | Emails are printed to the server console. |
| `UPSTASH_REDIS_REST_*` | Rate limiting uses an in-memory window, per process. Limits per 10 minutes: registrations 20 per IP and 3 per email, contact 5 per IP. |
| `TURNSTILE_SECRET_KEY` | Skipped with a console warning, **in development only**. With `NODE_ENV=production` (`npm start`, Vercel) the check fails closed and both forms return 400 "CAPTCHA is not configured". Set Turnstile keys before any production deploy, or use Cloudflare's test keys below. |

So `npm run dev` gives you the full registration flow end to end without money moving. `npm run build && npm start` without Turnstile keys does not.

## Environment variables

Copy `.env.example` to `.env.local` and fill in what you need. Everything below comes from `.env.example`; the "Read by" column is where the code reads it today.

### Database (Neon Postgres, Singapore)

Production is Neon Launch in `aws-ap-southeast-1` (D45; sizing, costs and upgrade triggers in `docs/infrastructure.md`). Any Postgres works for development.

| Var | Switches on | Read by | Where to get it |
|---|---|---|---|
| `DATABASE_URL` | `PrismaRepo` instead of `DemoStore` | `lib/db.ts` | Neon console > your project > Connect, the pooled connection string (host ends in `-pooler`), with `sslmode=require` |
| `DIRECT_URL` | `prisma migrate` (un-pooled) | `prisma.config.ts` | Same dialog with pooling switched off (host without `-pooler`) |

### Stripe

| Var | Switches on | Read by | Where to get it |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Real Checkout Sessions | `app/api/registrations/route.ts`, `features/payments/stripe.ts` | Dashboard > Developers > API keys. Use `sk_test_...` until launch |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature check (required for the webhook to accept anything) | `app/api/webhooks/stripe/route.ts` | `stripe listen` prints one locally; in production, Dashboard > Developers > Webhooks > your endpoint > Signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Nothing yet. Checkout is a redirect and needs no client key | not read | Dashboard > Developers > API keys |

### Payoneer

Commented out in `.env.example` and not used (D18, D22). `features/payments/payoneer.ts` is a stub.

### Resend (email)

| Var | Switches on | Read by | Where to get it |
|---|---|---|---|
| `RESEND_API_KEY` | Real email sends | `lib/server/email.ts` | resend.com > API Keys |
| `EMAIL_FROM` | From address | `lib/server/email.ts` | Must be on a domain verified in Resend > Domains (needs DNS records on thegyn.org) |

### Cloudinary

| Var | Switches on | Read by | Where to get it |
|---|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | Nothing yet | not read | Cloudinary console > Dashboard |
| `CLOUDINARY_API_KEY` | Nothing yet (needed for signed uploads from the admin panel) | not read | Console > Settings > API Keys |
| `CLOUDINARY_API_SECRET` | Same | not read | Same page. Server only |
| `CLOUDINARY_UPLOAD_PRESET` | Same | not read | Console > Settings > Upload > Upload presets |

`next-cloudinary` reads `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, which is not in `.env.example` yet. See the Cloudinary section below.

### Upstash Redis

| Var | Switches on | Read by | Where to get it |
|---|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Shared rate limit across serverless instances | `lib/server/rate-limit.ts` | console.upstash.com > your Redis database > REST API, or the Upstash integration in the Vercel Marketplace (it sets both vars for you) |
| `UPSTASH_REDIS_REST_TOKEN` | Same | same | Same |

If Upstash errors, the limiter drops back to the in-memory window instead of letting requests through.

### Cloudflare Turnstile

| Var | Switches on | Read by | Where to get it |
|---|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | The widget on the registration form | `features/registration/ui/RegistrationForm.tsx` | Cloudflare dashboard > Turnstile > Add widget, hostnames `thegyn.org` and your Vercel preview domain |
| `TURNSTILE_SECRET_KEY` | Server-side verification | `lib/server/turnstile.ts` | Same widget |

Cloudflare's always-pass test keys work for local and preview testing: site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.

The contact form does not render a Turnstile widget yet, so once `TURNSTILE_SECRET_KEY` is set (or in production without it) every contact submission fails. Fix that before launch.

### Application

| Var | Switches on | Read by | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | Stripe success/cancel URLs and the demo redirect | `app/api/registrations/route.ts` | Defaults to `http://localhost:3000`. On a preview deploy set it to that deploy's own URL: the form only follows redirects to `checkout.stripe.com` or its own origin |
| `AUTH_SECRET` | Nothing yet. Reserved for Auth.js in the admin panel | not read | `openssl rand -base64 32` |
| `NODE_ENV` | Turnstile fail-closed, set by Next itself | `lib/server/turnstile.ts` | Don't set it by hand on Vercel |

Not in `.env.example` yet but read by the code: `proxy.ts` (Next 16's name for middleware) reads `ADMIN_BASIC_AUTH` and `PITCH_BASIC_AUTH`, each `user:password`, and puts HTTP Basic Auth on `/admin` and `/pitch`. Unset means unguarded.

## Scripts and checks

```bash
npm run dev          # next dev --turbopack on :3000
npm run build        # next build
npm start            # next start (after a build)
npm run typecheck    # tsc --noEmit
```

`npm run lint` is in `package.json` but runs `next lint`, which Next 16 removed; it fails with "Invalid project directory". Run ESLint directly until the script is changed to `eslint .`:

```bash
npx eslint .
```

Tests use the built-in Node test runner with type stripping (no Jest, no tsx). The test files are excluded from `tsconfig.json` because they import with `.ts` extensions (D35, D36).

```bash
node --experimental-strip-types --test features/payments/stripe.test.ts features/registration/schema.test.ts lib/server/tests.ts
```

That is 38 tests: reference generation, the registration handler against `DemoStore`, rate limiting, the Zod contract and server-side prices, and Stripe signature verification. They need no env vars and no database.

Prisma (all read `prisma/schema.prisma` through `prisma.config.ts`):

```bash
npx prisma validate                  # schema check, no DB needed
npx prisma generate                  # regenerate @prisma/client after a schema change
npx prisma migrate deploy            # apply prisma/migrations/* (needs DIRECT_URL)
npx prisma migrate dev --name <name> # create a new migration in development (needs DIRECT_URL)
```

Migrations so far: `0001_init`, `0002_add_reference`. There is no seed script. With `DATABASE_URL` set, registration looks up the ticket in the database, so you must insert the `Event` row (`slug = 'sism-2026'`) and one `TicketType` row per ticket in `TICKETS` (`slug` = the TICKETS key, `status = 'OPEN'`) before the form works.

## Project structure

```
app/                     routes (App Router)
  page.tsx               home
  sism-2026/             SISM summit page, plus registered/ and registration-cancelled/
  sism-forum-access/     registration form, Forum Access $199
  sism-self-funded/      registration form, Self Funded $399
  sism-invitation-letter/ registration form, Invitation Letter $49
  fms-thailand/          FMS Thailand 2026 recap (past summit)
  videos/                all videos with category filters, ?v=<youtubeId> deep links
  about-us/, contact-us/
  privacy-policy/, refund-policy/, terms-conditions/   rendered from content/pages/*.md
  admin/                 static dashboard preview, sample data only
  pitch/                 internal pitch page for the 19 Oct meeting
  api/                   registrations, contact, webhooks/stripe, calendar/sism-2026.ics
  _components/           PolicyLayout (not a route)
  layout.tsx, globals.css, not-found.tsx
proxy.ts                 Basic Auth on /admin and /pitch (Next 16 name for middleware)
components/              shared UI: header, footer, countdown, globe video, video dialogs
  premium/               8 motion components, each with its own README
features/
  registration/          Zod contract + TICKETS prices (schema.ts), form UI, server handler
  payments/              Stripe adapter (raw fetch), Payoneer stub, money types
  contact/               contact form UI and server handler
  events/                SismVideos
  media/                 media.ts, the image slot manifest
lib/
  cms/                   CmsAdapter interface and StaticAdapter
  server/                repo (DemoStore), prisma-repo, email, rate-limit, turnstile, ics, reference, tests
  db.ts                  getRepo(): DemoStore or PrismaRepo
  md-render.ts           markdown renderer for policy pages
prisma/                  schema.prisma, migrations/
content/                 crawl of the live site: events.json, media.json, sitemap.json, pages/*.md, images/
public/
  media/                 optimised webp/png used by the pages
  renders/               Blender renders (glass globe, ribbons)
  pitch/                 before/after screenshots for /pitch
design/                  palette.md, tokens/, contrast.py, logo/, blender/
concepts/                design-direction prototypes, not part of the app
docs/                    decisions, API contract, schema, payments, infrastructure, reviews, Lighthouse reports, handoff, admin plan
```

## How content works

Today everything is files. `lib/cms/index.ts` exports one `cms` object, a `StaticAdapter` (`lib/cms/static-adapter.ts`) that reads at build time:

| Method | Reads | Used by |
|---|---|---|
| `getPage(slug)` | `content/pages/<slug>.md` (front matter via gray-matter, plus body) | policy pages (body), fms-thailand (meta) |
| `getSitemap()` | `content/sitemap.json` | header nav, footer, socials in `app/layout.tsx` |
| `getEvents()` | `content/events.json` | home, sism-2026, fms-thailand, the three form pages |
| `getMedia()` | `content/media.json` | video lists on home, fms-thailand, videos |

Pages cast the results to local types (`getEvents()` and `getMedia()` return `unknown`), so the JSON shape is the real contract. Images do not go through the adapter: pages import slots from `features/media/media.ts` (and some still hardcode `/media/...` paths).

Two things are not content and live in code: ticket prices and form type (`TICKETS` in `features/registration/schema.ts`, server side only, D23), and the registration handler's closed-ticket check, which reads `ticketTypes[].status` from `content/events.json` directly.

### Swapping to a database adapter

There is no `DatabaseAdapter` yet; the comment in `lib/cms/index.ts` marks the spot. To add one:

1. Write `lib/cms/database-adapter.ts` implementing `CmsAdapter` from `lib/cms/types.ts`. `getRepo()` returns the `Repo` interface, not a Prisma client, so build a `PrismaClient` the same way `lib/db.ts` does (pg `Pool` + `PrismaPg` adapter) and share it through `globalThis`.
2. Map the models: `getPage` from `Page` + `ContentBlock` (ordered by `order`), `getEvents` from `Event` + `TicketType`, `getMedia` from `Video` + `VideoCategory` + `MediaAsset`. `getSitemap` has no model; keep it on the file or add one.
3. Return exactly the shapes of `events.json` and `media.json`. The pages read fields the schema does not have yet (schedule, speakers, FAQs, `includes` per ticket and others; `docs/admin-panel.md` lists them), so those go in `ContentBlock.data` until the schema grows.
4. In `lib/cms/index.ts`, pick the adapter: `process.env.DATABASE_URL ? new DatabaseAdapter() : new StaticAdapter()`.
5. Pages are statically rendered today. Once content comes from the database, add `export const revalidate = 60` (or call `revalidatePath` from the admin save action) to each page that reads it.

## Cloudinary

Not switched on. Today every image is a file in `public/media/` and `features/media/media.ts` maps a slot key to that file:

```ts
'speaker.julie-victoire': { src: '/media/speakers/julie-victoire.webp', alt: '...', width: 400, height: 400 }
```

Exports are `SPEAKERS`, `ADVISORY`, `AMBASSADORS`, `GALLERY` (array), `LOGOS`, `PARTNERS` (array).

### Folder scheme

Upload every image to `thegyn/{page}/{slot}`:

- `page` is the route slug that owns the image: `home`, `sism-2026`, `fms-thailand`, `about-us`. Images used on more than one page (logos, partner logos, the FMS gallery, advisory board) go under `shared`.
- `slot` is the media.ts key with the dot turned into a slash, because Cloudinary reads whatever follows the last dot of a delivery URL as the file format. Array entries use the file name without extension.

| media.ts | Cloudinary public ID |
|---|---|
| `SPEAKERS['speaker.julie-victoire']` | `thegyn/sism-2026/speaker/julie-victoire` |
| `AMBASSADORS['ambassador.lim-pei-en']` (home and about-us) | `thegyn/shared/ambassador/lim-pei-en` |
| `ADVISORY['advisory.wenbo-li']` | `thegyn/shared/advisory/wenbo-li` |
| `GALLERY[0]` (`fmst-dsc01881-1.webp`) | `thegyn/shared/gallery/fmst-dsc01881-1` |
| `LOGOS['logo.unu-global-health']` | `thegyn/shared/logo/unu-global-health` |

`content/media.json` records the source page and a slot name (from the crawl, e.g. `who-we-are-image`) for every image on the live site. Its slot names don't match the media.ts keys, but it's the starting list for the first bulk upload.

### Switching it on

1. `npm install next-cloudinary` (one install, by whoever owns `package.json`).
2. Add `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` to `.env.example` and `.env.local`.
3. In `features/media/media.ts`, change each `src` to its public ID (or derive it from the key with the rule above) and keep `alt`, `width`, `height`.
4. Replace `next/image` with `CldImage` from `next-cloudinary` where the slots are rendered, and move the remaining hardcoded `/media/...` paths in `app/page.tsx`, `app/sism-2026/page.tsx`, `app/fms-thailand/page.tsx` and `app/videos/page.tsx` onto slots.
5. Add `res.cloudinary.com` to `images.remotePatterns` in `next.config.ts` and to `img-src` in the CSP there, or the images are blocked.

## How to add an event

### Today (files and code)

Example: a summit with slug `fmsx-2027`.

1. **`content/events.json`**: add an object to `events` with the same shape as `sism-2026` (`id`, `name`, `shortName`, `navLabel`, `dates`, `venue`, `city`, `country`, `seats`, `status`, `ticketTypes[]` with `id`, `name`, `price`, `includes`, `status`, plus `schedule`, `speakers`, `faqs` and the rest your page shows). `ticketTypes[].status` must be `"open"` or `"closed"`; the registration handler returns 409 for closed ids that are not in `TICKETS`.
2. **`features/registration/schema.ts`**: add each paid ticket to `TICKETS`, keyed by a slug that is unique across all events (the handler finds a ticket by key alone):
   ```ts
   "fmsx-forum-access": { eventId: "fmsx-2027", name: "Forum Access (confirmed seat)", amountCents: 19900, form: "attendee" },
   ```
   Then add a matching branch to the `registrationInput` discriminated union. `form: "attendee"` uses `attendeeSchema`, `form: "invitation"` uses `invitationSchema`. `DemoStore` seeds itself from `TICKETS`, so demo mode picks the ticket up with no other change.
3. **Pages**: copy `app/sism-2026/page.tsx` to `app/fmsx-2027/page.tsx` and change the `events.find(e => e.id === ...)` lookup. For each ticket, copy a form page such as `app/sism-forum-access/page.tsx` and pass the new `ticket` id to `<RegistrationForm>`.
4. **Images**: add files under `public/media/` and slots in `features/media/media.ts`.
5. **Navigation**: add the page to `nav` (and `pages`) in `content/sitemap.json`.
6. **Things still hardcoded to SISM** that a second open event needs changed: the reference prefix `"SISM"` in `features/registration/server/register.ts`, the success and cancel URLs (`/sism-2026/registered`, `/sism-2026/registration-cancelled`) in `app/api/registrations/route.ts`, the event name, dates and venue in the confirmation email (`lib/server/email.ts` and the webhook route), the `.ics` route `app/api/calendar/sism-2026.ics/`, and the countdown target in `components/Countdown.tsx`.
7. With a database: insert the `Event` row (`slug = 'fmsx-2027'`) and a `TicketType` row per ticket (`slug` = the TICKETS key, `priceCents`, `status = 'OPEN'`). The handler still charges `TICKETS[...].amountCents`, not `TicketType.priceCents`.
8. Run the checks:
   ```bash
   npm run typecheck
   node --experimental-strip-types --test features/payments/stripe.test.ts features/registration/schema.test.ts lib/server/tests.ts
   ```

### With the admin panel (planned)

Full plan in `docs/admin-panel.md`. The flow there:

1. An owner or editor creates the event in Admin > Events (status `DRAFT`): name, slug, dates, venue, seats.
2. Adds ticket types: price in cents, category, seats, the form it uses, `DRAFT` until ready.
3. Builds the event page from content blocks (hero, schedule, speakers, FAQ) and picks images from the media library.
4. Previews, then sets the event and its tickets to `OPEN`. The public page and the registration route read the database, so no deploy is needed.

For that to work the registration handler has to read price and form type from `TicketType` instead of `TICKETS`, and the hardcoded SISM items in step 6 above have to come from the `Event` row.

## Payments

Stripe Checkout Sessions, US account, test mode until launch (D17, D22). Research, fees, the refund-to-voucher mapping and open questions are in `docs/payments.md`.

The flow: the form posts to `POST /api/registrations`, the server creates the registration (`PENDING`) and a Checkout Session with the price from `TICKETS`, the browser goes to Stripe, and the webhook marks it `CONFIRMED` and sends the email. The webhook records the event in `WebhookEvent` only after processing (email included) succeeds, and returns 500 on a failure so Stripe retries; a delivery that was already recorded is a no-op.

Handled events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `charge.refunded`. `docs/payments.md` also lists `payment_intent.payment_failed` and `checkout.session.expired`, which are not handled yet.

### Local webhook testing

Install the Stripe CLI (https://docs.stripe.com/stripe-cli), then:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET` in `.env.local`, set `STRIPE_SECRET_KEY=sk_test_...`, and restart `npm run dev`. Register on `/sism-forum-access` and pay with `4242 4242 4242 4242`, any future expiry, any CVC. The `stripe listen` terminal shows the event and the server console shows the confirmation email (or Resend sends it).

`stripe trigger checkout.session.completed` also works for checking signatures, but its session id matches no registration, so the handler logs "session not found" and does nothing else.

Test cards: `4000 0000 0000 0002` declines, `4000 0025 0000 3155` asks for 3DS.

## Deploying to Vercel

1. Import the repo in Vercel (Pro plan, per `docs/infrastructure.md`). Framework preset Next.js, build command `npm run build` (the default), Node.js 22.x in Project Settings > General. The three API routes set `preferredRegion = "sin1"` so they run next to the Neon database in Singapore.
2. Set env vars for Production (and Preview with test keys and a Neon branch database): `DATABASE_URL`, `DIRECT_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_BASE_URL=https://thegyn.org`, `ADMIN_BASIC_AUTH` and `PITCH_BASIC_AUTH`. `NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changing them.
3. Run migrations against the production database from your machine (or a CI step) before the first deploy that uses it, then insert the `Event` and `TicketType` rows:
   ```bash
   npx prisma migrate deploy
   ```
4. Stripe webhook: Dashboard > Developers > Webhooks > Add endpoint, URL `https://thegyn.org/api/webhooks/stripe`, events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `charge.refunded`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`. Test mode and live mode have separate endpoints and secrets.
5. Upstash: add the Upstash Redis integration from the Vercel Marketplace, or create a database at console.upstash.com in Singapore (next to `sin1`) and paste the REST URL and token.
6. Turnstile: add a widget in Cloudflare with hostnames `thegyn.org`, `www.thegyn.org` and the `*.vercel.app` preview host you use, then set both keys. Without them production forms return 400.
7. Resend: verify `thegyn.org` (SPF/DKIM records at the DNS host) before `EMAIL_FROM` will send.
8. Point the domain at Vercel only after a test-mode registration has gone through end to end on the production URL.

The security headers and CSP are in `next.config.ts`. If you add a third-party script, image host or iframe, add it to the CSP there.

## concepts/ and design/blender/

`concepts/` holds the standalone HTML prototypes (A to H) used to pick a design direction (D8, D13). `concepts/index.html` links them. They are not part of the app, ESLint ignores them, and nothing in `app/` imports from them. G (`g-deep-field.html`) is the direction the app is built in.

`design/blender/` makes the 3D renders. `make.py` runs a Blender scene headless, writes RGBA frames to `_frames/<name>/`, then exports a transparent poster (webp), a VP9 webm with alpha, and an H.264 mp4 composited on `#0E1530` for Safari. Needs Python 3.12 with Pillow, and Blender at the path in the `BLENDER` constant (`D:/tools/blender-5.2.2-windows-x64/blender.exe`; change it for your machine).

```bash
cd design/blender
python make.py glass-globe --render     # render frames, then encode
python make.py glass-globe              # re-encode existing frames only
python make.py ribbons --render --size 1280 --webm-crf 34 --mp4-crf 26
```

Scenes: `wheel-bloom`, `wheel-assemble` (48 webp frames instead of a video), `ribbons`, `glass-globe`, `sticker-pile`. Output goes to `concepts/assets/r2/renders/`, not the app. To update the site, copy the new `<name>.webm`, `<name>.mp4` and `<name>-poster.webp` into `public/renders/`. The home page uses only `glass-globe` (`components/GlobeVideo.tsx`); `ribbons` sits in `public/renders/` unused.

## Testing and QA

Before pushing:

```bash
npm run typecheck
npx eslint .
node --experimental-strip-types --test features/payments/stripe.test.ts features/registration/schema.test.ts lib/server/tests.ts
npx prisma validate
npm run build
```

Manual checks that the unit tests don't cover:

- Registration in demo mode: `/sism-forum-access`, fill the form, reach `/sism-2026/registered?...&demo=1`. Reload the form halfway through to check progress is restored from `localStorage`.
- Closed scholarship: `POST /api/registrations` with `"ticket": "fully-funded"` returns 409.
- Stripe test mode with `stripe listen`, as above.
- Widths 360, 768, 1280 and 1440: no horizontal scroll, the H1 fits at 360 (`.d1` is sized for "FUTUREMINDS" at that width).
- Keyboard only: skip link, header dropdowns, carousels (arrow keys), video dialogs (Escape), form errors move focus to the first invalid field.
- `prefers-reduced-motion: reduce` in DevTools: no Lenis smooth scroll, globe shows the poster, carousels lose drag and 3D, page transitions off.
- Safari: the globe shows the poster only (no webm alpha support).
- Copy: no em dashes and none of the banned words from `docs/ai-tells.md` in anything we wrote.

Earlier review passes: `docs/redteam.md` (design), `docs/security-review.md` (security), `docs/benchmarks.md` (comparison sites).
