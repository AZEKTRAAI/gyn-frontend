# AI tells: what makes a site look generated, and where our four concepts trip

Research done 15 Oct 2026. 15 sources, all linked at the bottom. Sources are blogs, two HN threads and one measured audit (Krebs ran deterministic CSS/DOM checks on 1,590 Show HN pages). No peer-reviewed research exists on this, so treat the percentages as one person's scan and the rest as practitioner opinion. Every source agrees on one thing: a single tell proves nothing, it is three or four together that reads as AI.

Three things the brief asked about that no source names: infinite logo marquees, hover-lift on every card, and unDraw illustrations. Left out rather than invented. "Seamlessly" is also unsourced as a specific word; the copy lists name "elevate", "unlock", "empower", "supercharge" instead.

## The tells

Format per row: the tell, why it reads as AI, the fix. Source in brackets.

### Colour

| Tell | Why it reads as AI | Fix |
|---|---|---|
| Indigo/violet/purple anywhere, especially `from-indigo-500 to-purple-600` or `#615fff → #8e51ff` gradients, purple CTAs | Tailwind UI shipped `bg-indigo-500` as a demo placeholder in 2019; Adam Wathan apologised for it on X in Aug 2025. Five years of tutorials made it the statistical median, then generated pages fed it back into training data. Krebs found gradient backgrounds on 28% of Show HN pages. [West, Krebs, Sikora, 925] | Pick a palette from something true about the client (the GYN logo, the SDG wheel, a venue photo). Hex codes in `:root`, never a Tailwind colour name. |
| Gradient on everything (buttons, backgrounds, text) | "Gradients. Gradients Everywhere" is tell #1 on the slop-UI list; 28% of Show HN pages. [godobject, Krebs, GDG] | Gradients only as photo scrims or one hero element. Never on text or buttons. |
| Glassmorphism cards: `rgba(255,255,255,.1)` + `backdrop-filter: blur()` + 1px white border | Krebs: 17.1% of pages. HN WorldMaker: "Tailwind glassification almost universally fails WCAG". Slop-UI #9. [Krebs, HN 49867038, godobject] | Solid surfaces. If you need a panel over a photo, use an opaque colour from the palette. |
| Coloured glows and coloured `box-shadow` (`0 0 40px rgba(brand,.4)`) | Krebs pattern #8 "large colored glows and colored box-shadows". | Neutral shadows only, or none. |
| Permanent dark mode with mid-grey body text and barely-passing contrast | Krebs #5 and #6: dark navy + grey text + all-caps labels is the model's default when no theme is asked for. [Krebs, HN nullbio, voidhorse] | Choose the theme for the audience. If dark, body text at 4.5:1 minimum, measured. |
| Dark-mode toggle nobody asked for | GDG lists it among default patterns added "regardless of audience need". | Add a toggle only when the brief asks. |
| "Claude beige" / "biege, biege & biege" warm-neutral sites | HN jd7h, brachkow: the beige-and-anthracite "editorial" look is now its own cluster. | A warm neutral is fine if it comes from a reference (paper stock, a photo), not as a reflex against purple. |

### Typography

| Tell | Why it reads as AI | Fix |
|---|---|---|
| Inter for everything, especially the centred hero H1 | Krebs #1 ("the Helvetica of the LLM era"). Anthropic's own article says Claude "will almost always conform to Inter fonts, purple gradients on white backgrounds, and minimal animations" without steering. [Krebs, Anthropic, Kosta, 925] | Two faces, chosen for a reason you can say out loud. Not Inter, Roboto, Arial, system-ui. |
| The replacement combos: Space Grotesk, Instrument Serif, Geist, Geist Mono, Bricolage Grotesque, JetBrains Mono, Playfair | Krebs #2 names Space Grotesk, Instrument Serif and Geist as "certain font combos LLMs tend to use". Anthropic's skill was published Nov 2025, and its "distinctive" suggestions have become the second-order default. HN xz18r: "monospace fonts where none are necessary". [Krebs, HN 49867038] | If the font is in the Anthropic skill or on Vercel's site, assume every other vibe-coded page uses it too. Check Google Fonts' trending list and avoid the top 20. |
| Serif italic on one accent word in a sans headline (`Summit <em>Malaysia</em>`) | Krebs #3, verbatim. | Pick one: all serif, all sans, or italic for a real reason (a quote, a title). Not for decoration of one word. |
| All-caps tracked labels (`text-transform: uppercase; letter-spacing: .15em; font-size: 11px`) on every section | Krebs #16. HN vmg12: "overuse of all-caps is one of the biggest tells"; efilife: "all caps with letter-spacing ALWAYS". | Cap at two or three places per page (nav, one data label). A section does not need a label if the H2 is clear. |
| Small-caps "eyebrow" above every H2 | HN zeroonetwothree: "small caps headings or tags added randomly everywhere". | Delete the eyebrow and let the H2 carry it. |
| Thin weights (300) for body in dark themes | HN WorldMaker. | 400 minimum for body. |

