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

**D26. Tiny custom markdown renderer for policy pages, not a library.** gray-matter is installed and parses the front-matter; no remark/rehype or marked is installed. The three policy files use only headings, paragraphs, lists, bold, links and one table. A 100-line custom renderer in `lib/md-render.ts` avoids a new dependency. The `// shortcut:` comment names remark as the upgrade path if more complex markdown lands. Reversible.

**D27. PolicyLayout is a client component.** The sticky TOC uses IntersectionObserver to track the active heading as the user scrolls. That requires `useEffect`, making it a client component. The markdown body itself is rendered server-side and injected via `dangerouslySetInnerHTML` — only the TOC highlight logic runs client-side. Reversible.

**D28. Pitch screenshots captured from live thegyn.org and localhost:3000 at 1440x900.** Saved as PNG (not WebP) because Playwright's WebP support requires mime-type detection from the file extension and the installed Playwright version does not recognize .webp. Filed as `before.png` / `after.png` in `public/pitch/`. Reversible: rename and recapture in WebP format once confirmed.

**D29. Admin dashboard uses plain SVG (no chart library).** The brief requires no chart library; all charts are inline SVG with `<title>` for accessibility and `<details>/<table>` fallbacks. SVG viewBoxes are fixed-width with `width: 100%; height: auto` so they scale to any container. Reversible: swap SVG for a library component if the dashboard becomes interactive.

**D30. /pitch screenshots use http://localhost:3000 not 3200.** The lead confirmed the shared dev server runs on port 3000. The api-contract.md reference to port 3200 was corrected mid-build.

## 2026-10-16 (backend overnight build)

**D31. Prisma 7: datasource URLs moved to prisma.config.ts.** Prisma 7.10.1 removes `url` and `directUrl` from `schema.prisma`. `DIRECT_URL` (un-pooled) goes in `prisma.config.ts` for migrate; `DATABASE_URL` (pooled) is passed to `PrismaClient({ adapter })` at runtime. Initial migration SQL generated with `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`. Reversible: schema change only, no data loss.

**D32. DemoStore (in-memory) as the only active repository.** `@prisma/adapter-pg` is not installed; `PrismaClient` in Prisma 7 requires a driver adapter. The production path in `lib/db.ts` throws with clear instructions to install the adapter and implement `PrismaRepo`. All routes work via `DemoStore` (data lost on restart). Remove when deploying with a real database.

**D33. Rate limiter fails open on Upstash error.** If Upstash Redis is unreachable, the in-memory fallback is skipped in production mode, and the request is allowed through (logged). The alternative (fail closed) would block real users during an outage. Revisit if abuse is observed.

**D34. Passport numbers not stored.** The invitation-letter handler receives `passportNumber` from the validated input but explicitly excludes it from the `attendeeData` passed to the repository. It is discarded immediately after parsing. Consistent with Option 1 in docs/schema.md §PII. If visa-support workflows need retention, encrypt and store per Option 2 before launch.

**D35. `allowImportingTsExtensions: true` added to tsconfig.** Required for `.ts` extension imports in source files — needed because Turbopack doesn't remap `.js` → `.ts` in new files the way Webpack's TypeScript loader does, and because bare-Node tests (`--experimental-strip-types`) need explicit `.ts` extensions. Non-breaking: the option is only additive (requires `noEmit: true`, already set). Reversible: remove if all imports switch to extensionless.

**D36. `lib/server/tests.ts` excluded from tsconfig.** Follows the same pattern as `features/payments/stripe.test.ts` and `features/registration/schema.test.ts`. Test files use `.ts` extensions in imports for bare-Node compatibility; excluding them from tsconfig avoids TS5097 errors while keeping production code type-checked.

**D37. Webhook confirmation email uses real attendee data.** `getRegistrationDetails(registrationId)` added to the `Repo` interface (DemoStore + PrismaRepo). The `sendConfirmation` helper in the Stripe webhook route now calls it to get the real email, name, reference and ticket before sending. Previously a stub with placeholders; resolved in feat(db): prisma repo with pg adapter.

**D38. Sticky mobile "Book a seat" bar shows Forum Access $199, not Invitation Letter $49.** The bar is labelled "Book a seat" and an invitation letter does not grant summit access. The cheapest confirmed seat is Forum Access at $199. Invitation Letter link is available in the application-process CTA block below. Reversible if definition of "cheapest open tier" expands.

**D39. APU visit shows the APU logo, not a photo.** The crawl only has APU's logo (360x170), no campus photo. An earlier version used the SISM banner captioned as the APU campus, which mislabelled it; replaced by the logo from the media manifest (`logo.apu`). Swap in a real campus photo when GYN has one.

**D40. Hydration warning from motion components on sism-2026 page is not fixed.** DeckSlider and CoverflowVideos (from components/premium/) use motion.div with initial transforms that differ between SSR and client. React 18 logs a "tree hydrated" warning. The warning is benign (the app functions correctly), and the components are owned by Pages A. Noted here; Pages A can add suppressHydrationWarning or an isServer guard if needed.

**D41. Dev server port corrected to 3000.** The coordinator noted mid-build that the shared dev server is at localhost:3000, not 3200 as written in api-contract.md. All Playwright tests use 3000. api-contract.md was not edited (coordinator owns it per file ownership).

**D42. @electric-sql/pglite skipped.** Investigated whether pglite + Prisma adapter could give a real in-process Postgres for CI tests. pglite does not yet publish a Prisma 7 adapter; the @electric-sql/prisma-generator requires a Prisma 5 client shape and its types are incompatible with Prisma 7's new adapter contract. Skip time exceeded 20 min; not installed permanently. Revisit when electric-sql publishes prisma-7 adapter support.

**D43. New /videos page, linked from the footer.** The live site has no video page; the nine videos were scattered as bare iframes. /videos collects them with category filters and deep links (`?v=<youtubeId>`). It's an addition to the sitemap, not a change to existing URLs.

**D44. Home videos use their own dialog player** (`components/HomeVideosSection.tsx`) instead of wrapping VideoModal, so the coverflow carousel and the player share state without prop drilling.

## 2026-10-16 (infrastructure)

**D45. Production database is Neon Launch in Singapore, not Supabase.** Supersedes the Supabase assumption in D21, `.env.example` and the `lib/db.ts` comment. Neon Launch gives a 7-day point-in-time restore window for cents a month (Supabase charges $100/month for PITR plus a Small compute), branches for preview deployments, and costs about $19/month at 0.25 CU always on. Free tiers of both are out because this site takes payments: Supabase Free pauses after a week idle and has no backups, Neon Free suspends compute when its 100 CU-hours run out. Vercel functions move to `sin1` next to the database. Prisma Accelerate is not used (retires 1 Dec 2026). The code needs only env changes. Numbers, sources and upgrade triggers in docs/infrastructure.md. Reversible: switching to Supabase Pro is a `pg_dump`/`pg_restore` and two env vars.

**D46. On phones the hero's globe and delegate photo are hidden to meet the mobile performance target.** With them visible, Lighthouse mobile performance was 79 (home) and 78 (/sism-2026); with them hidden (`.hero-aside`), 91 and 90, and the H1 becomes the largest paint. The headline, dates, countdown and booking button still lead on phones, and real delegate photos appear further down the page. Reversible: if the team prefers the visual over the score, show a small, non-priority poster below the CTAs instead.

**D47. Commit messages rewritten to remove Claude attribution.** On 16 Oct, 23 commits made by build agents carried `Co-Authored-By: Claude …` despite the instruction (D6). The local history (never pushed) was rewritten with `git filter-branch --msg-filter` to strip those trailers; file contents are byte-identical before and after.
