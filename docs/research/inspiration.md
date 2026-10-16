# Inspiration research: Apple, Peter Tarka, Zhenya Rynzhuk

For the GYN site redesign (SDG Innovation Summit Malaysia, 19 to 22 Nov 2026, Kuala Lumpur, co-hosted by UNU Global Health). The owner asked to blend Apple's product-page approach, Peter Tarka's 3D, and Zhenya Rynzhuk's art direction, and the client wants the result to beat echochange.org.

Short version: Apple gives us the pacing and the restraint (one idea per screen, a strict type scale, motion that switches off). Tarka gives us the object: soft, saturated, studio-lit 3D that reads as a "product shot" for an event that has no product. Rynzhuk gives us the editorial energy: poster-scale type, mixed roman and italic, grids you can see. Section 4 says where each one is in charge and what breaks if we mix them carelessly.

## How this was gathered

- Apple pages measured on 16 Oct 2026 with Python Playwright (headless Chromium, 1440x900 at DPR 1, plus 390x844 mobile): iPhone 18 Pro, MacBook Air, MacBook Pro, AirPods Pro 3, Apple Watch Series 12, Environment. The script scrolled each page in small steps, then read computed styles (font size, weight, line height, letter spacing), counted sticky elements, canvases, videos and their attributes, `prefers-reduced-motion` rules, and logged network requests. Byte counts come from `content-length` headers, so streamed media is under-counted. Safari gets different assets from Apple, so treat the numbers as Chromium numbers.
- Apple HIG text pulled from the HIG JSON behind developer.apple.com (Typography, Motion, Accessibility).
- Tarka and Rynzhuk: their own sites, Behance, Dribbble, Awwwards pages, and the interviews and features cited inline. Their live sites were also measured with Playwright (fonts, sizes, canvas use).
- Screenshots are in `docs/research/inspiration/` (26 WebP files, about 1.1 MB). They are for internal study only. We do not reuse any of the Tarka or Rynzhuk images, or Apple's.

Anything described as "observed" is my reading of the screenshots, not a claim from the artist.

---

## 1. Apple

### 1.1 Hero composition: one object, one line

| Page | H1 (small, product name) | Big line | Hero image |
|---|---|---|---|
| iPhone 18 Pro | "iPhone 18 Pro", 32px/600 | "Pro further.", 80px/600, line height 84px, tracking -1.2px | The word PRO built as a 3D object in the phone's finish, on black (`apple-01-iphone-hero.webp`) |
| MacBook Air | "MacBook Air", 28px/600 | "Might takes flight.", 64px/600 | The laptop, open, floating on white |
| AirPods Pro 3 | "AirPods Pro 3", 28px/600 | "The world's best in-ear Active Noise Cancellation.", 64px/600 | A dancer in silhouette, full bleed |
| Apple Watch Series 12 | product name as logo lockup | "A work of heart.", 80px/600 | Macro of the green heart-rate sensor |
| Environment | none above it | "Our planet deserves our best thinking.", 48px/600 | Apple 2030 lockup over a forest video, with a pause button |

The pattern is the same every time. The `<h1>` is the product name, set small. The big line is two to six words and is a claim, not a description. Text sits bottom left (desktop) or top centre (mobile). There is one CTA, a small blue "Buy" pill. Nothing else competes in the first screen.

Note for GYN: our taste rules (`docs/concept-brief-r2.md`, rule 3) ban anything above the hero H1. Apple's small-name-above-big-line is the thing that rule bans, so on the hero we take only the "one object, one line" part and let the event name and dates sit under the headline. The eyebrow pattern is fine further down the page.

### 1.2 Typographic scale (measured, desktop 1440)

All headlines are SF Pro Display at weight 600. Body text is SF Pro Text at 400. Weight barely moves; size does all the work.

| Size / line height | Tracking | Tracking in em | Used for |
|---|---|---|---|
| 96 / 100 | -1.44px | -0.015 | "Most wanted.", "The best thing you've never heard." (type lockups that own a whole screen) |
| 80 / 84 | -1.2px | -0.015 | Hero lines, section headlines ("Built to go places.") |
| 64 / 68 | -0.576px | -0.009 | Secondary lockups ("Variable aperture. If you know, you pro.") |
| 56 / 60 | -0.28px | -0.005 | Section headers ("Worth the upgrade? You bet.") |
| 48 / 52 | -0.144px | -0.003 | "Get the highlights.", stat values ("48MP") |
| 40 / 44 | normal | 0 | Stat values |
| 32 / 36 | +0.128px | +0.004 | Eyebrow on the hero, banner headlines |
| 28 / 32 | +0.196px | +0.007 | Section eyebrows, card headlines |
| 24 / 28 | +0.216px | +0.009 | Section labels ("Design"), small subheads |
| 21 / 25 | +0.231px | +0.011 | Intro copy |
| 17 / 21 | -0.374px | -0.022 | Body (SF Pro Text) |

Things worth copying:

- Tracking goes negative as size goes up (-0.015em at 80px and above) and slightly positive between 21 and 32px. That one rule is most of the "Apple headline" look.
- Display line height is 1.04 to 1.07. Two-line headlines are stacked tight.
- One weight (600) for every headline. The only exceptions I found were 800 on one MacBook Air line ("Yep, Mac does that.") and 500 on one Environment intro.
- On mobile (390 wide) the scale roughly halves: 80 and 96px lines become 40/44, 48px section headers become 32/36, the hero eyebrow goes from 32 to 24px, and tracking goes to normal.

The HIG backs this: "Minimize the number of typefaces you use, even in a highly customized interface," and "In general, avoid light font weights... prefer Regular, Medium, Semibold, or Bold." Minimum on iOS is 11pt, default body 17pt ([HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography)).

