# Round 2 concepts: shared brief

Round 1 (A–D) read as AI-made, so the client asked for "something modern like echochange.org", with vibrant colour and high-end Blender animation. Four new homepage concepts, E–H. Same content, same hard host limits as round 1, stricter taste rules.

## Read first
1. `docs/concept-brief.md`: content to show, **Hard technical limits** (still apply in full), quality bar. Everything there applies unless this file overrides it.
2. `docs/ai-tells.md`: the tells, and how round 1 failed them. Read the per-file audit so you don't repeat it.
3. Content: `content/pages/home.md`, `content/pages/sism-2026.md`, `content/events.json`, `content/media.json`. Palette: `design/palette.md`. Images: `concepts/assets/` (same pack as round 1).

## What to take from echochange.org (the client's reference); don't copy it
Screenshot notes, 15 Oct:
- **Colour-blocked sections.** Whole sections in one saturated colour (theirs is royal blue `#1F30AC`), alternating with white. No gradients.
- **Loud stat tiles in different solid colours and sizes** (violet, orange, teal, green, pink), staggered heights, big number + one line.
- **Cut-out collage photography.** A crowd photo with a torn-paper edge, sticker labels on it ("YOUTH LEADERS", "CHANGEMAKERS"), a curving ribbon of text, starbursts.
- **Heavy, wide, all-caps display type** (theirs is Lemon Milk) over a plain geometric body face.
- **Solid-colour story cards** with a photo strip on top and a country chip.
- Lime `#CCFF00` buttons on blue: high-contrast pill CTAs.
- Previous summits as a list with dates you click to swap the photo.

We keep the energy (saturation, colour blocks, collage, poster type, people first), and change everything specific: our palette comes from the GYN logo + the 17 UN SDG colours (GYN's own world, and more vibrant than theirs), our type, our layouts, our 3D. **No purple or violet anywhere** (AI tell #1, and it's their colour). No lime either.

## Vibrant palette for round 2
Base ink `#0E1530` (navy-900) and white/paper. Brand: navy `#202F60`, crimson `#C52035`, flame `#EF3F2D`, ember `#F2692C`, leaf `#48783F`. Extended with SDG colours as **solid section and tile fills**: SDG 2 gold `#DDA63A`, SDG 6 cyan `#26BDE2`, SDG 7 yellow `#FCC30B`, SDG 10 magenta `#DD1367`, SDG 14 blue `#0A97D9`, SDG 3 green `#4C9F38`, SDG 16 `#00689D`. Text on each fill must pass AA (white on crimson/navy/magenta/`#00689D`; navy-900 on yellow/cyan/gold/ember). Check with `design/contrast.py` logic if unsure.

## Blender renders (real 3D, pre-rendered)
Being rendered into `concepts/assets/r2/renders/`. For each `<name>`: `<name>.webm` (VP9, transparent background), `<name>.mp4` (H.264 on `#0E1530`), `<name>-poster.webp` (first frame, transparent). Names: `wheel-bloom`, `ribbons`, `glass-globe`, `sticker-pile` (landscape 16:9; others square). Plus `wheel-assemble/0001.webp`…`0048.webp`, a 48-frame sequence of the SDG wheel assembling, made for scroll-scrubbing.
- Use `<video muted loop playsinline preload="none">` with the poster image showing first, and start playback only when in view (IntersectionObserver), pausing when out of view.
- **Safari** (`/^((?!chrome|android).)*safari/i`) can't show webm transparency: give Safari the poster `<img>` only, no video.
- `prefers-reduced-motion`: poster only.
- The render must sit **with** a real photo, not replace it (the hero has at least one real GYN photo at full opacity). The 3D is the brand object, not decoration.
- The files may not exist yet while you build. Code against these exact paths; the lead will QA once they land.

## Taste rules (from docs/ai-tells.md, adjusted)
1. No purple/violet/indigo/fuchsia. No `backdrop-filter`. No gradients except photo scrims marked `/* scrim */`.
2. Banned fonts: Inter, Geist, Space Grotesk, Instrument Serif, Bricolage Grotesque, JetBrains Mono, Playfair, Manrope, Poppins, DM Sans, Hanken Grotesk, Plus Jakarta Sans, Fraunces, Archivo, Source Serif, IBM Plex. Use the faces assigned to your direction. One comment at the font `<link>` says why.
3. Nothing between the top of the hero and the H1: no eyebrow, no pill, no "GYN presents".
4. Echochange-style caps headlines are allowed, but **only the display face** is uppercase. Body, labels and buttons are sentence case, so `text-transform: uppercase` appears at most 3 times.
5. No section numbers ("01 ·"). Real sequences only (the 4 summit days, the 4 application steps, editions).
6. No coloured left/top stripe on cards. No identical card grids: the six "what we do" items become something else (a list, a collage, varied tiles). Vary size, colour and shape.
7. No emoji anywhere (flags included; show the country name, or a small SVG flag if you must).
8. Motion: no fade-up on every element. At most one entrance per section, and the big motion budget goes to the Blender renders and one signature interaction. Hover lift only on links and buttons.
9. **Copy we write** (headings we add, CTAs, labels, captions): no em dashes, no "·" dividers, no "not just X but Y", none of: empower, elevate, unlock, seamless, ecosystem, journey, world-class, esteemed, vibrant, innovative, cutting-edge, transform. CTAs say the action and, where there is one, the price ("Book Forum Access, $199"). **Client copy** (paragraphs from content/) stays verbatim, but trim it, and swap any em dash for a comma. "Empowering Youth" is the logo tagline and stays inside the logo only.
10. No `rounded-xl + border + shadow` card repeated everywhere. Pick a shape language for your direction and commit to it.

## Also required
- Scholarship tiers truthfully closed (results 16 Oct); confirmed seats open. Countdown, if any, to 19 Nov 2026 09:00 MYT. Ambassadors: 12 people, 11 countries.
- Write the file in chunks (each tool call under ~6k tokens), and use quoted heredocs (`<<'EOF'`) so `$` survives. Two round-1 builders crashed on the output cap, and one lost `$1`/`$3` from prices.
- Fixed corner pill "Direction <letter> · <name>" linking to `./` (this pill may use the dot; it's team-review chrome, not site copy).
- Before you finish, run the grep checks from docs/ai-tells.md rules 1–13 on your file and fix every hit, then report the counts.

## Return
6 lines: file, fonts, how the Blender renders are used, signature interaction, grep check counts, compromises.
