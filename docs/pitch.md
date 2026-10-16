# thegyn.org, rebuilt: proposal for Global Youth Network

We've already rebuilt thegyn.org. It runs at {{DEMO_URL}} on your own content, with registration working end to end in demo mode and Stripe Checkout ready to switch on with test keys, so on Sunday you can click through a working site instead of judging a mock-up.

## What the current site is costing you

We crawled all 14 pages of thegyn.org on 15 Oct. Eight problems stood out, and most of them sit on the pages that take money.

1. **Three prices for Forum Access.** The SISM page shows $199. The Meta Pixel on that same page reports it to your ad account as $249 (and Self-Funded as $449, not $399). A third form that nothing links to, but your sitemap lists, sells Forum Access for $170 with no CAPTCHA. Anyone who finds it pays $29 less.
2. **Countdowns stuck at zero.** Applications closed on 11 Oct. The timers still read 00:00:00:00 with an Apply Now button next to them.
3. **Apply Now leads to closed offers.** On the SISM page that button jumps to the scholarship section, where both cards say CLOSED NOW. It doesn't point at the tiers still on sale.
4. **The brand yellow can't be read.** `#FEFF00` text on white scores 1.08:1. WCAG asks for 4.5:1. It isn't in your logo either.
5. **Two results dates.** The FAQ says 16 Oct. The thank-you page applicants see after submitting says 15 Oct.
6. **Dead links and missing images.** Five benefit items on the SISM page link to a broken address. All four contact-page background images return 404, and so do two speaker photos on the FMS Thailand page.
7. **Videos with no home.** Nine videos sit in plain YouTube frames across several pages. There's no way to send someone one clip.
8. **Typos on the pages that take money.** "PARTIALLY SCHOLARSHIP", "Patronas Twin Tower", "Al" where it means AI, and a gender field that lists "Homosexual" and "Hetrosexual" as genders. That last one is what I'd fix first.

Most of these come from one habit: the price, the deadline and the form each live in a different place, so changing one doesn't change the others. In the new build a ticket's price is set once, on the server, and a form can't send a different one.

## What we did before pitching

- Crawled the site into structured content (every heading, price, form field, image and video) and built the new site from it, nothing retyped.
- Studied nine event and non-profit sites, starting with your reference, echochange.org.
- Rebuilt the palette from your logo. The navy `#202F60` is 54% of its coloured pixels, and the four hands give crimson, flame, ember and leaf. A script checks every text colour against WCAG 2.2.
- Tested four design directions. They looked too much like every AI-generated site (we checked them against a 15-source list of tells), and you asked for something closer to echochange.org with stronger colour and real 3D. So we built four more, in your logo colours plus the UN SDG colours, with renders made in Blender.
- Built the whole site in direction G, Deep Field, so you can judge real pages. Colour and type sit in one set of tokens, so picking E, F or H means a re-skin, not a rebuild.

## The new site, for the three people it has to convince

**A first-time applicant.** A final-year student in Lagos or Dhaka on a mid-range Android phone, wondering if this is legit. She gets:

- Registration in three steps: her details, a review screen, then payment on Stripe. Progress saves in the browser, so a reload doesn't wipe the form. Her passport number is never part of that save.
- Nothing that says open when it's closed. The countdown runs to the summit itself (19 Nov, 09:00 Kuala Lumpur time), closed scholarship tiers say closed, and the server turns away a closed tier even if someone builds the request by hand.
- A light page. Phones get a still image of the globe and never download the video. Every page was checked from 360px to 1440px wide with no sideways scrolling.

**A returning delegate.** He went to FutureMinds Summit Bangkok and now shares GYN links as an ambassador. He gets:

- A videos page with all nine videos, category filters and a link per video, so one clip can be sent and opens straight in the player.
- An FMS Thailand recap with gallery and schedule, and the SISM 2026 page with speakers, programme and open tiers.
- After paying, "add to calendar" for Google Calendar or any calendar app.

**A partner.** A programme lead at a university or NGO deciding whether to work with GYN. She gets:

- The UNU Global Health co-host, the advisory board and the ambassadors, with real photos.
- A contact form that opens with the topic already set (partnership, group booking or media) when she comes from a partner link.
- On desktop, a glass globe rendered in Blender, with 17 planets in the SDG colours orbiting it.

URLs match the live site, so old links and your search rankings carry over.

## See it

