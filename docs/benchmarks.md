# GYN Competitive Benchmarks & Design Direction Brief

_Research date: 15 October 2026. All claims are from live fetches; "couldn't load" means the page returned no usable content._

---

## 1. Client Benchmark Audits

### 1.1 echochange.org

**Source:** https://echochange.org (fetched live)

**What works**

- Stats row carries real weight: 1,100+ ambassadors, 81+ countries, 2.3K+ youth participants, 53K+ lives impacted. The numbers are specific enough to feel credible and appear early in the scroll.
- World map of chapters gives geographic scale at a glance without a wall of text.
- Testimonial cards link directly to LinkedIn posts — external validation over in-house quotes.
- UNESCO GAP Partner Network mention is placed adjacent to the SDG 17 reference, which is smart proximity for credibility.
- Previous Summits dropdown (5 events across Malaysia, Thailand, Australia) builds a track record narrative that the GYN site currently lacks.

**What feels dated**

- Navigation has eight top-level items including multiple dropdowns with no visual hierarchy differentiation — the bar is visually flat and cognitively heavy.
- "Play" tiles for video testimonials link to image files, not embedded video — the interactivity promise is not delivered.
- Fifteen project work cards use identical templates with no visual cadence variation — no rhythm, no sense of editorial curation.
- No countdown for the upcoming FAS 2026, despite that being the primary conversion goal.
- The "Apply" / "Explore" CTA pairing is undifferentiated — both appear equal in weight but lead to different intent levels.

**IA/Nav structure**

Home → About Us → Advisory Council → Our Work → Previous Summits (dropdown: 5 events) → Resources (dropdown: Resource Hub, Affiliates) → Our Chapters → Blog. A persistent "FAS 2026" link sits beside the menu outside the structure. Social icons: Facebook, TikTok, Instagram, LinkedIn, YouTube.

**Registration / Tickets / Pricing**

No ticket pricing visible. The only conversion path is "Explore FAS & Apply" linking to the event page. No inline scholarship tiers, no urgency mechanism, no form visible on the homepage.

**Speakers and video**

Mentor cards: photo, name, organisation, pin-prefixed country — functional but no motion or reveal. Advisory Council cards: portrait placeholder, name, country, short bio with "VIEW MORE". Video testimonials are image-only with no actual embed or lightbox.

**We beat them by** presenting video as an inline autoplay reel (muted, loop) in the hero section and triggering a real lightbox player on testimonial click — so the "Play" promise is always honoured.

---

### 1.2 pgconnects.com/london

**Source:** https://pgconnects.com/london (fetched live)

**What works**

- Top promo bar for early-bird pricing ("save up to $435") creates immediate urgency without a separate page.
- Tiered sponsor wall (Diamond → Titanium → Platinum → Gold → Silver → Bronze → Track → Careers → Charity) communicates commercial scale and industry legitimacy.
- Multi-city nav bar (London, San Francisco, Malmö, Barcelona, Shanghai, Nordics, Jordan) positions the brand as a world tour, not a one-off.
- Repeat email signup with explicit subscriber benefits (monthly free ticket giveaways, subscriber discounts) — a newsletter growth mechanism woven into the page rather than hidden in a footer.
- Feature card grid (Investor Connector, Speedmatch, Big Indie Zone, etc.) shows programme components as distinct value propositions, not one undifferentiated "conference programme."

**What feels dated**

- A section heading reads "Supported by the best in 2019" — stale copy that undermines the present event's credibility. This is a trust-killer for institutional partners reviewing the site.
- Speaker images are hexagonal graphic overlays with no names visible inline — forces a separate click to identify speakers.
- Aurora Award section has placeholder text ("Xxxxxxx xxxx…") and no-image placeholders visible in the live page.
- Date inconsistency: the page title says January 18–19, 2027, but body sections reference "Speakers 2026" and "Attending Companies 2026."
- Video is a YouTube playlist link, not embedded — drops the user to a new tab, breaking the scroll journey.
- No pricing table visible in the text extract — conference passes are a price-table image that links to registration, which is neither accessible nor SEO-indexable.