### 1.3 Eyebrow + headline + subhead

The rhythm on every section:

1. Eyebrow: 24 to 28px, weight 600, often grey ("Intelligent noise control", "Design", "Performance").
2. Headline: 56 to 96px, the claim ("The best thing you've never heard.").
3. Subhead or body: 17 to 21px, max about 560 to 700px wide, centred under the headline.

The body copy has a trick worth stealing. On iPhone 18 Pro the paragraph under "Most wanted." is grey, and a few phrases inside it are white and bold ("purpose-built for unprecedented performance", "handle even the most intensive AI workloads"). You can read only the bold parts and still get the point (`apple-02-iphone-type-lockup.webp`). Same on mobile (`apple-11-mobile-iphone-environment.webp`, second panel).

Stats follow their own small rhythm: "Up to" (small, grey) / "22 more hours" (40 to 48px) / one line of caption.

### 1.4 Scroll-driven storytelling

What the pages do now (Oct 2026), measured:

| Page | `position: sticky` elements | `<canvas>` | `<video>` |
|---|---|---|---|
| iPhone 18 Pro | 19 (21 on mobile) | 1, WebGL product viewer | 13 |
| MacBook Pro | 20 | 0 | 14 |
| Apple Watch Series 12 | 16 | 0 | 7 |
| AirPods Pro 3 | 12 | 0 | 15 |
| MacBook Air | 5 | 0 | 7 |
| Environment | 4 | 0 | 7 |

- **Pinned scenes.** Videos sit in containers named `video-element-stack pin-center`: the video is pinned while you scroll past it, so the text moves and the picture stays. Pages are long: 29,000 to 42,000px on desktop (14,000 for Environment).
- **Video with start and end frames.** Every inline video I checked is `muted playsinline preload="none"`, with no `autoplay` and no `poster` attribute. Instead the page loads two stills per clip, named like `hero_startframe__…_large.png` and `hero_endframe__…_large.png` (MacBook Air), `solar_startframe` / `solar_endframe` (Environment). Script shows the start frame, plays the clip when it scrolls into view, and leaves the end frame on screen. The video file (`large.mp4`, one `large.webm`) is only fetched when needed.
- **WebGL product viewer.** iPhone 18 Pro has one full-viewport canvas inside `product-viewer-enhanced-container product-viewer-canvas`. It streamed about 100 `.ktx` files (GPU-compressed textures) through `fetch`, roughly 16.8 MB on desktop and 7.2 MB on mobile.
- **Image-sequence scrubbing** (frames drawn to a canvas by scroll position) is the technique Apple made famous on the 2019 AirPods Pro page ([CSS-Tricks write-up](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/)). None of the six pages I measured uses it now; they use pinned video and the WebGL viewer instead. For GYN the 48-frame `wheel-assemble` sequence is still the right tool, because 48 small WebP frames are cheaper than WebGL.
- **Type that owns the screen.** The 96px lockups ("Most wanted.", "Heartcore innovation.") sit alone on black for a full screen before the product image scrolls in. That pause is the "reveal".

### 1.5 Bento and tiles

- MacBook Air "Here's what you get" (`apple-07-macbook-air-bento.webp`): white tiles on `#F5F5F7`, corner radius 28px, two columns of unequal height. Each tile has one claim and one picture or icon. Copy is centred, around 21px.
- Across MacBook Air, 29 white and 16 `#F5F5F7` blocks wider than 250px use exactly 28px radius. One radius, everywhere.
- Environment stat tiles (`apple-10-environment-stat-tiles.webp`): three tall tiles in deep blue, near-black and deep green, each with one number ("43%", "50%") or one phrase ("All in on aluminum.") and an outline icon in the accent green.
- Content width: main grid 980px, wide content 1260px.

### 1.6 Pacing, whitespace, colour

- Section padding: 144px top on iPhone, Watch, MacBook Pro and Environment; 160px on AirPods. On mobile 112px.
- Section backgrounds rotate between four neutrals only: `#000000`, `#1D1D1F`, `#F5F5F7`, `#FFFFFF`. Dark pages (iPhone, Watch, MacBook Pro) end on light for the buying and comparison part.
- One accent per page or section. Environment uses a single green, `rgb(0, 217, 89)` = `#00D959`, on five elements: the marker highlight behind "Designed, sourced,", "Packaging and shipping", "Use. Recover.", the report pill, and icon strokes (`apple-09-environment-highlight.webp`). Everything else is black, white and photography.
- Gradient text exists but is rationed: one per page. AirPods uses `.headline-gradient`, a horizontal sweep of muted colours (rgb 203,156,145 to 111,160,197) clipped to text; iPhone uses a teal-to-blue gradient on "Welcome to the mother chip." (`apple-03-iphone-gradient-headline.webp`).

### 1.7 Mobile

- Headline moves from bottom left to top centre over the hero media (`apple-11-mobile-iphone-environment.webp`).
- A floating local nav pill (product name, "Explore", blue "Buy") stays at the top while scrolling.
- Stats stack vertically, one per row, left aligned.
- More sticky elements on mobile than desktop on iPhone (21 vs 19), so pinning is not desktop-only.
- CSS breakpoints seen: 1441px, 1068px, 834/833px, 734px, 640px, 480px.
- Mobile downloads less: iPhone page images 2.8 MB vs 7.0 MB desktop, media 5.6 MB vs 13.9 MB.

### 1.8 Accessibility and reduced motion

