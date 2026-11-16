# Frontend redesign plan

Written 17 Nov 2026. Covers the public website only (the admin is a separate app). Inputs: SRS v1.2 section 2 (frontend requirements), the brand guide of 20 Oct 2026, Azam's direction of 17 Nov, and what is already built.

## The brief in one paragraph

Minimal, modern and memorable enough that a first-time visitor wants to apply. White is the main background. Glass effects for the layers that float. Fast on a phone on mobile data, because that is how most applicants arrive (brand guide, section 1). Shorter home page. A page for every past and upcoming event, reached from navbar dropdowns. Everything editable from the admin.

**Kept from the current site (Azam, 17 Nov):**
- A collage hero picture in the style of the reference: cut-out delegates with flags, torn-paper edges, sticker labels, SDG wheel arc, a text ribbon.
- The floating "You're at" pill at the bottom of the screen (the client likes it).
- The ambassadors map, now on **every past event page**, with each event's ambassadors managed in the admin.

**Kept from earlier decisions:**
- **Fonts:** two only, both plain and decent (Azam, 17 Nov). This replaces Anton and Newsreader, which are loud and editorial, with a calmer modern pair. See Type below.
- **Colours: revamped (Azam, 17 Nov).** Royal blue brand, lime for actions, white stage, SDG colours as story accents. See Design system.
- **Line:** "Your first global stage."
- **Content rules:** real photos only, and yellow only for things you can click.

## Design idea: a white stage, colour from people

The page is a white stage. The colour comes from the people on it: the collage, real photos, flags and the SDG accents. Royal blue is the brand colour, used for the hero's collage panel, the next-event card and the closing panel. Ink carries the text.

Three rules make "minimal but striking" work:

1. **One loud thing per screen.** Each screen gets one big moment: a collage, a number, a video or the map. Everything around it stays quiet: lots of white, one headline and one button.
2. **Glass only floats over colour.** Frosted glass on a plain white background is invisible: blur over white is still white. Glass is used where something colourful sits behind it:
   - the navbar pill and the "You're at" pill as they pass over photos and the collage
   - fact chips laid over the hero collage
   - map pop-ups
   - cards over event photos

   Behind the plain white sections sit a few large, very soft colour glows in SDG colours (static, drawn once), so the floating glass always has something to catch.
3. **Lime is for action.** Lime is the button colour, always with ink text (about 14 : 1). Lime on white fails contrast, as yellow did (1.6 : 1), so the highlighted headline word is ink text on a lime marker swipe, never lime text. On royal blue, lime text is fine (5.7 : 1).

## Design system (tokens first, so a palette change is one edit)

- **Colour (revamped 17 Nov, tokens in `app/globals.css`):**
  - Base: white `#FFFFFF` stage, ink `#0E1530` text, muted `#4B5372` secondary text (8.1 : 1), mist `#F4F6FB` alternate sections, line `#E3E7F2`.
  - Brand: royal blue `#2D3FE0` (white on it 7.2 : 1), deep royal `#1E2AA8` for gradients, tint `#E9ECFD`.
  - Action: lime `#C6F432` with ink text, buttons and the highlight marker only.
  - Accents: sky `#26BDE2` and lime as soft glows behind glass, peach `#FFD9C7` for collage stickers, and the SDG colours for the story (card stripes, the wheel).
  - The old token names (`--navy`, `--y`, `--yellow`) now point at these, so pages not yet rebuilt follow the new scheme automatically.
  - Client sign-off needed: this replaces the navy and yellow in the 20 Oct brand guide.
- **Glass:**
  - **Light glass:** white at 60 to 70% with a 16 to 24px blur, a 1px white inner border and a soft shadow.
  - **Dark glass:** navy at 55% for use over photos.
  - **Fallback:** where the browser has no `backdrop-filter`, a solid white at 92%. Text contrast on glass is measured against the worst backdrop it can pass over, not the best.
- **Type: exactly two fonts, one for headings and one for text.** Both are free Google Fonts with Latin-extended and Vietnamese support, because delegates' names come from everywhere.
  - **Recommended pair:**
    - **Plus Jakarta Sans** for headings, weights 600 to 800. It is modern and clean, and set large it looks expensive.
    - **Inter** for text, weights 400 to 600. It is the most readable screen font at small sizes.
  - **Alternatives, if the pair feels too familiar:**
    - **Sora** for headings with **DM Sans** for text, which is rounder and friendlier.
    - **Manrope** for headings with **Inter** for text, which is quieter.
  - **Rules:**
    - Headings are sentence case, tightly spaced (about -2% letter spacing), and big on the hero only.
    - Body text is 17px with 1.6 line height.
    - No italics, and no third font anywhere, including in buttons, the admin-edited content and the collage stickers (which use the heading font).
    - Both fonts are self-hosted and subset, and only the two files the first screen needs are preloaded.
  - **Client sign-off needed:** GYN's team originally asked for Conthic headings and an editorial body, which is why the brand guide chose Anton and Newsreader. The switch needs their OK.
  - **Why this is cheap to change:** the fonts are set in one place (`app/layout.tsx` plus two tokens), so changing the pair later is one small edit.
