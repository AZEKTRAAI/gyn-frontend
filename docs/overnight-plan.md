# Overnight plan, 16 Oct

Built while Azam sleeps. Each line is ticked when it's done and checked.

## Tracks
- [x] Round 2 concepts: finish H, render sticker-pile, thumbnails, republish the comparison page (published as version 2 of https://claude.ai/artifact/SeqsBcoRXk9GvDsc5YruXb)
- [x] Schema: Prisma schema + `docs/schema.md` with ER diagram
- [x] Payments: Stripe and Payoneer research and design in `docs/payments.md`, provider interface in code (fact-checked against live sources; Payoneer ruled out by its own terms)
- [x] App scaffold: Next.js + TypeScript strict + Tailwind v4, direction G tokens, layout, nav, footer
- [x] Motion: signature sliders, carousels and transitions in `components/premium/` (summit wipe, swipe deck, scroll gallery, coverflow videos, ticket rail, headline reveal, page curtain, magnetic CTA)
- [~] Pages (3 agents in parallel, plus backend): home, SISM 2026, the 3 registration pages, FMS Thailand, about, contact, videos, 3 policy pages, /pitch, /admin preview
- [~] Registration (shared Zod contract done and tested; form UI and API in progress): multi-step form, Zod, save-and-resume, route handler, Stripe checkout (test mode, stubbed without keys)
- [~] Red team: review after each milestone, findings in `docs/redteam.md`, every high-severity finding fixed or explained
  - Pass 1 (round 2 concepts): 44 findings, 6 blocker / 12 high. Fixes in progress (E+G, F+H agents); G fixes also fed into the app build
- [ ] QA: Playwright screenshots at 375/768/1024/1440, console errors, overflow, accessibility, Lighthouse

## Needs Azam in the morning
- Pick a direction (or confirm G)
- Cloudinary, Stripe, Resend, database and Vercel credentials
- Payoneer: ruled out (its terms ban consumer sales; see docs/payments.md). Confirm Stripe Checkout + Adaptive Pricing + UPI
- Refunds: the refund policy says vouchers, but the payments doc assumes cash refunds through Stripe. Which is meant?
