# Decisions log

Newest at the bottom. Each entry: what, why, reversible?

## 2026-10-15

**D1. Design directions before any build.** Asked for explicitly: we show the team several design directions and pick one before Phase 2. Phase 2 (Next.js build) is gated on that choice. Reversible.

**D2. Palette comes from the logo, not the current site.** Logo is navy `#202F60` + crimson/flame/ember/leaf hands. The site's `#FEFF00` yellow isn't in the logo and fails contrast at 1.08:1. See `design/palette.md`. Reversible.

**D3. Warm-grey neutrals.** Paper-toned, not slate, so the site doesn't read as generic SaaS. Reversible.

**D4. Agent substitutions.** No `research-analyst` agent in the pack, so `design-revamp-specialist` does benchmark research. The crawl uses a `general-purpose` agent with Firecrawl (no doc-extraction pack installed).

**D5. Skill substitutions.** `frontend-design` isn't installed; using `design-taste-frontend` (taste-skill), `impeccable` and `emil-design-eng` instead. `theme-factory` is present only as a synced copy; palette done by hand from pixel counts plus contrast script. `deep-research` is used via the research agent. Playwright MCP failed to connect this session; QA screenshots and overflow/console checks use the locally installed Python Playwright instead.

**D6. Attribution.** Per Azam's instruction, no `Co-Authored-By: Claude`, `Claude-Session:` or "Generated with Claude Code" on any commit or PR.

**D7. Deadline reality check.** SISM 2026 applications closed 11 Oct 2026, results on 16 Oct. Event is 19–22 Nov. The scholarship tiers say "CLOSED NOW"; Forum Access / Self-Funded / Invitation Letter still show "Register now". Prototypes reflect that state rather than pretending applications are open.

**D8. Four design directions built as standalone HTML concepts** (`concepts/`), published as one private claude.ai artifact with a team vote: https://claude.ai/artifact/SeqsBcoRXk9GvDsc5YruXb. A Earned Authority, B Amplified Youth, C Summit Stage, D Open Atlas. They're throwaway prototypes for picking a direction; none of their code is meant to be carried into the Next.js app as-is.

**D9. Direction C type swap.** The research proposed Space Grotesk + Inter; replaced with Bricolage Grotesque + Geist + Geist Mono because the original pairing is the default "AI look" the taste skills ban.

**D10. Countdown target is the summit start (19 Nov 2026, 09:00 MYT), not the expired application deadline.** The live site's timers are stuck at zero.

**D11. Facts corrected during QA.** Ambassadors cover 11 countries, not 12 (USA appears twice). Advisors and ambassadors together cover 17 countries. Shell expansion had stripped `$1`/`$3` from C's prices; fixed and re-checked in all four.

**D12. three.js 0.160.0 via cdnjs UMD build in concept C.** It prints a deprecation warning (UMD builds are deprecated from r150). Fine for a throwaway concept; the real build uses React Three Fiber per the stack.

## 2026-10-16 (overnight, Azam asleep)

**D13. Pages are built in round-2 direction G, Deep Field, before the team vote.** Azam asked for all pages to be implemented overnight and no votes were in yet. G is the closest to the client's own reference (echochange.org: saturated blue, bright CTA), the most credible next to a UN co-host, passed QA most cleanly, and has the strongest render (glass globe). All colour/type lives in tokens and section components so switching to E, F or H is a re-skin, not a rebuild. Reversible.

**D14. URLs match the live site** (`/sism-2026`, `/fms-thailand`, `/about-us`, `/contact-us`, policy pages, `/sism-forum-access` etc.) so existing links and search rankings survive the switch.

**D15. No external accounts were created overnight.** No `.env.local` exists (no Cloudinary, Stripe, Resend, database or Vercel credentials) and there is no Vercel or GitHub CLI on this machine. Everything is built to run locally with stubs and test-mode code paths; deploy and real keys need Azam in the morning.

**D16. Passport / NIC numbers not stored in the database.** The live site collects document numbers on the invitation-letter form; the new schema does not persist them. The letter is generated immediately and the number discarded (Option 1 in docs/schema.md §PII). If visa-support workflows require retention, switch to encrypted storage (Option 2) before launch — not a silent schema change.

**D17. Stripe Checkout Sessions chosen over Payment Element for launch.** SAQ A PCI scope, no JS SDK dependency, auto-surfaces Google Pay / Apple Pay / UPI for international delegates. Revisit if brand team needs fully embedded UX.

**D18. Payoneer not pursued.** It is a B2B payout platform, not a consumer checkout; merchant approval is manual and slow; no self-serve test mode. Fallback for South Asia / Africa is Stripe Payment Element local methods (UPI, bank transfer) triggered by conversion data, not a second gateway up front.

**D19. Crypto QR removed from launch scope.** Risk assessment in docs/payments.md: irreversible transactions, no webhook integration, AML exposure for a US org, price volatility, reputational mismatch with UN co-host. If crypto is required post-launch, use Coinbase Commerce or equivalent managed processor with auto-conversion and webhooks.

**D20. Stripe adapter uses raw fetch, not the stripe npm SDK.** The frontend agent is scaffolding the app; no installs were made. The shortcut is documented in features/payments/stripe.ts with a `// shortcut:` comment. Replace with the official SDK when package.json is unfrozen.

**D21. Prisma 6.19.3 (latest stable) used for schema validation.** Schema validated clean. `directUrl` requires a separate env var from `DATABASE_URL` to support Supabase's PgBouncer pooler alongside direct migration connections.

**D22. Payments research re-checked against live sources; launch payment setup changed.** Supersedes the "auto-surfaces UPI" part of D17 and the fallback in D18. A US Stripe account can offer UPI, and Checkout's Adaptive Pricing shows INR (and PKR, BDT, NPR, KES, MYR, IDR, PHP) prices while GYN keeps USD prices, so both are switched on in the Dashboard at launch. Stripe has no local methods for Pakistan, Bangladesh, Nepal, Nigeria, Ghana, Kenya, Malaysia, Indonesia or the Philippines on a US account, and its PayPal option is not offered to US businesses, so the old "Payment Element local methods" Phase 2 is dropped; the next step after high card failures is a second provider (Flutterwave for Africa, pending US eligibility). Payoneer stays out: its payment requests are banned for consumer sales by its terms, and Payoneer Checkout is Stripe-powered with Hong Kong entity and $20,000/month conditions. If crypto is ever needed, use Stripe stablecoin payments instead of a separate processor (amends D19). Sources and fetch dates in docs/payments.md.

**D23. Gender field fixed in the new forms.** The live forms list "Homosexual" and "Hetrosexual" as genders. The new forms use Female, Male, Another gender, Prefer not to say. All other field labels and the "How did you hear" options are kept from the live forms. Registration contract is `features/registration/schema.ts`; prices are server-side only and never taken from the client.

**D24. No dark theme.** G's colour-blocked design (blue-deep / yellow / white) is built for light mode only. A dark theme would require full palette redesign (dark colours invert the meaning of the blue blocks) and there is no brief requirement for it. Skipped. Revisit only if Azam explicitly requests a dark variant.

**D25. Prisma pinned to 7.10.1 (stable), not the npm "latest" tag.** On 16 Oct the `prisma` package's "latest" tag points at 8.0.0-rc.23, a release candidate, while `@prisma/client` latest is 7.10.1. Both are pinned to 7.10.1 so CLI and client match. Also installed: react-hook-form 7.90.0, @hookform/resolvers 5.9.1, lenis 1.3.27. All installs are done centrally so parallel agents never edit package.json at the same time.