### Layout

| Tell | Why it reads as AI | Fix |
|---|---|---|
| Badge or pill right above the hero H1 | Krebs #10, 4.7% of pages; the GIGAZINE write-up captions it the "eyebrow pill". HN ungovernableCat lists badges with gradients as the pair. [Krebs, GIGAZINE] | No element between the top of the hero and the H1. Put the date/venue below the headline as plain text. |
| Centred hero, generic sans, big headline, two buttons | Krebs #9. GDG: "a huge centered headline sitting in the middle of the screen". [Krebs, GDG, 925] | Left-aligned or asymmetric opener; put a real photo or a real object in the hero and size the type to it. |
| Three (or six) identical feature cards, icon on top, same height, same two-sentence body | Krebs #12, 20.1% of pages. 925: it was the grid Tailwind tutorials used to teach layout. Sikora #8: "every description contains two sentences, and every subhead hits roughly fifteen words". [Krebs, 925, Sikora, GDG] | Let content decide the shape: a list, a table, one big item and small ones, a paragraph. If cards remain, uneven lengths and no icons. |
| Bento grid | GDG: feature sections "often always look like bento grids or collections of cards". Studio Meyer's 2026 trends note calls the backlash "anti-grid brutalism". | Only when the content has real hierarchy (one feature matters more). Not as decoration for six equal items. |
| Numbered "01 / 02 / 03" steps or section markers | Krebs #13. HN dawnerd: "the section numbering gives it away now". | Number things only when order matters (a schedule, a process). Never as section decoration. |
| Coloured border on the top or left edge of a card | Krebs #11, 13% of pages. A designer he quotes: "colored left borders are almost as reliable a sign of AI-generated design as em-dashes for text". Kosta calls it "that damn left-edge coloured line". HN dilyevsky: AI "overuses the crap out of them". [Krebs, Kosta, Sikora] | Remove the stripe. Group with spacing, or colour the whole surface. |
| Same `rounded-xl` + 1px border + soft shadow card repeated for every surface | uxskill: "the stock border-radius ... the same soft card shadow on every surface". Kosta: "uniform everything" flattens hierarchy. [uxskill, Kosta, 925] | One radius value per component role; many things should have no border and no shadow at all. |
| Stat banner row ("100+ delegates · 17 countries · 12 ambassadors") | Krebs #14. HN original post on 49024805: "Trusted by 10,000+ professionals" was the red flag. | Put the number in a sentence with its source, or drop it. |
| Fixed section order: hero, logos, features, testimonials, pricing, FAQ, CTA | GDG; HN "every vibe-coded website is the same page with different words". | Order by what this visitor needs first. Merge or delete sections. |
| Identical `py-24` padding on every section, nothing competing for space | Sikora #9. | Vary section height by content; let one section be dense. |
| Centre-dot `·` dividers and `//` separators in text | HN atoav: "Center-dots as dividers are the new tell tale". Slop-UI #7: `//` "whenever anything close to tech is mentioned". | Commas, line breaks, or a table. |
| Emoji as icons, flag emoji in nav | Krebs #15, slop-UI #5, Sikora #4 (emoji render differently per OS, do not take CSS colour). | A real icon set, or no icons. Country names in text. |
| Pulsing status dot / "● Open Now" badge | Slop-UI #3 "pulsing badges on everything, even when the status never changes". HN tlahtinen "blinking dot in a corner". | Plain text state. Animate only something that actually changes while you watch. |