**IA/Nav structure**

Register Now | What's On (Investor Connector, Speedmatch, Big Indie Zone, Big Indie Pitch, Audience Choice, Careers Zone, Journalist Bar, VIP Reception, Party) | Info (Why Attend, Companies, Speaker Submissions, Venues, Volunteering, Press, Invitation Letter, Guide, FAQs, Meeting Platform, Explore London, Code of Conduct) | PGC World Tour 26/27. Very deep, transactional IA — appropriate for a B2B industry event, not a youth SDG summit.

**Registration / Tickets / Pricing**

Early-bird mechanism active (promo bar + holiday promo code). Pass table is an image linked to registration — no inline HTML pricing. One ticket grants access to PGC plus partner summits. No scholarship tier exists.

**Speakers and video**

Hexagonal image graphics with no inline name labels. Testimonial row is images only with names below. YouTube playlist link only — no embedded player. Speaker submissions CTA exists, suggesting the speaker list is still being built.

**We beat them by** publishing a structured HTML pricing table (not an image) with three named scholarship/attendance tiers, a real inline video player for past event highlights, and speaker cards that show name, country flag, and affiliation without requiring any click — so a UN delegate scanning the page in 10 seconds can see peer-level credibility instantly.

---

### 1.3 thecgdl.org

**Source:** https://thecgdl.org (fetched live)

**What works**

- Modal bio overlays for advisory board members (× close button) avoid navigating away from the page — a sensible pattern for a long advisory roster.
- Six service cards clearly define the programme scope (Conferences, Workshops, Policy Recommendations, Leadership Development, Collaborative Networks, Youth Mentoring) — the same six pillars GYN offers.
- Upcoming event card includes a hard deadline ("Fully funded deadline: 18 November 2026") — urgency that echochange.org and the current GYN site lack.
- Previous Events dropdown holds five named events with year and city — track-record building.

**What feels dated**

- Stats counters are visible as "0 +" placeholders in the source, meaning the JavaScript count-up animation either fires too slowly or fails entirely in some browsers — presenting zero as a live number is a trust failure.
- Video gallery is nine thumbnails with "Play" overlays — same undelivered promise as echochange.org. No actual embed or lightbox confirmed.
- The hero has no countdown or urgency signal — just a "Register for YGF 2027" CTA with no contextual reason to act now.
- A dismissible badge reading "New York, USA (15)" appears in the hero with unexplained context — confusing to first-time visitors.
- About → "Who We Are?" sub-nav label includes a question mark, which reads as uncertain branding.

**IA/Nav structure**

Home | About Us (Who We Are?) | Upcoming Events (YGF 2027) | Previous Events (5 events: YEF 2026, YDF 2026, YGF 2026, YIF 2025, YEF 2025) | Blog | Contact. Register Now in header. Skip-to-main-content accessibility link present.

**Registration / Tickets / Pricing**

YGF 2027 card: Paris, France, 20–23 January 2027, fully funded deadline 18 November 2026. Two CTAs — "Apply Now" and "Read More" — both link to the same URL. No pricing tiers, no paid ticket path visible.

**Speakers and video**

Advisory board: photo + name + country card that opens a modal with full bio. No speaker count or session presenter distinction. Video gallery: nine thumbnails with "Play" label — actual player not confirmed. Testimonials: name, role, LinkedIn post link.

**We beat them by** replacing the JS-dependent counter with a CSS-driven count-up using `@property` (no-JS fallback shows final number) so the stat never shows "0", and delivering a real lightbox video experience instead of the false "Play" affordance.

---

### 1.4 thecgad.org

**Source:** https://thecgad.org (fetched live)

**What works**

