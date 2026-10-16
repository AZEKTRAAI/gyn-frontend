# Direction I: "In Our Hands"

One plan, one design. It replaces the eight earlier directions, which the client found weaker than echochange.org. Built from: `docs/research/echochange-analysis.md` (the site to beat), `docs/research/inspiration.md` (Apple, Peter Tarka, Zhenya Rynzhuk), `docs/ai-tells.md` (what makes a site look AI-made), the content in `content/`, and the skills: impeccable (brand register, shape, overdrive), design-taste-frontend, high-end-visual-design, gpt-taste (GSAP), emil-design-eng (motion feel), design:design-system, design:ux-copy, design:accessibility-review.

Image probes: skipped. No image generator is connected in this session, so the visual direction comes from research and real Blender renders instead.

## 1. The idea

The GYN logo is four hands holding the 17-colour SDG wheel. GYN works on four of those goals. So the site tells one story, in the order a visitor scrolls:

**Seventeen goals. Four in our hands. A hundred seats in Kuala Lumpur.**

The wheel is the product, shot the way Apple shoots an iPhone. As you scroll the hero, the wheel turns and the four GYN goals lift out of it. Each of those four goals then gets its own full-colour chapter with its own object. The page ends with four hands (the logo, made physical) holding the wheel up, and the booking button.

Design read: a brand landing page for 17 to 35 year-old applicants on their phones and for partners on laptops, built like an Apple product page, carried by Tarka-style 3D objects, with Rynzhuk-style editorial typography in the text-heavy sections.

**Scene sentence:** a student in Lagos checks the summit on her phone in afternoon light between classes; a programme lead at a university in Kuala Lumpur opens the link on a laptop in a bright office. Both are in daylight, so the base is light; colour arrives in full, saturated chapters, never as a dark mode.

## 2. Who owns what (the rule that keeps three influences coherent)

| Layer | Owner | Applies to |
|---|---|---|
| Structure, pacing, type scale, motion rules, speed | **Apple** | Every section. One idea per screen. 144px between sections on desktop, 112px on mobile. One headline weight. Media starts as a still, plays in view. Reduced motion is the light version, not a broken one |
| The object, the emotional hook | **Tarka** | Hero wheel, four SDG objects, KL token, the closing hands. Always on a plain colour field, used like a product shot, type beside it, never on it |
| Editorial voice in text-heavy sections | **Rynzhuk** | One italic serif word per headline, the "what we do" type poster, the gridded programme, the SDG index with superscripts, the speakers list where the next name waits below. Never inside the apply or ticket flow |
| Energy and saturation | **echochange.org, beaten** | Full-bleed SDG colour chapters (our colours, more of them, with meaning), real delegate photos up front. Not their violet, lime, ribbon or sticker words |

## 3. Visual system