### Copy

| Tell | Why it reads as AI | Fix |
|---|---|---|
| Em dashes | Pangram measured 17 per 10k words in AI text vs 2 in human (10x). Sikora #1: four in a hundred words "is an instant tell". [Pangram, Sikora, HN ungovernableCat] | Commas, full stops, brackets. Zero em dashes in headlines and CTAs. |
| "Not just X, but Y" / "It's not X, it's Y" | Pangram: 3x human rate. Pen2Profit flags it; HN unholiness and 65 ("No this. No that." copy) call it "the most obvious tell". | Say the thing once, positively. |
| Elevate, unlock, empower, harness, seamless, supercharge, journey, ecosystem, world-class, cutting-edge | Pen2Profit names elevate, unlock, curate, delight, infused, ever-evolving. Slop-UI #10 names "Elevate". GDG names "supercharge your productivity". | Replace with the concrete verb: "meet", "apply", "get a seat", "learn". |
| Weightless headline formulas: "Build faster. Ship smarter." "Scale without limits." "Your all-in-one platform." "Empowering teams to build better products." "Choose Your Path." | 925, Kosta: averages of every headline the model has seen; could belong to any product. Kosta's test: would the founder say it out loud? | Write the headline only this client could use: a date, a city, a number, a name. |
| Stacked slogans (several taglines down one page) | HN charles_f counted seven on one sign-in page. | One tagline, used once. |
| Triads (three adjectives, three examples) | Pangram: 4x human rate. | Two or four. Or one with a number. |
| Stock CTAs: "Get Started", "Learn More", "Ready to...?" | 925 (gradient "Get Started" button), Pen2Profit ("Ready to...?" as a default closer). | CTA says what happens: "Register, $199", "See the 2026 programme". |
| Invented testimonials, names like "Sarah Johnson", "Trusted by 10,000+" | Sikora #5, GDG, HN 49024805. | Real names with permission, or no testimonials. |
| Context leaking ("Your files never leave your browser", stack credits, "3 campuses, one app") | Slop-UI #8, HN demibabs, weakfish. | Read every line as the visitor; delete anything written for the developer. |
| Title Case On Every Heading | Pen2Profit #19. | Sentence case. |

### Motion

| Tell | Why it reads as AI | Fix |
|---|---|---|
| Fade-up on scroll on every element, same 20px/600ms for all | HN xavdid: "I'm seeing this _everywhere_ recently". Kosta: "everything fades in with the same timing". 925: "the same generic fade-in" everywhere. [HN 49867038, Kosta, 925] | Reveal whole sections at most, or nothing. Never individual paragraphs and labels. Anthropic's own note: one orchestrated page-load stagger beats scattered reveals. |
| Hover lift (`translateY(-4px)` + bigger shadow) on every card | Not named by any source as an AI tell (925 only flags dead hover states). Listed here because it co-occurs with the card pattern above. | Hover feedback only on things that are links. Cards that are not clickable do not move. |
| Parallax on every section, custom cursors, scroll hijack | 925 ("over-design through motion"), HN api. | Delete anything that moves purely for decoration (Kosta). |
| Infinite logo marquee | Not named by any source found. GDG flags the static "trusted by" logo strip. | Only logos you are allowed to show, static. |
| Animation that restarts or loops with no state change | HN quirino (rollercoaster that "kept restarting"), slop-UI #3. | Loop nothing unless it is a clock. |

### Code

| Tell | Why it reads as AI | Fix |
|---|---|---|
| shadcn/ui defaults untouched: zinc ramp, violet primary, stock radius, one shadow | Krebs #17, uxskill, HN "Figma Make and Claude Code are really just using the out of the box CSS from shadcn". | Change the tokens before writing a component: neutral ramp, accent, radius scale, shadow scale, font. |
| `bg-gradient-to-r from-purple-500 to-pink-500` and friends | uxskill's linter flags the literal class string; West traces the lineage. | Grep for `indigo|violet|purple|fuchsia|pink` in classes and `linear-gradient` in CSS; both should be zero or justified. |
| Lucide at 16px/24px on every card | Krebs #12 (icon on top of every card); GDG lists Lucide as the default across v0, Lovable, Bolt. | No icons by default. If needed, one custom set at one size, used in one place. |
| `rounded-full` badges with 1px border and `text-xs uppercase tracking-wider` | Combination of Krebs #10 and #16. | Plain text labels, or none. |
| `py-24` on every `<section>`, `max-w-7xl mx-auto px-4` wrapper on everything | Sikora #9. | Per-section spacing; some sections full-bleed. |
| Identical card counts and identical body-text length across cards | Sikora #8. | Vary. Real content is uneven. |
| Comments like `// ── HERO ──────` box-drawing rules, `// cap at 1.5` on every line | HN atoav (trailing periods on comments), orwin (review agents now flag slop comments). | Comment only the why. Delete section banners. |