- **Shape:** 20px card corners and full-pill buttons, as now.
- **Spacing:** one scale, with section rhythm from `--spacing-section`.
- **Motion:**
  - Only transform and opacity animate, nothing that moves the layout.
  - Headings rise in, the hero collage layers drift a few pixels on scroll, and the pill ring fills.
  - All motion is off under "reduce motion".
  - No smooth-scroll library: native scrolling is faster and feels right on phones. Lenis is removed.
- **Components:**
  - glass navbar pill with dropdowns
  - "You're at" pill
  - buttons
  - fact chips (not clickable, no yellow)
  - section header
  - event card
  - person card
  - stat block
  - video facade (the poster shows first and the player loads on tap)
  - film-strip gallery
  - ambassadors map
  - category (package) card
  - announcement bar
  - footer

## Speed budget (checked on every page before it ships)

| Measure | Target, phone on 4G |
|---|---|
| Largest Contentful Paint | 2.0 s or less |
| Layout shift (CLS) | under 0.05 |
| Interaction delay (INP) | under 200 ms |
| JavaScript per page | about 120 KB gzipped or less |
| Hero image | 150 KB or less (AVIF/WebP, sized per screen, preloaded) |

How the budget is met:
- **Static pages:** pages are pre-rendered and refreshed when the admin publishes.
- **Little JavaScript:** sections are server components and ship no JavaScript unless they need it (map, pill, carousel).
- **Videos:** they load only on tap.
- **Collage text:** the ribbon and sticker labels are live text and CSS or SVG, not baked into the image. That keeps them sharp, editable from the admin and light.

First step of the build: measure the current site against this table, so we know what we are improving from.

## Pages

### Home (from 13 sections to 8)

| # | Section | What it answers | Notes |
|---|---|---|---|
| 1 | **Hero** | What is this, why should I care? | Headline "Your first global stage" with the marker word, one line of copy, Apply (yellow) and Book a seat (outline). The collage on the right on desktop, under the headline on phones, with glass fact chips over it. |
| 2 | **Who we are** | Is this a real organisation? | Mission in one sentence, the objectives as 3 to 4 short items, and 3 numbers (delegates, countries, events). Link to About. Covers SRS 2.1 "mission and objectives". |
| 3 | **Next event** | When, where, how many seats? | The featured upcoming event: dates, city, countdown, seats left, and its registration categories as cards that link to the forms. |
| 4 | **What you leave with** | What do I get? | The benefits, tightened to 4 items. |
| 5 | **Ambassadors map** | Is anyone from my country part of this? | The same map component as the event pages, showing the featured event's ambassadors. |
| 6 | **Past events** | Did it really happen? | A card per past event (photo, city, year, one number), each linking to its own event page. One highlight video plays in place. |
| 7 | **Voices** | What did people think? | The delegate stories and the photo wall merged into one section. |
| 8 | **Partners, then closing** | Who backs GYN? Apply now. | A logo strip, then the closing band "See you in Kuala Lumpur". |

These move from the home page to the event pages, because they belong to one event: speakers, programme and advisors.

The "You're at" pill runs on every page: it shows the section name, a scroll ring, and the Apply button for the featured event.

### Past events

- **Listing:** cards by year with the city, a photo and one standout number (SRS 2.2). The navbar "Past Events" dropdown lists them.
- **Event page:** one template built from blocks the admin can add, remove and reorder:
  - hero (cover photo, dark glass fact chips)
  - recap numbers
  - highlight video
  - **ambassadors map**
  - gallery (film strip and polaroids)
  - speakers
  - activities
  - outcomes
  - delegate stories
  - partners
  - closing

### Upcoming events