- {{DEMO_URL}}: the new site. Registration runs in demo mode: you can finish a form and no money moves.
- {{DEMO_URL}}/pitch: the live site and the new one side by side.
- https://claude.ai/artifact/SeqsBcoRXk9GvDsc5YruXb: all eight design directions.

Start with {{DEMO_URL}}/sism-forum-access and {{DEMO_URL}}/videos.

## How it's built

**Pages.** Next.js on Vercel. Nearly every public page is built ahead of time and served from Vercel's global network, from the point nearest the visitor. Only registration, the contact form and two small pages run server code, so if a SISM post goes viral, almost all of that traffic hits ready-made pages.

**Database.** Postgres on Neon in Singapore, with the server code pinned there too. That's the closest region to Kuala Lumpur and to most of your delegates. Neon can restore the database to any point in the last 7 days, and we'll keep a monthly encrypted copy elsewhere for the 3 years your records need.

**Payments.** Stripe Checkout. Card details are typed on Stripe's page and never touch our server (the lightest PCI level, SAQ A). When Stripe reports a payment twice, the second report is ignored, so nobody gets confirmed or emailed twice.

**Security.** Standard security headers on every page (content security policy, forced HTTPS, no embedding in other sites). A Cloudflare Turnstile bot check on registration. Rate limits: 20 registrations per network and 3 per email address in 10 minutes, 5 contact messages per network.

**Personal data.** Passport and NIC numbers are used to draft the invitation letter and then dropped. They aren't stored in the database, the browser save or the logs. The retention plan anonymises contact details after 3 years. Your privacy policy says passport information is collected; it should say "processed, not stored".

## Payments: Stripe, and why not Payoneer

We recommend Stripe Checkout on a US account, with Adaptive Pricing and UPI switched on from day one. Both are settings, not code. What a delegate sees:

| Buyer in | At checkout |
|---|---|
| India | Price in rupees. UPI, card, Apple Pay or Google Pay |
| Pakistan, Bangladesh, Nepal, Kenya, Malaysia, Indonesia, Philippines | Price in their own currency. Card, Apple Pay, Google Pay or Link |
| Nigeria, Ghana | Price in USD. Card, Apple Pay, Google Pay or Link |

GYN keeps its prices in USD and pays nothing for Adaptive Pricing; the buyer's 2 to 4% conversion cost is in the rate they see. An international card costs 4.4% + $0.30, so GYN receives $189.94 from a $199 Forum Access seat and $17.39 from the $18.50 scholarship fee.

**Why not Payoneer.** Its own terms rule it out. Section 6.2: "it is strictly forbidden to get paid using this service for the sale of goods and/or services to consumers." Delegates are consumers. Payoneer's checkout product says on its own page that it is "powered by Stripe", is offered only to US and Hong Kong entities, and needs a Hong Kong entity and over $20,000 a month in sales. Stripe gives you the same checkout without those conditions. Payoneer still suits paying speakers abroad.

**What Stripe can't do.** On a US account it has no local payment method for Pakistan, Bangladesh, Nepal, Nigeria, Ghana or Kenya, only cards and wallets. Whether local prices cut card declines is unknown. So we watch failures by country, and if more than 10% of payments from one country fail, we add a second provider (Flutterwave for Africa, once it confirms a US organisation can sign up). PayPal doesn't help: it doesn't operate in Pakistan or Bangladesh.

The crypto QR on the scholarship form should go: payments can't be reversed and someone checks a wallet by hand. If you need crypto later, Stripe takes stablecoins at 1.5%.

## Admin panel roadmap

Today `/admin` is a preview with sample numbers. The real panel lets your team run a summit without us. Staff sign in by email link or Google, invite only, with a second factor for owner and finance accounts. Every change is logged with who made it. Roles are owner, editor, scholarship reviewer and finance. Reviewers score applications without seeing email, phone or payment details.

| Phase | What your team can do after it | Days |
|---|---|---|
| 0 | Sign in, roles, change log, admin layout | 4 |
| 1 | Create events and ticket types, change prices and seats | 4 |
| 2 | See and filter registrations, cancel, export to CSV | 3 |
| 3 | Refunds by the policy tiers, vouchers, discount codes | 4 |
| 4 | Scholarship review: assign reviewers, score on a rubric, rank, decide in bulk | 4 |
| 4a | Public scholarship form with the $18.50 fee, if the next round needs it | 3 |
| 5 | Media library uploads, videos and categories | 3 |
| 6 | Edit pages and content blocks, with drafts | 5 |
| 7 | Build new forms without code | 5 |
| 8 | Results emails through a queue, email log, change-log viewer, two-factor codes, security review | 4 |
| | **Total** | **39** |