### Colour (strategy: Full palette, with drenched chapters)
| Role | Hex | Use |
|---|---|---|
| Field (base) | `#EEF2F6` | Hero cove and light sections. A cool off-white with chroma toward GYN navy, not cream |
| Ink | `#0E1530` | All text on light fields, the ticket and closing sections as a dark field |
| Brand navy | `#202F60` | Secondary ink, rules, the logo wordmark |
| SDG 4 | `#C5192D` | Education chapter field; white text (5.9:1) |
| SDG 5 | `#FF3A21` | Equality chapter field; ink text (5.03:1; white fails at 3.57) |
| SDG 9 | `#FD6925` | Innovation chapter field; ink text (6.18:1; white fails at 2.91) |
| SDG 13 | `#3F7E44` | Climate chapter field; white text (4.91:1) |
| Accent | `#FCC30B` | Primary button fill only, ink text (11:1) |
| Crimson | `#C52035` | Editorial accent on light sections (Rynzhuk's single warm accent), italic words, closed-tier stamps |
Every text/background pair is computed before it ships (`design/contrast.py`). The wheel's 17 colours appear only in the 3D render and the SDG index superscripts.

### Type (two families)
- **Host Grotesk** (variable 300 to 800, with italics) does everything Apple's SF Pro does on apple.com: headlines at weight 600, body at 400.
- **Bodoni Moda Italic** (high-contrast serif, the Rynzhuk move) for exactly one word per headline, never more, never body.
- Why: Host Grotesk is a contemporary grotesk not on any reflex list, with true italics; Bodoni Moda gives the Schnyder-like contrast Rynzhuk uses, and pairs on a clear contrast axis (geometric sans vs Didone italic).
- Scale (Apple measurements, `docs/research/inspiration.md` 1.2), all `clamp()` and checked at 320px:

| Token | Desktop | Mobile | Tracking | Line height |
|---|---|---|---|---|
| Hero | 80px (max 6rem) | 44px | -0.015em | 1.05 |
| Chapter claim | 64px | 38px | -0.012em | 1.06 |
| Section headline | 48px | 32px | -0.008em | 1.08 |
| Lead | 24px | 20px | 0 | 1.35 |
| Body | 18px | 17px | 0 | 1.55 |
| Label | 14px | 14px | +0.01em | 1.3 |
| Poster (Rynzhuk scale jump, one per page) | 18vw | 22vw | -0.03em | 0.9 |

### Shape, space, depth
- One radius for media: 28px (Apple). Buttons are full pills. No other radii.
- No cards with border plus shadow. Grouping comes from colour fields and space.
- Container 1200px, 12 columns, 24px gutter; mobile 16px side gutter.
- Section rhythm 144px / 112px; inside a section, tight groups (8, 16, 24px).
- Shadows only inside the 3D renders.

### Imagery
- 3D: the Blender set in `concepts/assets/r3/` (Tarka brief). Opaque renders on coves that match their section colour exactly, so the object sits in the page with no visible box.
- Photography: real GYN delegates only (FMS Bangkok gallery, speakers, ambassadors, advisors), captioned truthfully. Small and precise in a typographic layout (Rynzhuk), or inline inside a headline as pills.

## 4. Motion system (GSAP 3.15.0 ScrollTrigger + SplitText, from cdnjs)

| Moment | Technique | Reduced motion / mobile |
|---|---|---|
| Hero | Pinned for ~150vh; scroll scrubs a 72-frame wheel sequence drawn to canvas (frames preload progressively); headline lines rise once on load | Poster frame 72 as an image, no pin, no frames downloaded |
| Four SDG chapters | Stacked full-screen panels: each pins and the next slides over it (card stacking); the chapter's object loop plays only while in view | Panels stack normally, posters only |
| Section headlines | SplitText line mask reveal, once per section, H2 only | No motion |
| People headline | Inline photo pills scale from 0.6 to 1 as the line enters | Static |
| Programme grid | Row highlight follows the pointer; day cells fill with colour on scroll | Static |
| Speakers | Name list where the next name waits ghosted below; hovering or focusing a name reveals the photo beside it with a clip-path wipe | Photos shown in a simple grid |
| Buttons | Press scale 0.97, 160ms ease-out `cubic-bezier(0.23,1,0.32,1)`; primary CTA arrow nudges on hover | Same, no movement |
Rules: transform/opacity/clip-path only; one entrance per section; nothing loops except the 3D objects in view; all content visible without JavaScript.

## 5. Page, section by section

Copy marked **[client]** comes verbatim from `content/`; copy marked **[ours]** is written for this design and follows `docs/ai-tells.md` (no em dashes, none of the banned words).

1. **Nav (Apple).** Floating pill on scroll, solid at top: GYN logo, Past events, Upcoming events, About, Contact, "Book Forum Access, $199" (yellow). Mobile: logo, Book button, menu.
2. **Hero (Apple + Tarka + one Rynzhuk word).** Field `#EEF2F6`. Left: H1 **[ours]** "Seventeen goals. *Four* in our hands." (Bodoni italic on "Four"). Lead **[client facts]** "SDG Innovation Summit Malaysia 2026. 19 to 22 November, Teedo Hotel, Kuala Lumpur. Co-hosted by UNU Global Health." Buttons: "Book Forum Access, $199" and "See the programme". Countdown to 19 Nov 09:00 MYT in small type under the buttons (not a giant timer). Right: the wheel sequence; as you scroll, the wheel turns and wedges 4, 5, 9, 13 lift out. Nothing above the H1.
3. **People (Rynzhuk inline images, echochange's energy done our way).** White field. Huge line **[ours]**: "Global [photo pill] Youth [photo pill] Network" with two real FMS delegate photos as pills inside the line. Under it, one sentence **[client]** "Global Youth Network (GYN) is an international organization dedicated to connecting and empowering young people worldwide." and the facts we can prove: 12 ambassadors in 11 countries, 8 advisors, 12 FMS Thailand speakers. Then a loose, asymmetric strip of 7 to 9 real delegate and ambassador photos (not a uniform grid), names on hover/focus.
4. **The four goals (Tarka chapters, drenched, stacked).** Intro line **[ours]** "Four of the seventeen. The ones we work on." then four full-screen chapters, each one SDG colour field with its object loop on the right:
   - SDG 4, crimson: claim **[ours]** "Learning that travels." + **[client]** "Empowering through Quality Education." Object: books opening into stairs.
   - SDG 5, `#FF3A21`: **[ours]** "Equal is the baseline." + **[client]** "Breaking barriers for Gender Equality." Object: the balance.
   - SDG 9, `#FD6925`: **[ours]** "Ideas need infrastructure." + **[client]** "Driving Innovation & Resilient Infrastructure." Object: meshing gears.
   - SDG 13, green: **[ours]** "The climate can't wait." + **[client]** "Taking urgent action for our Climate." Object: half globe with a leaf.
   A small SDG index rides along the edge (Rynzhuk): "EDUCATION⁴ EQUALITY⁵ INNOVATION⁹ CLIMATE¹³", current one highlighted (one of the 3 uppercase uses).
5. **What we do (Rynzhuk type poster).** Field `#EEF2F6`, crimson accent. The six activities **[client]** (Conferences, Networking, Leadership Development, Collaborative Networks, Youth Mentoring, Workshops & Trainings) set as one flowing typographic block, alternating roman and italic, separated by small SDG-coloured dots; focusing an item shows its one-line description beneath. No cards.
6. **The summit (Apple bento, one radius).** Headline **[ours]** "One hundred seats. Four days. *Kuala Lumpur*." Tiles, interlocking with no gaps: big tile with the SISM banner photo and dates/venue; UNU Global Health co-host logo tile; "$1,000 seed grant" tile **[ours]** "Pitch it on stage. Win $1,000 to build it." with **[client]** detail; APU visit tile with the APU logo; KL towers token render tile. Grid uses `grid-auto-flow: dense`, verified with no empty cells.
7. **Programme (Rynzhuk visible grid).** Four columns with 1px rules, one per day, day number huge in its cell, sessions **[client]** small and listed. Mobile: a vertical list with sticky day headers.
8. **Speakers (Rynzhuk "next waiting").** The 8 SISM speakers **[client]** as a big name list; the next name sits ghosted under the current one; hover/focus reveals the photo and title. Mobile: a horizontal snap row of photo cards.
9. **Past summit (Apple media).** FMS Thailand, Bangkok, July 2026: one large highlight-video still with our player, plus a horizontal photo strip, captions truthful.
10. **Tickets (Apple, plain, no editorial tricks).** Dark field `#0E1530`. Three open tiers with the price as the largest element and what's included **[client]**; the two scholarship tiers listed as closed (11 Oct, results 16 Oct) in a quiet row. One button per tier with the price in it.
11. **Closing (Tarka hands + Rynzhuk scale jump).** The hands-holding-the-wheel loop on navy, and a poster-size line **[ours]** "See you in *Kuala Lumpur*." with the booking button.
12. **Footer.** Real nav, policies, contact@thegyn.org, WhatsApp, socials from `content/sitemap.json`.

## 6. Beat echochange.org (from the analysis)
Measured on their site (`docs/research/echochange-analysis.md`): mobile Lighthouse performance 22 to 26 with LCP 10 to 12.5 s, accessibility 82 to 85, CLS 0.2, 264 requests; the hero is one flattened 800px PNG; type and spacing drift across pages (H1 49 vs 55px, padding 40 to 100px, 7 font families on About); the summit page falls back to Arial, has no H1 and a dead countdown; mobile is a 15-screen straight stack with 14px light body text, 30px menu button and a header that scrolls away with the event button.

Take the principle, not the look:
- One home colour plus one rare action colour: our light field plus the yellow button, used only for booking.
- Colour that carries meaning: each SDG chapter's colour is that goal's official colour.
- Real crowds and a country on every person (ambassador and speaker chips carry the country name).
- A dedicated booking page with "what's included" and a "before you begin" checklist (already in the app's registration flow).
- Keep the booking button reachable: the nav pill stays on screen on mobile with the price in it.
- Build the hero as real layers (canvas sequence + live text), never a flattened image.
- One type system across every page, one section rhythm, 17px+ body text, 44px touch targets.

- Match their saturation, beat their meaning: our colour fields are the SDG colours GYN actually works on, each paired with an object that says what the goal is.
- Keep their best move (real young people up front) and do it with more craft: inline photo pills in a headline instead of a sticker collage.
- Beat them on pacing: one idea per screen instead of many stacked widgets.
- Beat them on speed and accessibility: measured targets below, against their measured scores in the analysis.
- Don't copy: no royal blue + lime + violet, no curved ribbon text, no sticker labels, no browser-window frames on portraits, no paper-plane doodles.

## 7. Budgets and checks
- Performance: Lighthouse mobile ≥90 target, desktop 100; hero visible text in the first paint; sequence frames load after first paint and only on desktop; each loop ≤1.5 MB and `preload="none"`; total mobile transfer for the home page under 2 MB.
- Accessibility: WCAG 2.2 AA; axe clean (no serious/critical); keyboard path through nav, hero CTAs, chapters, speakers, programme, tickets; reduced motion gives a complete, beautiful static page; headlines remain real text.
- AI-tells: run `docs/ai-tells.md` rules 1 to 13 and the checker; no eyebrow pills, no numbered section labels except the real 4-day programme, no identical card grids.
- Truth: every number and claim traceable to `content/`; photos captioned by place and month.
- Red team: one full pass on the built concept before it's shown.

## 8. Build plan
1. Renders (`concepts/assets/r3/`), in progress.
2. Build `concepts/i-in-our-hands.html` as one standalone file (host limits from `docs/concept-brief.md`), written in chunks, GSAP from cdnjs, assets local.
3. QA: sweep at 360, 390, 768, 1024, 1440, 1920; reduced motion; axe; Lighthouse; contrast script; AI-tell checker.
4. Red team pass, fixes, then publish to the design-directions page as direction I.
5. If the team picks it, port it into the Next.js app (tokens and components already structured for a re-skin).