- **Listing:** the same card style, with dates and a deadline badge (SRS 2.3). The navbar "Upcoming Events" dropdown lists them.
- **Event page:**
  - hero with countdown
  - announcement bar (the registration deadline comes from the event's close date)
  - overview and theme
  - registration categories and packages, each card linking to its own registration page
  - programme
  - speakers
  - advisors
  - venue
  - FAQ
  - closing

  The pill's Apply button points at this event.
- **Past or upcoming:** an event moves between the two lists by its dates. The admin can pin which one is featured on the home page.

### Registration pages (one per category)

- **Layout:** what's included on the left, the form on the right in a light-glass card over a soft colour glow.
- **Form:** step indicator, terms acceptance, and an acknowledgement with the entry number at the end.
- **Data:** built on the form engine (backend phase 5), so the fields come from the form builder, not from code.

### About, Contact, legal

- **About:** introduction, vision, mission, objectives, activities, background, team and media (SRS 2.4).
- **Contact:** email, phone, address, social links, the contact form (submissions land in the admin's contact inbox) and an optional map (SRS 2.5).
- **Legal pages:** Terms, Privacy and Refund on the existing policy layout, editable from the admin and linked from the footer (SRS 2.6).

### Navbar and footer

- **Navbar:** a glass pill with Home, Past Events (dropdown), Upcoming Events (dropdown), About and Contact, plus the featured event's booking button. On phones it shows the logo, the booking button and a menu sheet.
- **Footer:** contacts, social links, policies and a short mission line.

## The ambassadors map, per event

The map becomes a section type that any event page (and the home page) can use. In the admin, each event gets an **Ambassadors** list with these fields:

- name
- country
- city (optional)
- photo
- an optional one-line role

The admin picks a country (and optionally a city) from a list, and the site places the pin from a built-in coordinates table, so nobody types latitude and longitude. The event's own city is the hub the routes fly to. The current map already plots people by longitude and latitude (`components/home/Network.tsx`), so this reuses it. The map is redrawn light, with navy dots on white and glass pop-ups, to match the white site.

Backend impact: add `ambassadors` to the event section types in `docs/backend-plan.md` (phase 4).

## The hero collage

- **Style:** the reference's style:
  - full-colour cut-out delegates with flags
  - torn-paper edges
  - two or three sticker labels
  - the SDG wheel arc
  - a paper plane or starburst
  - a ribbon running across with our own line, e.g. "YOUR FIRST GLOBAL STAGE"
- **Our own artwork, made from GYN's photos:** the reference's slogan "Awaken the changemaker within" and the artwork itself may belong to another organisation. Unless GYN confirms it is theirs, we copy the style, not the art.
- **How it's built:** the photo cut-out is one optimised image. The stickers, ribbon and SDG arc are live text and SVG on top, so the admin can change the words and the image stays small.
- **Per event:** each event can get its own collage, e.g. Kuala Lumpur towers for SISM and Bangkok for FMS.

## Build order

Each step ends with something to look at and check.

1. **Baseline and moodboard (S).**
   - Measure the current site against the speed budget.
   - Make two static hero directions and one full home-page mockup for sign-off before any code. The big visual decisions are cheaper to change in a mockup.
2. **Tokens and core components (M):** colour, glass, type, spacing and motion tokens; navbar, pill, buttons, chips, cards, section header, video facade and footer. Checked with a component page and an axe scan.
3. **Home page (M):** the 8 sections on the existing home content store (the admin home editor gets the new fields). Checked against the speed budget, axe, and a real phone.
4. **Event pages (L):**
   - The past and upcoming templates, the listings, the navbar dropdowns and the ambassadors map per event.
   - Needs backend phase 4 (events and section editor), so the two are built together.
   - The current hard-coded `sism-2026` and `fms-thailand` pages are replaced, with redirects from their old URLs.
5. **Registration pages (M):** the shell and look, wired to the form engine as backend phase 5 lands.
6. **About, Contact, legal (S).**
7. **Polish and QA (M):** motion pass, reduced-motion pass, axe on every page at 390px and 1440px, the speed budget on every page, and real-device checks on a mid-range Android phone and an iPhone.

## Assets needed from GYN

- High-resolution group photos with flags from Bangkok and FMS (for the collage), plus a few single delegate photos with clean backgrounds.
- The logo as SVG.
- For every past event:
  - dates and venue
  - key numbers
  - gallery photos and video links
  - ambassadors (name, country, photo)
  - speakers
  - outcomes
- Partner logos as SVG or high-resolution PNG.
- Confirmation of who owns the reference collage and the "Awaken the changemaker within" line.

## Open questions for Azam

1. **Speakers carousel** (the tilted card slider in your second screenshot): keep it on event pages, or drop it? You showed it without saying which.
2. **What you are "not so inclined to keep":** please confirm or change the proposal above. It moves speakers, programme and advisors to the event pages, merges the wall and stories, and drops the event strip under the hero.
3. **Hero collage on bare white, or inside a large rounded colour panel?** I recommend the panel, as in the reference:
   - it gives the glass navbar and chips colour to sit on
   - it keeps the reference's energy
   - the page around it stays white
4. **Who owns the reference collage?** If it is GYN's, we can use it as is.
5. **The font pair:** Plus Jakarta Sans with Inter (recommended), Sora with DM Sans, or Manrope with Inter. The best way to choose is to see each pair set on the real hero and a section, side by side.