- Every video and animation has a visible play or pause button with a specific label: "Pause 2030 animation", "Play animation of m5 chip", "Play Center Stage video".
- CSS has `prefers-reduced-motion` blocks (6 rules on most pages, 33 on MacBook Pro, 40 on MacBook Air) that stop ribbon animations and remove crossfades.
- With `prefers-reduced-motion: reduce` emulated, iPhone 18 Pro made 3 `fetch` requests instead of 110, loaded 1 media file instead of 16, and created no WebGL canvas. Reduced motion does not just slow the page down; it skips the heavy 3D entirely.
- The HIG lines this follows: "Add motion purposefully, supporting the experience without overshadowing it." "Make motion optional." "Let people cancel motion." ([HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion)). And: "Avoid autoplaying audio and video content without also providing controls to start and stop it." "Be cautious with fast-moving and blinking animations." ([HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).

### 1.9 Performance tricks

- Almost every image is in a `<picture>` (186 of 188 on iPhone). File names carry a size suffix (`_large`), and the mobile run fetched smaller files.
- No image uses native `loading="lazy"` (0 on every page), yet request counts grow as you scroll, so loading is handled by their own script.
- Video: `preload="none"` plus start and end stills, as above.
- 3D: compressed GPU textures (`.ktx`) streamed only when the viewer is used, and not at all under reduced motion.
- Fonts are not small: 0.6 to 1.3 MB of SF Pro per page. Apple can afford that; we should not (see section 4).

### 1.10 Apple principles for GYN

1. **One idea per screen.** Each section gets one claim. "4 days. 1 city. Your idea on stage." is a screen; a paragraph about the programme is not.
2. **Let the 3D object be the product shot.** The summit has no device to photograph. The SDG wheel render (or the glass globe) plays the role of the iPhone in the hero: one object, centred, lit like a product.
3. **Short claim, small label.** Headlines are 2 to 6 words. Facts (dates, venue, UNU co-host) go in the subhead or a stat row, not the headline.
4. **One headline weight, tracking that tightens with size.** Pick one display weight and apply about -0.015em at 64px and above, normal at 32px, slightly positive below that.
5. **Grey body with bold highlights.** In long client paragraphs, set the text in a muted ink and make the 2 or 3 phrases that matter full-strength. Skimmers get the summary; nobody has to rewrite the client's copy.
6. **One accent per section.** Apple Environment uses one green. Our version: each section takes one SDG colour (SDG 4 `#C5192D`, 5 `#FF3A21`, 9 `#FD6925`, 13 `#3F7E44`) and everything else stays navy, paper and photography.
7. **Pin the picture, move the words.** Use `position: sticky` for the render or photo, let text scroll past it. Cheaper and calmer than animating everything.
8. **Video starts as a still.** `preload="none"`, a start frame on screen, play in view, pause out of view, a visible pause button with a real label.
9. **Reduced motion means the light version, not the slow version.** Under `prefers-reduced-motion`, skip the video and frame sequence downloads entirely and show the poster.
10. **Generous, regular spacing.** About 144px between sections on desktop and 112px on mobile, the same value every time, one corner radius for every tile.

---

## 2. Peter Tarka

### 2.1 Who he is

- London-based art director and 3D artist, originally from Warsaw ([Design You Trust, Sep 2026](https://designyoutrust.com/2026/09/peter-tarka-turns-simple-3d-shapes-into-playful-polished-worlds-that-make-global-brands-feel-impossible-to-ignore/)). His site calls itself "London Based Art Direction & 3D Studio" ([petertarka.com](https://petertarka.com/)). Behance lists the company as Grate Studio Limited ([behance.net/trk](https://www.behance.net/trk)). Represented by H+ Creative, Los Angeles (site footer).
- Client list on his site, with years: Green Mountain Energy (2022), Spotify (2022), Apple (2020, confidential), Google I/O 2019, Harrahs Casino, LUMI, Nike (2020, confidential), Yoox, All Nippon Airways, Electronic Arts, Formant, Directus, Land Rover, Molton Brown, LG Signature. Behance adds Audi, Microsoft, Samsung, Breitling, BMW, Adobe, Airbnb. Abduzeedo's 2021 spotlight adds AT&T, Pinterest, Verizon, Qualcomm and Fortune ([Abduzeedo, Oct 2021](https://abduzeedo.com/node/85796)). I found no Facebook/Meta or Dropbox credit in his own lists.
- Awards on his Behance profile: Cannes Lions 2018 Silver (Art Direction) and Bronze (Use of Social Platforms), ADC 2019 Bronze Cube, Adweek Top 100 Talents 2012 and 2013.
- 175,645 Behance followers and 5.3M project views at the time of capture; 51,447 Dribbble followers ([dribbble.com/tarka](https://dribbble.com/tarka)).

### 2.2 Tools and process

- Cinema 4D for modelling, rendered in Octane. Stated on Product Renders 2024, Playful Illustrations 21 to 22, and Product Explorations 2025/2026 ("All work done in Cinema 4D and renderd in Octane"). Forms + Shapes (120 works, 2016 to 2021) says "Rendered with Octane or VRay" ([Behance](https://www.behance.net/gallery/139059881/Forms-Shapes)); a 2023 Abduzeedo post says "Octane or Redshift" ([Abduzeedo, Jan 2023](https://abduzeedo.com/node/87693)).
- Behance lists Photoshop, Illustrator and After Effects as his Adobe tools, so finishing and motion happen there.
- From the indexed excerpt of the Medium interview (the page itself is behind a bot check): he moved from simple 3D in Illustrator to Cinema 4D, calls himself a "really horrible drawer" so he always starts in 3D, and colours and textures usually come last ([Medium interview](https://xientce.medium.com/interviewing-idols-peter-tarka-c6470bc21197)). I could not read the full text, so I'm not quoting more.
- Recent personal work is product design practice: "A selection of personal works I did to train Product Design and Product Renders" (Product Explorations 2025/2026, [Behance](https://www.behance.net/gallery/243772723/Product-Explorations-2026)).

### 2.3 Visual language (observed)

**Forms.** Primitives with every edge rounded: spheres, constant-radius tubes that loop and knot, rings, arches, rounded slabs, stacked discs, plus thin ribbons that fan out (`tarka-02-playful-illustrations.webp`). Two other modes: miniature dioramas (Spotify holiday sets, the App Store landscape in `tarka-04-apple-app-store.webp`, the Verizon city in `tarka-05-verizon-city.webp`), and reinterpreted products (coffee machine, watches, bike helmets, a bicycle in 2026). Characters are rare: the Spotify pack has a few simple figures, but most work has no faces. Abduzeedo compared the feel to Nintendo games.

**Materials.** Mostly satin plastic: low gloss with one broad, soft highlight, not mirror reflections. Matte clay-like surfaces for terrain and fills. Frosted or clear glass used as a container (snow globe in Spotify, glass domes). Small real-world textures as accents: wood planks, speckled terrazzo, perforated metal, rubber. Chrome is rare outside the product renders. Subsurface shows as a slight glow at the thin edges of light-coloured shapes.

**Lighting.** One large soft key from above and slightly in front, very soft contact shadows, weak fill, little or no rim. Shadows are never black: they take the backdrop colour. The background is a single-colour cove with no visible horizon, so the only "gradient" is the light falloff across it.

**Colour.** Two families. (a) Warm pastel and earth: beige, peach, sage, dusty pink, with one saturated hit (App Store art, Forms + Shapes). (b) Saturated: crimson, coral, mint, yellow, cobalt, pink, often on a mid grey (about `#D0D0D0`) backdrop (Playful, Spotify, Product Explorations 2026). Usually 4 to 6 hues per image, one dominant, and the backdrop colour shows up again on at least one object. Violet and blue-violet are frequent in his recent work.

**Composition.** One centred hero object or one tight cluster, with a lot of empty backdrop around it. Dioramas use a raised camera (roughly 30 degrees down) and a long lens, so they read almost isometric. Products use a low three-quarter angle. Scale is ambiguous on purpose: a truck the size of a pumpkin.

### 2.4 How brands use his work

- **Spotify Premium:** a global gift card asset pack with "over 20 unique key visuals" for holidays worldwide (Lunar New Year, Ramadan, Christmas, Mother's Day and more), plus social and ad layouts and card designs. Art direction and illustration by Tarka, animation by Amazing Monkeys, production by H+ Creative ([Behance](https://www.behance.net/gallery/126904701/Spotify-Premium-Campaign), `tarka-03-spotify-premium.webp`). This is the closest model for GYN: one visual system, many variants for many occasions.
- **Google I/O 2019 with Novel:** five AR experiences for ARCore's developer release, including a shared AR garden built on Cloud Anchors ([Behance](https://www.behance.net/gallery/90905561/Google-IO-2019), `tarka-06-google-io.webp`). The I/O 19 logo was built from glossy primitives.
- **Apple App Store:** "Best of October & November" editorial art, shown on the Korean storefront in his presentation ([Behance](https://www.behance.net/gallery/73287429/Apple-Best-of-October-November)).
- **Verizon** (with Wieden + Kennedy and Six & Five): "A better network as explained by a city", a miniature city explaining network coverage by district ([Behance](https://www.behance.net/gallery/32416583/Verizon-A-better-network-as-explained-by-a-city)).
- Also McKinsey "The future of mobility", Microsoft SharePoint, LG Signature, Nike Air Max Zero, Audi.

In product marketing his renders work the way Apple's product photos do: a single still or short loop as the hero of a section, on a plain colour field, with type next to it rather than on top of it.

### 2.5 Tarka-style art direction for GYN (Blender brief)

Written for whoever extends `design/blender/` (Blender 5.2, helpers in `design/blender/common.py`). Existing renders: `wheel-bloom`, `ribbons`, `glass-globe`, `sticker-pile`, `wheel-assemble` (48 frames). The brief keeps those and adds a set.

**Objects (one hero object per render):**

| Object | Idea | Notes |
|---|---|---|
| SDG wheel | 17 rounded wedges, each a soft slab with small bevels, in the 17 official colours, slight gaps between | The brand object. Hero and loader. Already exists; move its materials to the values below |
| Globe | Frosted glass sphere, continents as raised satin shapes | Already exists (`glass-globe`) |
| Four hands | Simplified, mitten-like hands (no nails, no knuckles), one per logo colour, holding the wheel up from below | Echoes the GYN logo. Keep them stylised; realistic hands look wrong at this level of abstraction |
| SDG 4 Education | A short stack of rounded books, the top one open with pages fanning into a small staircase | `#C5192D` |
| SDG 5 Gender equality | A balanced seesaw with two equal spheres, or two equal rounded bars forming "=" | `#FF3A21`. Balance reads better than gender symbols in 3D |
| SDG 9 Innovation | Three interlocking rounded gears, or a small arched bridge built from rounded blocks | `#FD6925` |
| SDG 13 Climate | Half a globe with a leaf growing out of it, or a wind turbine with soft blades | `#3F7E44` |
| Kuala Lumpur | A simplified skyline token (two pill-shaped towers), used once, small, in the venue section | Keep it generic and soft; no detailed landmark model |

**Materials (Principled BSDF, Blender 4.x/5.x input names):**

| Material | Base Color | Roughness | Coat Weight / Coat Roughness | Subsurface Weight | Sheen | Other |
|---|---|---|---|---|---|---|
| Satin plastic (main) | object hex | 0.38 | 0.3 / 0.15 | 0.08, Radius (1.0, 0.4, 0.2), Scale 0.05 | 0 | Specular IOR Level 0.5 |
| Candy gloss (accents only) | object hex | 0.32 | 0.85 / 0.04 | 0.12 | 0 | Same as `glossy()` in `common.py` |
| Matte clay (terrain, hands) | object hex | 0.62 | 0 | 0.25 | 0.25, Sheen Roughness 0.5 | Specular IOR Level 0.35. Same as `clay()` |
| Frosted glass (globe, domes) | `#F4F6FA` | 0.22 | 0 | 0 | 0 | Transmission Weight 1.0, IOR 1.45 |
| Brushed metal (tiny details) | `#C9CED6` | 0.3 | 0 | 0 | 0 | Metallic 1.0, use sparingly |
| Backdrop cove | section colour | 0.8 | 0 | 0 | 0 | Curved plane, no visible horizon |

**Light setup:**

- Key: area light, disk, 3 to 4m across, front-left, about 45 degrees up, 4m from the subject. Start near 600W and tune by eye. This one light does most of the work.
- Fill: large area light (5m) on the opposite side at about 25% of the key.
- Top: soft box straight above at about 30% of the key, for the soft highlight across the tops of shapes.
- Rim: optional, 10 to 15% of the key, only when a shape merges into the backdrop.
- World: the backdrop colour at strength 0.3 to 0.5, so shadows pick up the hue instead of going grey.
- Keep the `Khronos PBR Neutral` view transform already in `common.py`, so base colours stay close to their hex values. This matters for the SDG colours.
- Engine: EEVEE with ray tracing (as now) for loops, Cycles at 256 samples with denoising for hero stills.

**Palette (hex):**

- Backdrops: paper `#F4F1EA`, navy-900 `#0E1530` for dark sections, or one SDG colour per render.
- Objects: logo colours navy `#202F60`, crimson `#C52035`, flame `#EF3F2D`, ember `#F2692C`, leaf `#48783F`; focus SDGs `#C5192D`, `#FF3A21`, `#FD6925`, `#3F7E44`; supporting SDG 7 yellow `#FCC30B`, SDG 6 cyan `#26BDE2`, SDG 14 blue `#0A97D9`. The four logo hand colours sit almost on top of the four focus SDG colours (noted in `design/palette.md`), so this palette is ours, not his.
- Rule: one dominant hue per render, the backdrop colour repeated on one object, at most 5 hues in frame.

**Camera:**

- Single objects: 85mm, three-quarter view, camera slightly below centre looking up 5 to 10 degrees so the object feels big. Matches the `camera(lens=85)` default.
- Groups and dioramas: 100 to 135mm, about 30 degrees down, close to orthographic.
- Depth of field off or very shallow (about f/8). His work is sharp front to back.
- Leave 30 to 40% empty backdrop so type can sit beside the object.

**What to avoid, so it is inspired by his work and not a copy of it:**

- Don't recreate any of his scenes: no snow globes with trees, no holiday dioramas, no isometric cities, no tube knots on grey, no TRK-style product reinterpretations.
- No purple or violet. That is our own rule, and violet is common in his recent work, so it also separates us from him.
- Don't use his images as reference boards for image generation or as texture sources. Brief the artist with this text and our palette, not his pictures.
- No mascots or faces. Our people are real GYN delegates in photos; the 3D stays abstract.
- Every object carries meaning (four SDGs, the wheel, the hands from the logo). If an object has no tie to GYN, cut it, however nice it looks.

---

## 3. Zhenya Rynzhuk

### 3.1 Who she is

- Art director and visual designer. Behance: "Art director/visual designer, co-founder at Synchronized.studio, Awwwards and The Webby Awards judge", also listing Sochnik Design Thinking School, based in New York ([behance.net/Zhenyary](https://www.behance.net/Zhenyary)). Dribbble: "Art Director/Partner at Synchronized", about 201,000 followers ([dribbble.com/zhenyary](https://dribbble.com/zhenyary)).
- Background: finished art school as a teenager, graduated from an architecture university and worked as an architect before moving to digital design more than ten years ago. Described there as "a Webby winner as well as a 2x Independent of the year on Awwwards". Proudest work: projects with a social or cultural angle, naming Railroad Ladies and the Covid Art Museum; the school she co-founded teaches digital and graphic design to Ukrainian students ([Lovers Magazine interview](https://spaces.is/loversmagazine/interviews/zhenya-rynzhuk)).
- Inspiration, from the same interview: she avoids literal inspiration from her own industry and looks to travel, nature and architecture, naming Fujiko Nakaya's fog sculptures.
- Awwwards: Site of the Day for 15 projects between Jan 2019 and Sep 2022, most also with a Developer Award ([awwwards.com/zhenyary](https://www.awwwards.com/zhenyary/)). The profile card for Synchronized Studio carries a "Site of the Year 2020" tag; I could not open the 2020 annual awards page to confirm which category, and secondary sources point to Mobile of the Year. A LinkedIn post from Synchronized mentions their "6th Site of the Day and Dev Award this year" in 2022 ([LinkedIn](https://lk.linkedin.com/posts/zhenya-rynzhuk-b4040765_here-at-synchronized-studio-we-are-thrilled-activity-6981215426001166336-CCvD)).
- Client work on Behance includes GV (Google Ventures), IBM Research, Synchrodogs, Playful.

### 3.2 Signature (measured on the live sites)

**Layout.** Editorial and architectural. Visible grid lines (1px rules between cells), content placed in columns with big empty cells left alone, single letters spread across a whole row ("U  R  L" on Railroad Ladies). Images are small and precise inside a large typographic layout, the opposite of full-bleed photo heroes. On her 2019 folio, her name is split around a portrait: "Zhenya [photo] Rynzhuk" (`rynzhuk-01-folio-services.webp` shows the services page from the same site).

**Typography.** Poster sizes, measured at 1440 wide:

| Site | Faces | Largest size | Notes |
|---|---|---|---|
| Zhenya Rynzhuk Folio 2019 | Schnyder L 600 (roman and italic), GT Walsheim 300/400 | 158px (sans), 120px (serif) | Roman and italic mixed in one line: "Let's make *something* great!" Services listed as a poster: "Art direction * *Product design* / *Visual design* Mobile & web design" |
| Ukrainian Railroad Ladies | Garnett (all caps), GraphikLCG for Cyrillic | 150px | "UKRAINIAN / RAILROAD / LADIES" with the red book cover set between the lines; index row "LADIES (Ж) MEN (Ч) STILL (Н)" with Cyrillic letters as superscripts |
| Synchronized Studio | Four custom-named faces (condensed serif caps, italic, sans) | 259px ("Awards") | Service list set on a circle, alternating roman and italic caps (`rynzhuk-06-synchronized-services.webp`) |
| Visual Creatures | GT America Condensed Black, Staff | 564px | Project titles as huge centred caps ("LOVE, DEATH AND ROBOTS SUITS") with a tiny italic "for" before the client name |

The moves repeat: a serif and a sans (or condensed and regular) in the same headline, italics used for one word to change the voice, tight leading on caps, and scale jumps of 10x between the biggest and smallest type on one screen (564px titles next to 11px nav on Visual Creatures).

**Motion.** Awwwards tags for her sites: Parallax, Scrolling, Transitions, Microinteractions, GSAP, and on Synchronized, WebGL and PixiJS. Synchronized had one WebGL canvas on load. Railroad Ladies lists a "Hover letter interaction" and an animated navigation. Visual Creatures has an animated menu and a project gallery where the next title waits, ghosted, under the current one. Most of the motion is type moving and images being revealed, not 3D.

**Colour.** Very few colours. Awwwards palettes: Synchronized `#000`, `#9C9C9C`, `#FFF`. Railroad Ladies `#000`, `#FFF`, `#ECD06F` (plus blue and yellow cards echoing the Ukrainian flag). Folio 2019 `#FF9398`, `#D14836`, `#FFF` on a warm grey background (measured `#DBD5C9`). Visual Creatures `#000`, `#FF9398`, `#9C9C9C`. One warm accent on neutrals, almost every time.

**Image treatment.** Documentary photography, cropped small and placed in grid cells, with plenty of space around it. Cutouts of people over colour blocks (the folio). Photos never carry text on top; type sits beside them.

### 3.3 Award-winning projects and what scored

Awwwards jury averages (Design 40%, Usability 30%, Creativity 20%, Content 10%):

| Project | SOTD date | Score | Design | Usability | Creativity | Content |
|---|---|---|---|---|---|---|
| Synchronized Studio ([page](https://www.awwwards.com/sites/synchronized-studio)) | 29 Jul 2020 | 7.95 | 8.24 | 7.5 | not captured | not captured |
| Zhenya Rynzhuk Folio 2019 ([page](https://www.awwwards.com/sites/zhenya-rynzhuk-folio-2019)) | 1 Oct 2019 | 7.84 | 8.06 | 7.37 | 7.98 | 8.11 |
| Kati Forner Folio ([page](https://www.awwwards.com/sites/kati-forner-folio-website)) | 6 May 2020 | 7.68 | 7.91 | 7.39 | 7.55 | 7.94 |
| Visual Creatures Folio ([page](https://www.awwwards.com/sites/visual-creatures-folio)) | 28 Sep 2022 | 7.60 | 7.79 | 7.19 | 7.80 | 7.68 |
| Ukrainian Railroad Ladies ([page](https://www.awwwards.com/sites/ukrainian-railroad-ladies)) | 15 Sep 2020 | 7.59 | 7.76 | 7.13 | 7.85 | 7.72 |

What made them win, going by the scores and the Awwwards element clips:

- **Synchronized:** the studio's own site, dark, with WebGL transitions and a draggable project navigation ("Projects navigation drag" is one of the featured elements). Highest design score of the set.
- **Railroad Ladies:** a book promo for a photo series by Sasha Maslov about women who staff railroad crossing houses in Ukraine. It wins on content and creativity: the type carries the story ("IT'S OFTEN HARD TO SEE THE LIGHTHOUSE." on black, `rynzhuk-05-railroad-ladies-statement.webp`), the photos are an index you browse, and the hover letter interaction plays with the Cyrillic labels (`rynzhuk-03-railroad-ladies-hero.webp`, `rynzhuk-04-railroad-ladies-index.webp`).
- **Folio 2019:** content scored highest (8.11). The work list reads like a magazine contents page, and the contact page is one huge line with an italic word in it (`rynzhuk-02-folio-contact.webp`).
- **Visual Creatures:** condensed black caps at extreme size, with a three-panel menu (ANIM / VFX / VIZ LAB) that works as the homepage (`rynzhuk-07-visual-creatures.webp`).

One pattern in the numbers: usability is the lowest score on every one of them, by 0.5 to 0.8 points. The editorial moves cost some clarity, and the jury noticed. For a site whose job is applications and ticket sales, that is the part we should not copy.

### 3.4 Rynzhuk-style moves for GYN

1. **Roman and italic in one headline.** Set the display headline in one face and switch one word to italic (or to the serif) to change the voice: "Your idea, *on stage* in Kuala Lumpur." One word per headline, never more.
2. **A services-list poster.** Turn the "what we do" items into one typographic block, items separated by small marks and alternating roman and italic, instead of six identical cards. This also satisfies taste rule 6 in `docs/concept-brief-r2.md`.
3. **Visible grid for the programme.** Show the four summit days as a table with 1px rules, day numbers large in their cells, sessions small. Empty cells stay empty.
4. **Type wraps the picture.** Split a big line around a photo or the SDG wheel render: "Global [wheel] Youth". Use it once, in the hero or the closing CTA.
5. **Index with superscripts.** Label the focus areas like Railroad Ladies labels its sections: "EDUCATION (4) EQUALITY (5) INNOVATION (9) CLIMATE (13)", with the SDG number as a superscript in its own colour. Hovering a word swaps the image. If set in caps, it uses one of the 3 uppercase uses allowed by taste rule 4.
6. **Scale jumps.** On one or two screens only, put a very large word (around 20vw) next to small body text. The jump is the energy; it stops working if every section does it.
7. **Next item waiting underneath.** For past summits or speakers, show the next title ghosted below the current one, as Visual Creatures does, so the list invites the next scroll.
8. **One warm accent on neutrals for editorial sections.** Where Rynzhuk uses `#FF9398` on grey, we use crimson `#C52035` or ember on paper. Colour-blocked SDG sections stay elsewhere.

---

## 4. Synthesis for GYN

### 4.1 Who is in charge of what

Three influences on one page only works if each one owns a different layer. They should never compete in the same section.

| Layer | Owner | What that means on the page |
|---|---|---|
| Structure, pacing, spacing, the type scale, motion rules, performance | **Apple** | One idea per screen, 144px section rhythm, one headline weight with tracking that tightens with size, one radius, one accent per section, pinned media, video that starts as a still, reduced motion as the light version |
| The object, the emotional hook | **Tarka** | One Blender render per key section (wheel in the hero, globe for "worldwide", the four SDG objects for focus areas, hands for the closing CTA), soft studio light on a plain colour field, used the way Apple uses a product shot |
| Editorial voice: headlines, lists, the programme, archive | **Rynzhuk** | Mixed roman and italic display lines, a services poster instead of cards, a gridded programme table, superscript SDG index, one or two screens with a big scale jump |

How a visitor would move through it:

1. **Hero:** Apple composition (one object, one line, one CTA) with the Tarka wheel as the object and a real GYN photo beside it. Rynzhuk only in the headline itself (one italic word).
2. **Focus areas:** four sections, each with one SDG colour as the field (echochange-level saturation, our colours), one Tarka object, one short Apple-style claim and a stat row.
3. **What we do / programme:** Rynzhuk's turf. Paper background, crimson accent, services poster, gridded four-day table. No 3D here.
4. **Proof (past summits, partners, UNU):** Apple bento tiles, one radius, photos and numbers. The Visual Creatures "next title waiting" pattern for the summit archive.
5. **Apply / tickets:** back to Apple. Plain, high contrast, one CTA per screen with the price on it. The hands render holding up the wheel as the closing image.

Against echochange.org: they win on colour and collage. We match the saturation with SDG colour fields, then beat them on craft: real 3D objects with meaning, a tighter type system, and pacing that gives each idea a screen.

### 4.2 Risks and mitigations

| Risk | Why it is real | Mitigation |
|---|---|---|
| Too many ideas | Three strong styles, plus echochange's colour blocking, plus a long content list. The Rynzhuk sites scored lowest on usability every time | The ownership table above. Rynzhuk moves limited to the sections named; at most one big scale jump per page section; the apply flow uses no editorial tricks at all |
| 3D weight | Apple's iPhone page streamed about 16.8 MB of textures for one WebGL viewer; Apple pages carried 2 to 11 MB of images before media | No real-time WebGL. Pre-rendered loops and a 48-frame WebP sequence only. `preload="none"`, poster first, play in view, pause out of view. Budget per render: poster under 80 KB, loop under 1.5 MB, sequence under 1.2 MB total |
| WebGL and heavy JS | Synchronized uses WebGL/PixiJS; this adds risk on low-end Android, which is a large share of our 17 to 35 audience worldwide | Text and layout effects in CSS and the already-installed `motion` package. Nothing on the page needs a GPU to read |
| Kinetic type and accessibility | Moving or scaled type can trigger vestibular problems and hurt reading; giant type can overflow on small screens | Under `prefers-reduced-motion`, no type motion and no sequence downloads (Apple's model). Headlines remain real text in the DOM, not canvas or SVG paths. Clamp display sizes (`clamp()`), test at 320px, keep body at 17px or more |
| Contrast on colour fields | Saturated SDG fills fail with the wrong ink | Use the AA pairs already in `docs/concept-brief-r2.md` (white on crimson/navy/magenta/`#00689D`, navy-900 on yellow/cyan/gold/ember). Check every new pair |
| Fonts | Apple ships about 1 MB of SF Pro per page; Rynzhuk's sites load 4 to 5 custom faces | Two families at most (one display with an italic, one text face), subset, `font-display: swap`. The italic does the Rynzhuk job without a third face |
| Copying | Tarka's look is recognisable; clients and judges know it | Section 2.5 avoid list: our objects, our palette, no violet, no recreated scenes, his images not used as references for generation |
| Taste-rule conflicts | Apple uses an eyebrow above the hero H1 and gradient text; Tarka backdrops can look like gradients; Rynzhuk sets lots in caps | Hero takes "one object, one line" only (rule 3). No gradient text (rule 1); render backdrops stay flat colour with light falloff, which is lighting, not a CSS gradient. Caps only on the display face, and the superscript SDG index counts toward the 3 uppercase uses (rule 4) |
| Host limits | Concepts must be one HTML file under about 200 KB, images local, scripts from approved CDNs | All of the above works in plain HTML/CSS plus small inline JS. Renders stay as files under `assets/` |

---

## 5. Screenshot index

All in `docs/research/inspiration/`, captured 16 Oct 2026, 1440 wide unless noted.

| File | What it shows |
|---|---|
| `apple-01-iphone-hero.webp` | iPhone 18 Pro hero: PRO as a 3D object, small H1, one line, one Buy button |
| `apple-02-iphone-type-lockup.webp` | "Most wanted." 96px lockup, grey body with white bold phrases |
| `apple-03-iphone-gradient-headline.webp` | The one gradient headline on the page, with two icon columns below |
| `apple-04-iphone-camera-scene.webp` | Pinned camera close-up with "Eye-opening control." |
| `apple-05-airpods-standalone-headline.webp` | Eyebrow + 96px headline alone on white |
| `apple-06-macbook-air-eyebrow-headline.webp` | "Performance" eyebrow, "M5. The chip that zips." |
| `apple-07-macbook-air-bento.webp` | Bento tiles, 28px radius, `#F5F5F7` field |
| `apple-08-environment-hero.webp` | Apple 2030 hero over forest video, pause button |
| `apple-09-environment-highlight.webp` | Single accent green `#00D959` as a marker behind words |
| `apple-10-environment-stat-tiles.webp` | Colour stat tiles: one number or phrase each |
| `apple-11-mobile-iphone-environment.webp` | Mobile (390 wide): hero, stacked stats, floating nav pill |
| `tarka-01-behance-grid.webp` | Range of his work on Behance |
| `tarka-02-playful-illustrations.webp` | Tubes and spheres, satin plastic on grey |
| `tarka-03-spotify-premium.webp` | Spotify Premium holiday visuals |
| `tarka-04-apple-app-store.webp` | App Store editorial landscape, pastel and earth palette |
| `tarka-05-verizon-city.webp` | Verizon city diorama |
| `tarka-06-google-io.webp` | Google I/O 19 logo as glossy primitives |
| `tarka-07-product-explorations-2026.webp` | 2026 product renders, saturated palette |
| `rynzhuk-01-folio-services.webp` | Folio 2019 services list, roman and italic mixed |
| `rynzhuk-02-folio-contact.webp` | Folio 2019 contact line with italic word |
| `rynzhuk-03-railroad-ladies-hero.webp` | Railroad Ladies caps title around the book cover |
| `rynzhuk-04-railroad-ladies-index.webp` | Index row with Cyrillic superscripts, grid cells |
| `rynzhuk-05-railroad-ladies-statement.webp` | Statement line on black |
| `rynzhuk-06-synchronized-services.webp` | Synchronized services set on a circle |
| `rynzhuk-07-visual-creatures.webp` | Visual Creatures three-panel menu |
| `rynzhuk-08-dribbble-shots.webp` | Editorial shots on her Dribbble |

## 6. Sources

Apple
- https://www.apple.com/iphone-18-pro/
- https://www.apple.com/macbook-air/
- https://www.apple.com/macbook-pro/
- https://www.apple.com/airpods-pro/
- https://www.apple.com/apple-watch-series-12/
- https://www.apple.com/environment/
- https://developer.apple.com/design/human-interface-guidelines/typography
- https://developer.apple.com/design/human-interface-guidelines/motion
- https://developer.apple.com/design/human-interface-guidelines/accessibility
- https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/

Peter Tarka
- https://petertarka.com/
- https://www.behance.net/trk
- https://dribbble.com/tarka
- https://www.behance.net/gallery/139059881/Forms-Shapes
- https://www.behance.net/gallery/202162061/Product-Renders
- https://www.behance.net/gallery/243772723/Product-Explorations-2026
- https://www.behance.net/gallery/160066955/Playful-Illustrations
- https://www.behance.net/gallery/126904701/Spotify-Premium-Campaign
- https://www.behance.net/gallery/90905561/Google-IO-2019
- https://www.behance.net/gallery/73287429/Apple-Best-of-October-November
- https://www.behance.net/gallery/32416583/Verizon-A-better-network-as-explained-by-a-city
- https://abduzeedo.com/node/85796
- https://abduzeedo.com/node/87693
- https://designyoutrust.com/2026/09/peter-tarka-turns-simple-3d-shapes-into-playful-polished-worlds-that-make-global-brands-feel-impossible-to-ignore/
- https://xientce.medium.com/interviewing-idols-peter-tarka-c6470bc21197 (excerpt only, page blocked)

Zhenya Rynzhuk
- https://zhenyary.com/
- https://www.behance.net/Zhenyary
- https://dribbble.com/zhenyary
- https://www.awwwards.com/zhenyary/
- https://www.awwwards.com/sites/synchronized-studio
- https://www.awwwards.com/sites/ukrainian-railroad-ladies
- https://www.awwwards.com/sites/zhenya-rynzhuk-folio-2019
- https://www.awwwards.com/sites/kati-forner-folio-website
- https://www.awwwards.com/sites/visual-creatures-folio
- https://synchronized.studio/
- https://railroadladies.com/
- https://visualcreatures.com/
- https://spaces.is/loversmagazine/interviews/zhenya-rynzhuk
- https://lk.linkedin.com/posts/zhenya-rynzhuk-b4040765_here-at-synchronized-studio-we-are-thrilled-activity-6981215426001166336-CCvD

## 7. Gaps

- katiforner.com refused the connection, so no screenshot or type measurements for it.
- petertarka.com renders blank in headless Chromium, so the screenshots of his work come from Behance and Dribbble.
- I found no first-party statement from Tarka about his lighting or materials; section 2.3 is observation.
- Apple byte counts are from `content-length` and a full scroll; first-load weight was not measured separately.