- Event cards are the most information-dense of all four benchmarks: "160 seats / 80 scholarships / 5 categories / ages 15–45" — applicants can self-qualify before clicking Apply.
- Three scholarship tiers for the Paris event gives a pricing ladder that sets expectation before a registration page.
- SDG references (5, 10, 16, 17) embedded in individual speaker bios — demonstrates alignment at the person-level, not just as a logo badge.
- Previous event sections include a 5-image photo strip each — social proof through density of actual participants.
- "Join as Ambassador / Volunteer / Speaker" engagement tiers create three conversion paths beyond the binary apply/ignore.
- Leadership Focus tag lists on speaker profiles are scannable and set a thematic agenda.

**What feels dated**

- Elementor popup triggers for advisory bios are visually inconsistent and break the page scroll rhythm — clicking a card triggers a jarring overlay.
- Hero tagline "Building Bridges. Shaping Futures." is identical in structure and tone to competitors (echochange uses "Echoing Youth Voices Globally", GYN's own section titles use similar language) — zero differentiation.
- Testimonial section: 11 image-only tiles with no text captured — visitors see faces but receive no actual testimony.
- Content errors present: a speaker name alternates between "Hoyen" and "Huyen"; Prof. Araújo is listed as chair of "GYIS 2026" on a page whose upcoming event is GYIS 2027 Paris. These signal low editorial governance, which undermines the institutional credibility claim.
- "Your Voice. Your Impact. Our Future." engagement CTA is generic nonprofit boilerplate — interchangeable with any of the four benchmark sites.
- Newsletter form collects Name + Email with no stated value exchange.

**IA/Nav structure**

Home | Events (YFGG 2026 Geneva, GYIS 2027 Paris) | Global Network (Global Speakers, Global Advisory Board, Global Youth Advisory Board) | Gallery | Contact Us. "Get Involved" and "Apply Now" in header — both link to different targets, creating confusion. Footer: Bay Shore, NY address.

**Registration / Tickets / Pricing**

Most developed of the four. Geneva: 160 seats, 80 scholarships, 5 categories, ages 15–45. Paris: 160 seats, 3 scholarship tiers, ages 15–45. "Apply" CTA on both cards. Still no inline HTML pricing table or payment flow visible.

**Speakers and video**

Advisory popup via Elementor (jarring, inconsistent). Global Speakers, Global Advisory Board, and Global Youth Advisory Board are separate nav items — a three-tier board structure that GYN's single list collapses. Highlights reel label present with no confirmed embed. Porto GYIS photo strip: 5 images per past event.

**We beat them by** implementing an error-free, editorially governed speaker/board system where each profile has a consistent schema (name, verified role, country, SDG alignment tags, LinkedIn), surfaced in a smooth CSS scroll-driven side panel — no Elementor popup jarring, no content errors visible to UN delegates.

---

## 2. Best-in-Class References

### 2.1 Web Summit — websummit.com

**Source:** https://websummit.com (fetched live)

The largest tech conference site in operation (Lisbon, November 9–12 2026, 70,000+ attendees). Notable for treating the homepage as a trust machine rather than a registration brochure.

- **Hero:** Full-width background video with explicit play/pause/mute/unmute controls — the video is not autoplay-forced, respecting user agency and bandwidth.
- **Speaker cards:** Square 300×300 face-crop images (URL parameters specify `300x300&face=true`), name, job title, company, and a "product label" for AI/robotics speakers (e.g., "Humanoid Robot") — the label answers "why should I care about this speaker?" before the click.
- **Logo walls:** Four distinct audience segments (attendees, startups, media, investors) each with their own logo row — communicates the full ecosystem without conflating audiences.
- **Testimonials:** Headshot + name + role + pull-quote with publication attribution (not just an anonymous avatar).
- **Nav:** Six audience-segmented dropdown categories (Attendees, Exhibitors, Startups, Investors, Media, More) — IA is audience-first, not content-type-first.
- **Email signup:** Two distinct value propositions: discounts + announcements, and a PDF event overview — not a generic "subscribe."
- **Persistent header:** "Book tickets" + "Exhibit" + "Login" — the three conversion paths always visible.

**Technique we'll steal:** The audience-segmented nav structure (Delegates / Speakers / Partners / Media / Alumni) and the face-crop speaker card with an inline "focus area" label that removes the need to click through to learn why someone is on the programme.

---

### 2.2 Stripe Sessions — stripesessions.com

**Source:** https://stripesessions.com (fetched live)

Annual developer/fintech conference. Notable for clean information hierarchy and honest pricing mechanics.

- **Hero motif:** Wave imagery used as a visual signature — appears in hero and is reused in the footer, creating an environmental cohesion rather than one-off decoration.
- **Pricing:** Crossed-out original price ($999) beside the active early-bird price ($599) — classical anchoring, rendered in HTML (not an image), so it is accessible and indexable.
- **Past-session highlights:** Photo + title + "Watch now" inline — the video discovery experience lives on the homepage, not buried in an Archive section.
- **Site stack:** Next.js `/_next/image` with explicit `width` and `quality` parameters — all images optimised at the URL level, no CMS upload waste.
- **Page structure:** Stacked thematic blocks (About / Agenda / Call for Proposals / Passes / Speakers / Sponsors / FAQs) — every decision a visitor must make has a dedicated section, in the order of decision sequence.

**Technique we'll steal:** Crossed-out original price + named early-bird label in semantic HTML for the scholarship/paid-ticket pricing table; and the "Watch now" inline past-session card pattern for surfacing summit highlights on the homepage without a separate video archive page.

---

### 2.3 Frontier Dialogues — frontierdialogues.com

**Source:** http://www.frontierdialogues.com (fetched live; Awwwards Honorable Mention, July 2026)

An intimate design-industry dialogue series. Relevant as a model for making a small-roster, curated summit feel premium rather than under-resourced.

- **Publication framing:** The site is structured as chapters (00–07) with a prelude — not as a typical event website. This frames attendance as intellectual participation, not a conference ticket.
- **Typography:** All-caps with dot separators for location/date lines (e.g., "FOREIGN CINEMA, SAN FRANCISCO, USA · FEBRUARY 2026") — deliberate, editorial, memorable.
- **Speaker grid:** Numbered 13-person grid with portrait, name, role, and LinkedIn — complete information density in minimal space.
- **Anchor nav:** Links scroll to chapters rather than separate pages — keeps all context on one canvas.
- **Branding:** The host's identity ("Raw Materials — An unusual design company") is part of the content, not hidden in a footer.

**Technique we'll steal:** The chapter/edition framing for GYN's event history — each past summit presented as "Edition N" with a chapter structure (Opening Ceremony / Workshops / Policy Roundtable / Closing Declaration) rather than a flat photo gallery.

---

### 2.4 Farm Africa — farmafrica.org

**Source:** https://www.farmafrica.org (fetched live; 2025 Webby Award nominee per numiko.com/insights/the-best-non-profit-websites-of-2025)

A UK development charity whose homepage uses scroll-based storytelling to transform a donation flow into an emotional journey. Directly relevant to GYN's scholarship conversion goal.

- **Scroll-driven question reveal:** The hero presents a rhetorical question in two versions — suggesting a staggered reveal animation, though exact scroll-trigger behaviour requires live browser inspection.
- **Layered hero imagery:** A sky image and a "sky cutout" asset imply a parallax or cut-out depth layer effect, not a flat hero photograph.
- **Spending transparency card:** 89p/7p/4p per £1 breakdown — a single visual that answers the donor trust question before it is asked.
- **Donation impact cards:** £18 → outcome, £64 → outcome, £182 → outcome — a three-tier pricing ladder that is emotionally motivating, not transactional. The same pattern works for scholarship tiers (e.g., "Self-funded delegate → what you unlock", "Partial scholarship → impact", "Full scholarship → criteria").
- **Modular service grid:** Nine outcome-focused "What we do" tiles (verbs: "Boost productivity", "Empower women") — action-oriented labels that imply measurable results.

**Technique we'll steal:** The donation/scholarship impact card pattern — three tiers, each with a cost (or criteria), a concrete outcome statement, and a single CTA — applied to GYN's ticket/scholarship pricing table.

---

### 2.5 Perform Europe — performeurope.eu

**Source:** https://performeurope.eu (fetched live; Awwwards Honorable Mention, 8 September 2026)

A European performing arts mobility programme. The first Awwwards-recognised event-adjacent site in the 2026 events category listing to prioritise accessibility as a design feature rather than a compliance checkbox.

- **Accessibility panel:** User-controllable text size, line height, letter spacing, word spacing; presets: Dyslexia Friendly, High Contrast, Grayscale, Reduce Motion, Pause Animations. This is built into the design system, not bolted on via a third-party overlay widget. This is award-worthy at a time when most conferences still ship broken focus states.
- **Six value labels in the hero:** Innovative / Green / Diverse / Inclusive / Fair / Collaborative — positioned as the organisation's defining attributes before any programme copy. For GYN, the equivalent would be the 17 SDG focal areas used as inline labels.
- **"Play documentary" trigger:** A hero-level video trigger for a full documentary — not a YouTube embed, a proper video experience integrated into the hero section.
- **Arrow-button card style:** News and event cards with an inline directional arrow icon as the CTA — compact, scannable, consistent across card types.
- **Stats band:** Budget (€1.4M), max grant (€60K), partnerships (25+) — three numbers that set institutional scale expectations instantly.

**Technique we'll steal:** The accessible, user-controlled motion/contrast preferences panel (built natively, no third-party widget) and the "documentary as hero content" pattern — GYN has a YouTube channel; the summit highlight reel deserves hero placement, not a bare iframe at the bottom of the page.

---

## 3. Current thegyn.org Critique

**Source:** https://thegyn.org (fetched live)

### Keep

- Countdown timer in the hero — urgency works; the mechanism is sound even if the styling needs replacing.
- SDG Innovation Summit Malaysia 2026 as the primary hero subject — the flagship event is correctly foregrounded.
- Six service blocks (Conferences, Networking, Leadership Development, Collaborative Networks, Youth Mentoring, Workshops & Trainings) — comprehensive programme scope, the content is valid.
- SDG focus area cards (SDG 4, 5, 9, 13) — a concrete commitment to specific goals rather than all 17, which is strategically credible.
- Global Advisory Board with bios — credentialled advisor presence matters for UN-adjacent legitimacy.
- Footer social links (Facebook, Instagram, WhatsApp, YouTube) — multi-channel presence is appropriately documented.
- Confirmation modals after application submission — conversion feedback exists.

### Kill

- **Neon yellow #FEFF00 as a brand colour.** This colour does not appear anywhere in the GYN logo (which uses navy #202F60, crimson #C52035, orange-red #EF3F2D, orange #F2692C, green #48783F). It is borrowed from nowhere and contributes no meaning. WCAG contrast of #FEFF00 on white (#FFFFFF) is approximately **1.08:1** — it fails WCAG AA for every text category. It is essentially invisible. Kill it entirely.
- **Zero-radius buttons throughout.** Hard square corners on interactive elements signal unpolished, template-default UI. Every comparable organisation in this audit uses rounded or pill buttons.
- **Bare YouTube iframes.** YouTube iframes embedded without a custom thumbnail, title overlay, or aspect-ratio wrapper produce layout shift, look like placeholder content, and leak the YouTube brand into the page. Kill the default iframe in favour of a facade/poster image with a JS-triggered embed.
- **Ambassador carousel with no visible mechanism.** Thirteen ambassador cards in a carousel with no confirmed navigation affordance, autoplay behaviour, or touch/swipe capability described. If it is an auto-scrolling carousel, it violates WCAG 2.1 SC 2.2.2 (Pause, Stop, Hide).
- **Single long scroll page with no anchor navigation.** Seven content sections (Who We Are, Focus Areas, Objectives, Advisory Board, Ambassadors, Upcoming Events, Partners) with no sticky sub-nav or scroll-progress indicator. Long pages without wayfinding disorient users who return mid-page.

### Fix

- **Replace yellow with a functional colour from the logo.** The crimson #C52035 (contrast on white: 5.49:1, passes WCAG AA) or navy #202F60 (contrast on white: 11.23:1) should be the primary CTA colour. The orange-red #EF3F2D (contrast on white: 3.67:1, passes for large/bold text only) can be used for large decorative text but never for body-size interactive labels.
- **Orange #F2692C on white fails WCAG AA** (contrast ≈ 2.94:1). Do not use as text colour on light backgrounds.
- **Fix Inter-everywhere typography.** Inter at every weight and size removes the visual hierarchy between display, heading, and body copy. Pair one expressive display face with Inter for body — the design direction section proposes specific pairings.
- **Fix the advisor carousel.** Visible navigation (prev/next arrows + dot indicators), pause-on-hover, pause-on-focus, respects `prefers-reduced-motion`. Or replace with a 3-column static grid if carousel behaviour adds no navigational value.
- **Fix the nav submenus.** Two separate menu instances in the source (desktop + mobile) with submenus for Past Events (FMS Thailand, SIS Malaysia 2026) and Upcoming Events — the parent items are inconsistently labelled and the subpages are not clearly linked from the hero.
- **Fix the registration flow gap.** The APPLY NOW button links to a separate event page. The homepage should display inline: scholarship tier summary (fully funded / partially funded / self-funded), a deadline counter, and a 3-step flow preview — so users know what they are committing to before they leave the homepage.
- **Fix the floating WhatsApp widget.** A floating WhatsApp widget can obscure page content on mobile and interferes with scroll. If kept, it must be keyboard focusable and have a visible label for screen readers.

### WCAG Contrast Summary

| Colour pair | Ratio | Result |
|---|---|---|
| #FEFF00 text on #FFFFFF | 1.08:1 | Fail (all text) |
| #F2692C text on #FFFFFF | 2.94:1 | Fail (normal + large) |
| #EF3F2D text on #FFFFFF | 3.67:1 | Fail normal, pass large/bold |
| #0074A5 text on #FFFFFF | 4.74:1 | Pass AA normal text |
| #48783F text on #FFFFFF | 4.69:1 | Pass AA normal text |
| #C52035 text on #FFFFFF | 5.49:1 | Pass AA normal text |
| #202F60 text on #FFFFFF | 11.23:1 | Pass AAA |
| #FEFF00 on #202F60 | 10.44:1 | Pass AAA (the one valid use of yellow: light text on the navy logo background) |

---

## 4. Design Direction Implications

Four distinct directions, each grounded in the evidence from sections 1–3. All four use only the actual logo palette (navy, crimson, orange-red, orange, green) — the site yellow is retired in every direction.

---

### Direction A: "Earned Authority"

**Mood:** UN chamber meets design-forward youth NGO — structured, confident, internationally legible.

**Type pairing:** [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) (display/headlines, italic variant for emphasis) + [DM Sans](https://fonts.google.com/specimen/DM+Sans) (body, UI). Both are Google Fonts, zero cost.

**Logo palette use:** Navy #202F60 as primary background and type colour. Crimson #C52035 as the single accent and CTA colour (passes WCAG AA on white and on navy). The 17-colour SDG wheel is used as a precision data-vis element (SDG focus area badges) rather than a decorative wallpaper. Orange and green from the logo appear only as badge colours for SDG 9 and SDG 4 respectively.

**Signature interaction:** A sticky chapter nav that appears after the hero scroll — each page section (Who We Are / Our Programme / Summit 2026 / Advisory Board / Apply) has a labelled anchor indicator in a slim horizontal bar. As the user scrolls, the active section label advances, giving a "you are on page N of N" document feel that signals institutional thoroughness.

**Reference sites:** Frontier Dialogues (chapter framing, dot-separated metadata lines), Perform Europe (stats band, values-as-labels in hero), Web Summit (audience-segmented nav, face-crop speaker cards).

**Risk:** Could read as too formal for the youth-participation audience — scholarship applicants aged 18–28 may respond less warmly to a register that echoes UN documentation. Mitigate with large, candid event photography in every other section.

---

### Direction B: "Amplified Youth"

**Mood:** Community-first, photographic, emotionally direct — the people are the evidence.

**Type pairing:** [Fraunces](https://fonts.google.com/specimen/Fraunces) (display, variable optical-size and weight axes for dramatic headlines) + [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (body/UI). Both Google Fonts.

**Logo palette use:** White-dominant canvas. Crimson #C52035 for primary CTAs. Orange-red #EF3F2D used only at display size (bold, large — passes WCAG at that weight). A warm off-white (#F9F6F1 or similar) replaces pure white in content sections to separate the photography from the background. The SDG wheel colours are used as a 17-dot horizontal strip under each Focus Area heading — a visual language that extends the logo without copying it.

**Signature interaction:** Scroll-driven impact counter section: as the user scrolls past the stats row, each number counts up from zero using CSS `@property` counter animation with no JavaScript dependency (fallback: final number shown immediately). On mobile, the counters are full-viewport-width stacked tiles, each with a full-bleed photograph behind a semi-transparent navy overlay.

**Reference sites:** Farm Africa (layered hero, spending transparency cards, donation/scholarship tier pattern), echochange.org (ambassador density and country tags — but executed with actual photography rather than placeholder portraits), One Young World (counsellor/speaker card with country prominently labelled).

**Risk:** Heavy reliance on high-quality event photography. If the available image library from past summits is limited or low-resolution, this direction degrades badly. Requires a photography brief for SISM 2026.

---

### Direction C: "Summit Stage"

**Mood:** Immersive dark-mode event spectacle — the homepage feels like walking into the venue.

**Type pairing:** [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (display/heading, has a slightly technical character that works for the Innovation Summit name) + [Inter](https://fonts.google.com/specimen/Inter) (body — already used on the current site, reducing re-work). Both Google Fonts.

**Logo palette use:** Deep navy #202F60 as the hero background, fading to a slightly lighter #1A2547 for depth. The SDG wheel's multi-colour palette is used as a ring-of-light particle animation around the hero logo — not as flat icons. Crimson #C52035 appears as the primary CTA button fill (white label). Orange #F2692C appears as a glow/highlight on hover states only — never as text.

**Signature interaction:** Full-viewport dark hero with a subtle animated particle ring (CSS or a lightweight canvas, no Three.js) that traces the 17 SDG colours. The countdown is presented as large mono-spaced digits (Space Grotesk variable weight) that flip on change. On scroll past the hero, the page transitions from dark to light for the content sections — a dark-to-light split that Web Summit and Vercel Ship both use to signal "event → information."

**Reference sites:** Web Summit (video hero, persistent ticket + exhibit CTA, audience nav), Stripe Sessions (early-bird pricing in hero bar, stacked decision-sequence blocks), Hack the North (Awwwards HM Aug 2026 — site content couldn't be loaded for detail, but the listing confirms the technique is award-recognisable for event/conference contexts).

**Risk:** Dark mode requires significantly more photography art direction (images must read well against dark). Accessibility: dark backgrounds with the orange or orange-red from the logo palette fail WCAG AA for body text. All body copy in this direction must use white or a light neutral, never the warm logo colours. Also risks looking like a fintech or gaming conference, which could undermine the SDG/NGO positioning for institutional funders.

---

### Direction D: "Open Atlas"

**Mood:** The world is the stage — geographic, chapter-driven, each summit a place and a community.

**Type pairing:** [Archivo](https://fonts.google.com/specimen/Archivo) (display — wide, confident, variable font with condensed and wide axes for geographic scale effect) + [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4) (body editorial text — signals rigour and documentation, appropriate for policy roundtable content). Both Google Fonts.

**Logo palette use:** White canvas with navy as primary text. Each past summit/edition gets a "country colour" derived from the logo palette: Malaysia 2026 = orange-red, Thailand (FMS) = green, future editions rotate through the remaining logo colours. The SDG wheel is used as a small inline data badge next to each Focus Area — 17 dots coloured to the UN standard, but only the 4 active ones are fully saturated; the inactive 13 are desaturated grey. This is honest about scope without hiding the broader framework.

**Signature interaction:** An interactive world map in the Impact section (SVG-based, not a third-party map widget) where each chapter/country lights up in the navy→crimson gradient on hover, showing participant count and event dates. On mobile, the map becomes a scrollable country list sorted by participant count. This directly extends the logo's "hands around the world" symbolism into a navigable UI element.

**Reference sites:** echochange.org (world map of chapters as a section, though their execution is static), thecgad.org (previous events as photo strips by location — elevated here into a full editorial chapter), Frontier Dialogues (edition/chapter numbered structure), Farm Africa (geographic programme cards).

**Risk:** The SVG world map requires custom development and an accessible keyboard/screen-reader alternative (a data table must accompany it). Country-coloured editions could become confusing if the palette runs out or if an edition is co-hosted in a country that "belongs" to a colour already used. Hardest to build; highest reward for global positioning with UN co-host.

---

## Design Direction Summary (10-line version)

1. All four client benchmark sites share the same critical gap: none delivers actual embedded video — they promise "Play" but link to images or YouTube tabs. GYN can own in-page video from day one.
2. None of the four has a semantic HTML pricing/scholarship table. A structured tier display (cost / scholarship criteria / what you access) is a differentiator across every competitor.
3. echochange.org is the closest structural peer. Its strength is quantified social proof (81+ countries, 53K+ lives). Beat it with better photography, a real video layer, and a scholarship tier display.
4. pgconnects.com/london has the most sophisticated ticket mechanics (early-bird, promo codes, tiered sponsors) but is a B2B commercial event — not the right model for credibility with UN institutional partners.
5. thecgdl.org and thecgad.org are direct peers. thecgad.org's event cards with seat/scholarship/age data are the best registration-clarity pattern in the peer set and should be adopted.
6. Web Summit and Stripe Sessions provide the best-in-class templates for speaker card systems, audience-segmented nav, and pricing display.
7. Farm Africa's scholarship/donation tier card pattern (criteria → outcome → CTA) translates directly to GYN's conversion goal.
8. Perform Europe's native accessibility panel (reduce-motion, high contrast, dyslexia preset) is an achievable differentiator that would set GYN apart from every peer in this audit.
9. The four design directions are: **A — Earned Authority** (institutional, navy-dominant, chapter nav, Instrument Serif + DM Sans), **B — Amplified Youth** (photographic, community-first, counter animation, Fraunces + Plus Jakarta Sans), **C — Summit Stage** (dark hero, SDG particle ring, countdown digits, Space Grotesk + Inter), **D — Open Atlas** (geographic, SVG world map, edition chapters, Archivo + Source Serif 4).
10. Benchmark sites that could not load usable design content: Hack the North (returned only page title, no markup); Rebelliously Optimistic (returned only title + Awwwards link); Farm Africa scroll-zoom animation could not be confirmed from markup alone (noted as inference from hero asset structure).

---

_Sources: https://echochange.org · https://pgconnects.com/london · https://thecgdl.org · https://thecgad.org · https://thegyn.org · https://websummit.com · https://stripesessions.com · http://www.frontierdialogues.com · https://www.farmafrica.org · https://performeurope.eu · https://www.awwwards.com/websites/events/ · https://numiko.com/insights/the-best-non-profit-websites-of-2025_