### Imagery

| Tell | Why it reads as AI | Fix |
|---|---|---|
| Abstract 3D blobs or rings floating in space | 925 guide, verbatim "abstract 3D blobs floating in space". | A real photo of the real event, or nothing. |
| No photos at all; gradients, shapes and Lottie in their place | Sikora #6. | At least one real photo of people, product or venue above the fold. |
| Synthetic stock people with "impossibly flawless skin" | Sikora #6, 925 ("a diverse group of people looking at a laptop in an impossibly well-lit office"). | Client's own photography. |
| Floating dashboard mockup in the hero | GDG. | Real screenshot or none. |
| Images at 0.85 opacity, photo "scrim" gradients everywhere | HN lampe3. | Full-opacity photos; one scrim only where text sits on a photo. |
| Placeholder images or wrong alt text left in | HN incompatible ("Dog with tail blowing in wind" on a cat). | Alt text written by a person who looked at the image. |

## Our four concepts against the list

Line numbers from the files as of commit `a2b98a4`. The `dir-pill` element in each file is the concept-switcher label for the review page, not part of the design, and is skipped.

All four share the client's own copy from the Phase 1 crawl, so the worst copy tells are inherited, not generated here. They still need fixing before anything ships: the "Global Youth Network (GYN) is an international organization dedicated to connecting and empowering young people worldwide" paragraph (A L970, B L563, C L902, D L1374), "A collaborative ecosystem of mentorship" (A L980, B L588, C L906, D L1383), "Empowering a new generation of leaders to navigate complexity with visionary foresight, unwavering integrity and measurable global impact" (A L984, B L593, C L907, D L1387), "Cultivating a global ecosystem ... to unlock innovative solutions" (A L988, B L598, C L908, D L1391), and "Esteemed Speakers" (A L1187, B L776, C L1009, D L1335). That paragraph alone hits empower, ecosystem, unlock, navigate, visionary and impact. All four also open with the same hero countdown block (A L910-919, B L545-553, C L861-882, D L917-922), which is a fifth template signal across the set rather than a published tell.

### A: a-earned-authority.html (1,914 lines)

- Eyebrow above hero H1: L902 `GYN Presents · SISM 2026`, mono, uppercase, tracked. Text not pill, so a half-hit on Krebs #10.
- Centre-dot dividers in hero meta: L906-910 (`<span class="meta-dot">·</span>` twice), and in every section eyebrow.
- Numbered section markers on all ten sections: L965 `01 · Who we are`, L1006 `02 · Focus Areas`, L1041, L1187, L1272, L1357, L1372, L1492, L1525, L1563 `10 · Join the Summit`. Krebs #13 plus HN "section numbering gives it away", with the centre-dot on top.
- Serif italic accent word: L904 `SDG <em>Innovation</em>`, L967 `<em>Driving impact.</em>`, L1274 `<em>world-class advisors.</em>`. Krebs #3 verbatim. Instrument Serif is also one of the three fonts Krebs names in #2.
- 15 `text-transform: uppercase` rules (L189, 201, 212, 225, 242, 302, 357, 375, 407, 451, 541, 570, 642, 696, 736), tracking .06em to .15em, sizes 10 to 11.5px. Krebs #16.
- Six identical service cards with same-length bodies: L977-998.
- Glass: L245 `backdrop-filter: blur(6px)`, L525 `rgba(255,255,255,.15)` + blur(6px). Two instances, both small.
- Copy: "Secure Your Seat" L930 and L1623; "world-class" L1274; 29 lines containing an em dash (some are in CSS comments; the hero meta uses an en dash correctly).
- Clean on: no purple, no hover lift, no stagger, no emoji, no per-element reveal (observer is on sections and hero only, L1869, L1894), hero is split with a photo not centred, gradient at L515 is navy-to-navy.