That's one developer, in working days, with tests for the money and permission parts. Add about 20% for review rounds and content entry: eight to nine weeks of calendar time. Phases 0 to 3 (15 days) cover what a paid summit needs. Phase 4 has to land before your next scholarship results day.

## Running costs

Monthly, USD. "10×" is a regional event's worth of traffic.

| Item | Launch | 10× |
|---|---|---|
| Vercel Pro, 1 seat (server time and image resizing fit in its $20 credit) | 20 | 20 |
| Vercel CDN tier | 20 | 100 |
| Neon database, Singapore | 19.35 | 38.69 |
| Neon storage and 7-day restore | under 1 | under 1 |
| Resend (email) | 20 | 20 |
| Upstash, Cloudinary, Cloudflare Turnstile (free tiers) | 0 | 0 |
| **Total** | **about $80** | **about $180** |

Prices come from each vendor's page, fetched 16 Oct 2026. The launch column assumes a whole summit cycle in one month: about 2,100 registration attempts and 63,000 page views. Stripe's per-payment fees are on top. Vercel's free plan is out because its terms bar sites that take payments.

## Timeline from signature to launch

Assumptions: one developer who knows this stack, working days, accounts arriving in the first week, and a direction choice that changes colour and type but not page structure.

| Step | What happens | Time |
|---|---|---|
| 1 | Direction sign-off, refund decision, accounts created | [to confirm] |
| 2 | Re-skin if needed, finish our 16 Oct QA fixes, connect the live services | [to confirm] |
| 3 | Test-mode registration end to end on the production address, load test, backup restore drill, then point thegyn.org at the new site | [to confirm] |
| 4 | Admin phases 0 to 3 | 15 days |
| 5 | Admin phase 4, plus 4a if needed | 4 (+3) days |
| 6 | Admin phases 5 to 8 | 17 days |

SISM 2026 runs 19 to 22 Nov. We should agree together whether the domain switches before or after the summit.

## Quality numbers

Lighthouse, production build:

| Page | Mobile | Desktop |
|---|---|---|
| Home | Performance 88, accessibility 97, best practices 100, SEO 100 | Performance 100, accessibility 97, best practices 100, SEO 100 |
| SISM 2026 | Performance 89, accessibility 97, best practices 100, SEO 100 | Performance 100, accessibility 97, best practices 100, SEO 100 |

Mobile performance moves between 87 and 92 from run to run. Lighthouse's mobile score simulates a mid-range phone on slow 4G. In a real throttled browser the headline paints in about 1.1 seconds; the rest of the gap is the simulation charging the headline for its font download. On phones we hide the hero's globe and photo to keep that number up; the photos appear further down the page.

**Security.** A review of our build on 16 Oct found 16 issues: 2 critical, 5 high, 5 medium, 4 low. We fixed 11 of the 12 critical, high and medium ones the same day. The last (one rate limit shared across all servers) closes when the Upstash account exists. The low ones are fixed or accepted with a written reason. 41 automated tests cover registration, server-side prices, rate limiting and Stripe's payment reports.

**Accessibility.** Every text colour pair is checked against WCAG 2.2 AA by script. On 16 Oct an automated axe-core scan of all twelve page types, at phone and desktop width, found no serious or critical issues. Keyboard users can reach and operate the menu, carousels, video player and forms, focus is always visible, and motion stops for anyone who asks their device to reduce it.

## What we need from you to start

1. A direction. Confirm G, or pick E, F or H from https://claude.ai/artifact/SeqsBcoRXk9GvDsc5YruXb.
2. Cash refunds or vouchers. Your refund policy promises GYN Credit Vouchers, not cash. Tell us if that's what you want, because cash goes back through Stripe and a voucher doesn't. Stripe keeps its processing fee on every cash refund.
3. Accounts. A US Stripe account, plus Vercel, Neon, Resend, Cloudflare Turnstile, Upstash and Cloudinary (or permission to open them in GYN's name). DNS access for thegyn.org, so email goes out from your domain.
4. Passport numbers. If your visa-support work needs document numbers kept after the letter is drafted, tell us now, and we'll add encrypted storage before launch.
5. A short tax opinion on selling seats for the Malaysian event, before the first live sale.

Azam, AZEKTRA
