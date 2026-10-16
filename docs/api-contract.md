# API contract and file ownership (overnight build)

Four agents build in parallel. This file is the agreement between them. If you need something outside your area, write it under "Requests" at the bottom instead of editing another agent's files.

## Ownership

| Agent | Owns |
|---|---|
| Pages A (home, layout, motion) | `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/fms-thailand/`, `app/videos/`, `components/*` (shared), wiring `components/premium/*` into pages |
| Pages B (event + registration) | `app/sism-2026/`, `app/sism-forum-access/`, `app/sism-self-funded/`, `app/sism-invitation-letter/`, `features/registration/ui/`, `features/events/` |
| Pages C (everything else) | `app/about-us/`, `app/contact-us/`, `app/privacy-policy/`, `app/refund-policy/`, `app/terms-conditions/`, `app/not-found.tsx`, `app/pitch/`, `app/admin/`, `features/contact/ui/` |
| Backend | `app/api/`, `lib/db.ts`, `lib/server/`, `prisma/`, `prisma.config.ts`, `features/payments/`, `features/registration/server/`, `features/contact/server/` |

Shared, read-only for everyone: `features/registration/schema.ts` (the Zod contract and server-side prices), `features/media/media.ts`, `lib/cms/`, `content/`. Dependencies are already installed; nobody runs `npm install`. Page-specific styles go in CSS modules next to the page or Tailwind utilities using the tokens in `app/globals.css`; only Pages A edits `globals.css`.

## Endpoints

### `POST /api/registrations`
Request JSON: `RegistrationInput` from `features/registration/schema.ts` (`{ ticket, details, consent: true, turnstileToken? }`). The client never sends a price.

Responses:
- `200 { checkoutUrl: string, reference: string }`. With `STRIPE_SECRET_KEY` set, `checkoutUrl` is a Stripe Checkout URL. Without it (local dev, the pitch demo) it is `/sism-2026/registered?ref=<reference>&ticket=<ticket>&demo=1`.
- `400 { fieldErrors: Record<string, string[]> }` with paths like `details.email`.
- `409 { error }` if the ticket is closed or sold out.
- `429 { error }` rate limited (5 per 10 min per IP).
- `500 { error }` with a human sentence, never a stack trace.

### `POST /api/webhooks/stripe`
Raw body, `Stripe-Signature` header, verified with `features/payments/stripe.ts`. Handles `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `charge.refunded`. Idempotent on event id (`WebhookEvent` table). Always `200` after a valid signature, `400` on a bad one.

### `POST /api/contact`
Request: `{ name, email, topic: "general" | "partnership" | "group-booking" | "media", message (10–2000 chars), turnstileToken? }`. Responses `200 { ok: true }`, `400 { fieldErrors }`, `429`.

### `GET /api/calendar/sism-2026.ics`
Returns a `text/calendar` file for 19–22 Nov 2026, Teedo Hotel, Kuala Lumpur (Asia/Kuala_Lumpur).

## Pages that depend on the backend
- `/sism-2026/registered?ref=&ticket=&demo=` (Pages B): success state with the ticket name, what happens next, "Add to Google Calendar" (a calendar.google.com template link) and "Download .ics" (`/api/calendar/sism-2026.ics`). With `demo=1` it says clearly that no payment was taken.
- `/sism-2026/registration-cancelled` (Pages B): checkout abandoned, with a link back to the form (saved progress is still there).

## Requests
(agents append here)

## Running the app while building
A shared dev server runs at **http://localhost:3200** (started by the lead; hot reload picks up your edits). Use it for screenshots. Do **not** run `next build`, `next dev` or `next start` yourself: several agents share one `.next` folder, and parallel builds corrupt it. Check your work with `npx tsc --noEmit` and `npx eslint <your folders>`. The lead runs the production build.