### B: b-amplified-youth.html (1,378 lines)

- The textbook hero pill: L532 `<div class="hero-eyebrow"><span class="dot"></span>Co-hosted with UNU Global Health</div>`, styled L141-147 as `rgba(255,255,255,.12)` + `backdrop-filter: blur(8px)` + 1px white border + `border-radius: var(--r-pill)` + uppercase .14em tracking + an orange dot. Krebs #10, #16 and #18 in one element.
- Centre-dot dividers in hero meta L536, L538; in H2 L618 `4 SDGs · 1 Sustainable Future`; in badges L716, L737; in speaker roles L782, L797, L817.
- Bento grid L578-610 (`.bento` is `repeat(3,1fr)` L194), cells L195-198 with 1px border + `--r-lg` + `hover translateY(-3px)` + `0 12px 32px` shadow. Six cells, same two-sentence bodies.
- Emoji as icons: L581 🌐, L586 🤝, L591 ⚡, L596 🌍, L601 💡, L606 📚, L667 🏆 in the grant badge, flag emoji in nav L489, L495, L510, L511 and in face overlays L841-869. Krebs #15, slop-UI #5.
- Hover lift on five component types: L110 nav-cta, L161 btn-primary, L198 bento-cell, L253 ticket-card, L360 video-card.
- `.reveal` fade-up (L463-464, 20px translate) on roughly forty elements including individual `<p>` and `<h2>` tags: L560, 567, 576, 577, 579-606, 617-619, 621-639, 656, 677-678, 681-755, 776-789, 826, 916, 989, 1021. This is the HN xavdid pattern exactly.
- Uppercase `.section-label` eyebrow above every H2: L561, 576, 617, 657, 677, 776, 826, 894, 916, 989, 1021. Nine uppercase rules total (L72, 145, 170, 225, 255, 352, 365, 413, 446).
- Four identical SDG cards L621-645; three-column grids at L194, L249, L356; speakers grid collapses to three at L287.
- Glass on four surfaces: L89-90 nav, L143 pill, L162 `.btn-ghost`, L434 modal.
- Dark-mode toggle L470 (`☀` button), not in the brief.
- Copy: "Six Ways We Create Impact" L577, "Choose Your Path" L678, "Voices Shaping SISM 2026" L777, "See It. Feel It." L917, "From Bangkok, with Energy" L990, "the journey continues in Kuala Lumpur, Malaysia — a vibrant hub of innovation" L564, "100+ young leaders" L583 and L659, "Learn More" L543, 22 lines with an em dash including the status banner L476 and ticket aria-labels L681-755.
- Clean on: fonts (Fraunces + Plus Jakarta Sans are not on any list), no purple, photo mosaic hero with real event photos, gradients at L139/305/351 are photo scrims.

### C: c-summit-stage.html (1,547 lines)

- Fonts L9: Geist, Geist Mono, Bricolage Grotesque. Geist is named in Krebs #2; Bricolage is the 925 guide's suggested replacement, which means it is now the second-order default.
- Permanent dark navy theme with mono grey labels (L45 overrides for `prefers-color-scheme: light`, so dark is the default). Krebs #5. Seven uppercase mono rules L287, 340, 416, 498, 523, 533, 696.
- Coloured left stripe on the SDG cards: L407-413 `.sdg-card::before { width: 4px; height: 100% }` coloured per SDG. Krebs #11, the "as reliable as em-dashes" one. Also `border-left: 2px solid` on the hero notice L346.
- Hero: eyebrow L854 `GYN Presents` above the H1, serif-style `<em>Malaysia</em>` accent L855, centre-dots L857 and L887 (`&middot;`), em dash in the notice L887.
- Abstract 3D ring behind the hero: WebGL torus L1447-1517 with a CSS conic-gradient fallback L232-258 spinning on an 80s loop (`ring-spin`). 925's "abstract 3D blobs floating in space". It is the one decorative asset in the hero where the other three concepts use event photos.
- Coloured glow shadows on buttons: L140 `0 4px 24px rgba(242,105,44,.35)`, L144 `rgba(197,32,53,.3)`. Krebs #8.
- Six identical `what-item` cards L905-910, four SDG cards L922-925, passes grid to `repeat(3,1fr)` L452.
- Stagger classes 25 times (`stagger-1..4` on L906-909, L923-925, L997, L1012-1035) and `.reveal` on every grid L904, 921, 992, 997, 1010, 1027, 1044, 1119, 1139 with `reveal-up` 18px L794-797.
- `&#9679; Open Now` dot badges L961, 969, 977; magnetic buttons L842, L885 (`btn-magnetic`).
- Glass on L160, L281, L773, L784.
- Copy: "Secure Your Seat" L842 and L885, "Secure Your Place at SISM 2026" L934, "4 SDGs · 1 Sustainable Future" L919, "See What Happens" L1064. Only two em dashes in the file, the best of the four.
- Clean on: no purple, no emoji, no bento, no hover lift except L571 and L593 (two).

