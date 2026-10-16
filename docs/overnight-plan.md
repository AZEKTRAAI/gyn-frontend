# Overnight plan, 16 Oct

**Status at hand-over:** everything below is done except deployment, which needs Azam's accounts. Proposal page: https://claude.ai/artifact/QSzTMuR2jFuzxDxroXrQUZ (private). Design directions: https://claude.ai/artifact/SeqsBcoRXk9GvDsc5YruXb.

Built while Azam sleeps. Each line is ticked when it's done and checked.

## Tracks
- [x] Round 2 concepts: finish H, render sticker-pile, thumbnails, republish the comparison page (published as version 2 of https://claude.ai/artifact/SeqsBcoRXk9GvDsc5YruXb)
- [x] Schema: Prisma schema + `docs/schema.md` with ER diagram
- [x] Payments: Stripe and Payoneer research and design in `docs/payments.md`, provider interface in code (fact-checked against live sources; Payoneer ruled out by its own terms)
- [x] App scaffold: Next.js + TypeScript strict + Tailwind v4, direction G tokens, layout, nav, footer
- [x] Motion: signature sliders, carousels and transitions in `components/premium/` (summit wipe, swipe deck, scroll gallery, coverflow videos, ticket rail, headline reveal, page curtain, magnetic CTA)
- [x] Pages (all 17 routes build; checked at 360/390/1440 for clipping, console errors and the globe video): home, SISM 2026, the 3 registration pages, FMS Thailand, about, contact, videos, 3 policy pages, /pitch, /admin preview
- [x] Registration (forum-access flow tested end to end in demo mode; 35 backend/contract tests pass; real Postgres repo written, not yet run against a live DB): multi-step form, Zod, save-and-resume, route handler, Stripe checkout (test mode, stubbed without keys)
- [x] Red team: review after each milestone, findings in `docs/redteam.md`, every high-severity finding fixed or explained
  - Pass 2 (the app): 30 findings, 3 blocker / 11 high. Fixed by two fix agents split by files
  - Pass 3 (final, production build): 3 new blockers, 3 highs, all fixed and re-verified with the red team's own demo scripts at 1440, 390 and 1920–2560
  - Pass 1 (round 2 concepts): 44 findings, 6 blocker / 12 high. All blockers and highs fixed in E-H and checked for clipping at 390px; republished as version 3. Rejected: RT-028 (two-click YouTube, host limit), RT-032 (render content)
- [x] QA: full-route sweep clean at 360/390/1440; Lighthouse now ≥90 in all four categories on / and /sism-2026, mobile and desktop (see docs/lighthouse/)
- [x] Security review: 16 findings, all critical/high/medium fixed with tests; headers, admin auth and IP handling verified with curl
- [x] Infrastructure plan: Neon (Singapore) + Vercel Pro, ~$80/month at launch, ~$180 at 10x (docs/infrastructure.md)

## Needs Azam in the morning
- Pick a direction (or confirm G)
- Cloudinary, Stripe, Resend, database and Vercel credentials
- **Turnstile keys before any deployed demo:** a production build refuses registrations without `TURNSTILE_SECRET_KEY` (by design). For a demo, use Cloudflare's always-pass test keys (site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`), and set `NEXT_PUBLIC_BASE_URL` to the deploy URL
- Payoneer: ruled out (its terms ban consumer sales; see docs/payments.md). Confirm Stripe Checkout + Adaptive Pricing + UPI
- Refunds: the refund policy says vouchers, but the payments doc assumes cash refunds through Stripe. Which is meant?