### D: d-open-atlas.html (1,983 lines)

- Heaviest uppercase use of the four: 26 rules (L77, 82, 86, 91, 150, 203, 243, 252, 273, 301, 411, 422, 441, 459, 513, 543, 564, 592, 610, 620, 638, 652, 668, 723, 752, 791) with tracking up to .22em (L91, 592, 723, 752). The hero detail labels L896-908, the boarding-pass fields L1172-1289 and `CONFIRMED`/`OPEN` L1233, 1261, 1289 are all caps. Krebs #16, and the HN "all caps with letter-spacing ALWAYS" complaint. Some of it is the boarding-pass metaphor and earns its place; the section eyebrows do not.
- Numbered markers: `EDITION 02` L887, giant `01` L1037 and `02` L1140, objectives `01` to `06` L1412-1417. Edition numbers are real (two summits) so those pass; the objective numbers are decoration.
- Coloured top/left borders on cards: L437 `.chapter-card { border-top: 3px solid }`, L704 `.wwd-item { border-left: 3px solid }`, L232 `border-left: 3px solid`, L453 `border-left: 2px solid`. Krebs #11, four times.
- Eyebrow above every H2: L1026 `The GYN Journey`, L1155 `Participation Tiers`, L1327 `Exclusive Campus Visit`, L1335 `Esteemed Speakers`, L1372 `Who We Are`, L1410 `Our Objectives`.
- Six identical bordered objective boxes L1412-1417 and six `wwd-item` stripes L1378-1395; `.grid-3` helper L98.
- `.reveal` fade-up 20px (L795-797) on 11 blocks: L1050, 1092, 1111, 1310, 1322, 1337, 1350, 1411, 1430, 1450. Section-level, so milder than B.
- Flag emoji in the country list L999-1000 (`&#127474;&#127486;` etc.).
- Pulsing city markers on the map canvas L1708-1713. Tied to real data, so a judgement call.
- Dark-mode toggle L182.
- Copy: "Choose Your Journey to KUL" L1156, "The GYN Journey" L1026, "A Global Community" L983, "innovation ecosystem" L1329, "Exclusive Campus Visit" L1327, "Reserve Your Seat" L933, "Empowerment" L1412. One em dash in the file.
- Clean on: no gradients, no glass, no purple, fonts (Archivo + Source Serif 4) not on any list, one hover lift L492, real hero photo L932.

### Scorecard

Counting only tells that at least one source names, per file: A hits 7 (numbered sections, centre-dots, serif italic accent, Instrument Serif, all-caps labels, identical cards, em dashes). B hits 11 (hero glass pill, centre-dots, bento, emoji icons, hover lift everywhere, per-element fade-up, eyebrow on every H2, identical cards, glass x4, dark toggle, em dashes). C hits 9 (Geist, perma-dark, coloured card stripe, hero eyebrow, serif accent, 3D ring, coloured glows, stagger on everything, dot badges). D hits 7 (all-caps overload, numbered objectives, coloured stripes x4, eyebrow on every H2, identical boxes, flag emoji, dark toggle). On Krebs' scale all four are "high" (4+). B is the worst by count and by density; C's stripe-plus-glow-plus-Geist cluster is the most recognisable single combination.

## Rules for the next four concepts

1. `grep -ciE "indigo|violet|purple|fuchsia"` on each file returns 0.
2. `grep -c "linear-gradient\|radial-gradient\|conic-gradient"` is 0 except photo scrims, each one commented `/* scrim */`.
3. `grep -c "backdrop-filter"` is 0.
4. Fonts: none of Inter, Geist, Space Grotesk, Instrument Serif, Bricolage, JetBrains Mono, Playfair, Manrope, Poppins, DM Sans. Say in a comment at the `@import` why each face was picked.
5. Nothing sits between the top of the hero and the H1. No eyebrow, no pill, no "GYN Presents".
6. `text-transform: uppercase` appears at most 3 times per file.
7. No section number markers (`01 ·`, `01/`) unless the number is a real sequence the visitor follows (programme days, editions).
8. No `border-left` or `border-top` wider than 1px on any card.
9. No grid of more than two items that are the same size with the same text length. Six services become a list or a paragraph.
10. No emoji anywhere, including flags.
11. `.reveal`/IntersectionObserver fade-ups: zero, or sections only, never `<p>`, `<h2>`, labels or cards.
12. `:hover { transform: translateY(` only on `<a>` and `<button>`.
13. `grep -c "—"` in visible text is 0. `·` as a divider is 0.
14. Banned words in copy: empower, elevate, unlock, seamless, ecosystem, journey, world-class, esteemed, vibrant, innovative (noun form "innovation" is in the summit name and stays). CTAs name the action and the price.
15. Hero has one real photograph at full opacity. No 3D objects, no rings, no blobs.

## Sources

1. Adrian Krebs, "Scoring Show HN submissions for AI design patterns", 20 Apr 2026. https://www.adriankrebs.ch/blog/design-slop/
2. GIGAZINE summary of Krebs with per-pattern percentages, 23 Apr 2026. https://gigazine.net/gsc_news/en/20260423-design-slop/
3. DevelopersDigest, "AI Design Slop: 16 Patterns That Mark a Site as Vibe-Coded", Apr 2026. https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it
4. "10 Tells of a Slop UI", 27 Sep 2026. https://godobject.dev/blog/10-tells-of-slop (original URL hereticpleb.vercel.app redirects here)
5. HN discussion of (4), 207 points, 152 comments. https://news.ycombinator.com/item?id=49867038
6. Kosta Canatselis, "Spot the Slop: A UI Designer's Guide to Fixing AI Defaults", 23 Jul 2026. https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c
7. Alan West, "Why Every AI-Built Website Looks the Same (Blame Tailwind's Indigo-500)", DEV. https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p
8. Mfonobong Umondia for GDG, "Why AI Websites All Look the Same and How to Build Something Different", DEV. https://dev.to/gdg/why-ai-websites-all-look-the-same-and-how-to-build-something-different-1gan
9. Laith Aljunaidy, "Everything built with shadcn/ui looks the same", 29 May 2026. https://uxskill.laithjunaidy.com/blog/shadcn-ui-looks-generic.html
10. Anthropic, "Improving frontend design through Skills", 12 Nov 2025. https://claude.com/resources/articles/improving-frontend-design-through-skills
11. 925studios, "AI Slop Fonts and Gradients: The Tells That Give Away AI Design". https://www.925studios.co/blog/ai-slop-design-tells and the longer guide https://www.925studios.co/blog/ai-slop-web-design-guide
12. Mateusz Sikora, "Top 10 Signs a Website Was Built by AI", 25 Jul 2026. https://sikora.software/blog/ai-website-design
13. Pangram, "9 Signs of AI Writing, Backed by Data". https://www.pangram.com/signs-of-ai-writing
14. Maryan Pelland, "Writing that Smacks of Bot", 23 Apr 2025. https://pen2profit.substack.com/p/writing-that-smacks-of-bot-is-that
15. HN, "Every vibe-coded website is the same page with different words. So I made that". https://news.ycombinator.com/item?id=45622944 and "Are we in the era of AI slop landing pages?" https://news.ycombinator.com/item?id=49024805

Not fetched: uxplanet.org "How To Spot AI-Generated Design" returned 403. The vibecodekit.dev page failed twice on socket errors. Neither is cited above.
