# Design handoff: direction G, Deep Field

What a developer needs to build new pages and components in the chosen direction without opening the concept file. The reference prototype is `concepts/g-deep-field.html`; the implementation is `app/globals.css` plus the components listed below. Where the two disagree, the code wins and this doc describes the code.

G is light mode only (D24). Colour-blocked sections in saturated SDG blues and yellow alternate with white and paper. Wide display caps (Krona One) over a plain grotesque (Schibsted Grotesk). Square corners. One big motion moment per page (the Blender globe on home, the gallery scroll on FMS Thailand), not fade-ups everywhere.

## Tokens

### Where tokens live

- `app/globals.css` `@theme`: Tailwind tokens (`--color-*`, `--font-*`, `--spacing-*`, `--radius-*`, `--ease-out`, `--duration-*`). Use these in Tailwind classes.
- `app/globals.css` `:root`: short CSS variables for inline styles and CSS modules (`--navy-900`, `--yellow`, `--fd`, `--gut` ...). Most components use these.
- `design/tokens/tokens.css` and `design/palette.md`: the round-1 palette derived from the logo, with a dark theme and 6/12/20px radii. The app does not import `tokens.css`. G keeps the logo colours and adds SDG fills; treat `palette.md` as the source for the logo colours and their contrast numbers, and `globals.css` as the source for everything G uses.

The `:root` block does not define every colour the components reference. `--n-50`, `--n-300`, `--n-500`, `--n-800`, `--n-900`, `--navy-300` and `--leaf-600` are used in `app/` and `features/` but exist only as Tailwind `--color-*` tokens, so those `var()` calls resolve to nothing (text inherits its parent colour, backgrounds go transparent). Add them to `:root` before relying on them.

### Colour

| Token | Hex | `:root` var | Used for |
|---|---|---|---|
| blue-deep (SDG 16) | `#00689D` | `--blue-deep` | Section fills, links on white, active tab, stat tile `.t-b`, form progress |
| blue-ocean (SDG 14) | `#0A97D9` | `--blue-ocean` | Page-transition curtain, link hover on policy pages |
| blue-sky (SDG 6) | `#26BDE2` | `--blue-sky` | Stat tile `.t-c` |
| navy-900 | `#0E1530` | `--navy-900` | Base ink, header, dark sections, `.btn-n` |
| navy-800 | `#16204A` | `--navy-800` | Nav dropdown, video dialog, `.btn-n` hover |
| navy-700 | `#202F60` | `--navy-700` | Logo navy (wordmark), headings in email |
| yellow (SDG 7) | `#FCC30B` | `--yellow` | Primary CTA `.btn-y`, stat tile `.t-y`, focus ring, active ticket tier, dropdown top rule |
| yellow-dk | `#D6A200` | `--yellow-dk` | `.btn-y` hover |
| crimson-600 | `#C52035` | `--crimson-600` | Errors, required asterisk, FMS Thailand accent, "Past summit" label |
| SDG 4 | `#C5192D` | `--sdg4` | Focus-area tile |
| SDG 5 | `#FF3A21` | `--sdg5` | Focus-area tile |
| SDG 9 | `#FD6925` | `--sdg9` | Focus-area tile |
| SDG 13 | `#3F7E44` | `--sdg13` | Focus-area tile |
| white | `#FFFFFF` | `--white` | Page background, text on dark |
| paper / n-50 | `#F7F7F4` | `--paper` | Alternate light section |
| n-100 | `#EEEEE9` | `--n-100` | Subtle fills |
| n-200 | `#DCDCD5` | `--n-200` | Rules, input borders, inactive progress |
| n-400 | `#9A9A93` | `--n-400` | Inactive step labels (decorative only, see below) |
| n-600 | `#5A5A55` | `--n-600` | Secondary body text on light |
| n-700 | `#3F3F3C` | `--n-700` | Long-form body text (policy pages) |

Tailwind-only (no `:root` var): navy-500 `#3A4C8C`, navy-300 `#8E9BCB`, navy-100 `#E3E7F4`, crimson-500 `#E0334A`, ember-500 `#F2692C`, leaf-600 `#48783F`, n-300 `#BDBDB5`, n-500 `#76766F`, n-800 `#262624`, n-900 `#141413`.

Banned in G (from `docs/concept-brief-r2.md`): purple, violet, indigo, fuchsia, lime, gradients except photo scrims marked `/* scrim */`, `backdrop-filter`.

### Allowed text pairs

WCAG 2.2: 4.5:1 for body text, 3:1 for large text (24px+, or 18.66px+ bold) and for non-text UI such as focus rings and input borders.

From `design/palette.md` (logo colours, still valid in G):

| Text on background | Ratio | Allowed for |
|---|---|---|
| navy-700 on white | 12.83 | Any text |
| crimson-600 on white | 5.78 | Any text |
| white on crimson-600 | 5.78 | Any text |
| leaf-600 on white | 5.21 | Any text |
| n-600 on white | 6.93 | Any text |
| n-500 on white | 4.57 | Any text (n-500 on n-50 is 4.26, large only) |
| white on navy-900 | 17.97 | Any text |
| navy-900 on ember-500 | 5.85 | Any text |
| ember-500 on white | 3.07 | Large text only, never body |

G colours. Not in `palette.md`; computed with the same formula as `design/contrast.py` for this doc. Add them to `contrast.py` when it's next touched.

| Text on background | Ratio | Allowed for |
|---|---|---|
| navy-900 on white | 17.97 | Any text |
| navy-900 on paper | 16.74 | Any text |
| navy-900 on yellow | 11.08 | Any text (the CTA pair) |
| navy-900 on yellow-dk | 7.72 | Any text (CTA hover) |
| yellow on navy-900 | 11.08 | Any text |
| navy-900 on blue-sky | 8.09 | Any text |
| navy-900 on blue-ocean | 5.51 | Any text |
| white on blue-deep | 6.06 | Any text |
| blue-deep on white | 6.06 | Any text, links |
| white 80% on navy-900 | 11.68 | Any text (nav links) |
| white 70% on navy-900 | 9.18 | Any text |
| white 50% on navy-900 | 5.22 | Any text, the lowest opacity allowed on navy-900 |
| n-600 on paper | 6.46 | Any text |
| n-700 on paper | 9.84 | Any text |
| white on SDG 4 | 5.91 | Any text |
| white on SDG 13 | 4.91 | Any text |
| navy-900 on SDG 5 | 5.03 | Any text |
| navy-900 on SDG 9 | 6.18 | Any text |
| yellow on blue-deep | 3.74 | Large text only (stat numbers) |
| white 75% on blue-deep | 4.12 | Large text only |
| white on blue-ocean | 3.26 | Large text only |
| blue-ocean on white | 3.26 | Large text and hover states only |
| white on SDG 5 | 3.57 | Large text only |
| n-400 on white | 2.83 | Not for text |
| white on SDG 9 | 2.91 | Not for text |
| yellow on white or paper | 1.62 / 1.51 | Not for text, and fails 3:1 as a focus ring |

Two places in the current code break these rules:

1. `.t-b .stat-l` puts the stat label at white 75% on blue-deep (4.12) at 0.8125rem. Raise it to white 90% or full white.
2. The global focus ring is a 3px yellow outline (`:focus-visible` in `globals.css`). On navy and blue it is clear; on white and paper it measures 1.6:1 and is close to invisible. Use a two-colour ring on light sections (navy-900 outline plus yellow offset, or `box-shadow: 0 0 0 3px var(--navy-900)` around the yellow).

### Type

| Role | Face | Weights loaded |
|---|---|---|
| Display (`--fd`, `--font-display`) | Krona One | 400 (the only weight) |
| Body, labels, buttons (`--fb`, `--font-body`) | Schibsted Grotesk | 400, 500, 600, 700, italic |

Both are self-hosted by `next/font/google` in `app/layout.tsx`. Inter, Geist, Space Grotesk and the rest of the list in `docs/concept-brief-r2.md` are banned.

Scale (from `app/globals.css`):

| Class | Use | font-size | line-height |
|---|---|---|---|
| `.d1` | H1 | `clamp(1.5rem, 8.2vw, 3.75rem)` below 768px; `clamp(2.25rem, 3.8vw, 3.75rem)` from 768px | 1.04 |
| `.d2` | H2 | `clamp(1.25rem, 2.8vw, 2.5rem)` | 1.1 |
| `.d3` | H3, card titles | `clamp(1rem, 1.8vw, 1.4rem)` | 1.2 |
| policy h1 | `PolicyLayout` | `clamp(1.4rem, 3vw, 2rem)` | 1.15 |
| policy h2 | `PolicyLayout` | `clamp(1.1rem, 2vw, 1.5rem)` | inherited |
| body | paragraphs | 1rem (policy), 0.9375rem (most sections) | 1.7 to 1.75 |
| small | meta, labels, nav | 0.875rem, nav dropdown 0.8125rem | |
| button | `.btn` | 0.9375rem, weight 600 | 1 |
| caption | photo captions | 0.625rem | 1.3 |

Rules:

- All `.d*` classes set `overflow-wrap: break-word`. Krona One caps are about 0.97em wide per letter; 8.2vw is what keeps "FUTUREMINDS" inside a 360px screen. Test any new long H1 word at 360px.
- Only the display face is set in capitals. Body, labels and buttons are sentence case. `text-transform: uppercase` at most 3 times per page.
- Body text weight 400 minimum.
- 0.625rem captions are below a comfortable reading size; keep them to one short line under a photo.

### Spacing and layout

| Token | Value | Use |
|---|---|---|
| `--gut` / `--spacing-gut` | `clamp(1rem, 4vw, 3.5rem)` | Horizontal page padding inside `.wrap` |
| `--sp` / `--spacing-section` | `clamp(3rem, 6vw, 6rem)` | Default vertical section padding |
| `.wrap` | `width: min(100%, 1280px)`, centred, `padding-inline: var(--gut)` | Content container |
| Header height | 3.5rem, fixed | `scroll-padding-top: 4rem` on `html` keeps anchors clear of it |
| Touch targets | 44px minimum | Form inputs and the pay button set `minHeight: 44px` |

Vary section padding by content (`docs/ai-tells.md`): dense sections can go tighter than `--sp`, full-bleed photo sections can drop it.

### Radius

| Token | Value | Use |
|---|---|---|
| `--radius-none` | 0 | Default for everything: sections, tiles, cards, buttons, inputs |
| `--radius-sm` | 2px | Small chips where a hard corner looks broken |
| `--radius-logo` | 6px | The white chip behind the logo on dark backgrounds (`.logo-chip`) |
| 50% | | WhatsApp floating button only |

No `rounded-xl` cards, no card shadows.

### Motion

Two sets of curves are in use. Pick the first for new CSS work and the second for Motion components, until someone merges them into one token.

| Where | Curve | Durations |
|---|---|---|
| `globals.css` `@theme` (CSS transitions, buttons, links) | `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`; buttons use plain `ease` | `--duration-fast` 140ms, `--duration-base` 200ms |
| Premium components (`EASE` constant) and `tokens.css` | `cubic-bezier(0.23, 1, 0.32, 1)` | 160ms colour changes, 380ms page curtain, 0.4s coverflow, 0.52s line reveal, 0.62s summit wipe |
| MagneticButton | spring: stiffness 120, damping 14, mass 0.8 | pull clamped to 12px |
| DeckSlider | spring: duration 0.5, bounce 0.18 | dismiss past 80px drag or 500px/s |
| SummitSwitcher title lines | 0.44s, delay 0.22s + 0.07s per line | |

Rules:

- Hover moves (`translateY`) only on links and buttons. Cards that aren't links don't move.
- At most one entrance animation per section. Never on individual paragraphs, labels or cards.
- Nothing loops unless it's a clock (the countdown) or the globe video, which pauses out of view.

Reduced motion (`prefers-reduced-motion: reduce`): `globals.css` caps every animation and transition at 0.01ms; Lenis smooth scroll is not started; the globe shows its poster; Motion components switch to opacity-only or static (per component below); the page curtain is off.

## Breakpoints

| Width | What changes |
|---|---|
| ≤ 420px | Countdown gap shrinks and wraps |
| ≤ 480px | Stats, SDG tiles, speakers and footer go to one column |
| ≤ 767px | HorizontalGallery becomes a scroll-snap row; GlobeVideo shows the poster only, no video download |
| ≤ 768px | The main breakpoint. Header switches to the hamburger menu; most two- and four-column grids collapse (`globals.css` "RESPONSIVE GRIDS"); TicketRail becomes a snap rail |
| 769 to 1024px | `/videos` grid goes to two columns |
| ≥ 900px | Policy pages show the sticky table of contents |

The 768 boundary is not consistent: `globals.css` and most modules use `max-width: 768px`, while `GlobeVideo` and Tailwind `md:` (TicketRail) switch at 768 the other way, so at exactly 768px both layouts apply. Use `max-width: 767px` / `min-width: 768px` in new code.

### How each page collapses

| Page | ≥ 769px | ≤ 768px | ≤ 480px |
|---|---|---|---|
| Home `/` | Hero two columns (copy + globe/photo strip); stats 4 across; who-we-are 2; SDG tiles 4; speakers, advisory, ambassadors 4 | Hero one column, globe as poster; stats 2; who 1; SDG 2; ticket tiers as a snap rail with dots; speakers, advisory, ambassadors, gallery 2 | Stats 1; SDG 1; speakers 1 |
| SISM 2026 `/sism-2026` | Hero two columns; content blocks in pairs; application steps 4 across | Everything one column; application steps 2 | Steps 1 |
| FMS Thailand `/fms-thailand` | Stats 4; chapters `1fr 2fr`; schedule 4 days across; gallery pinned horizontal scroll | Stats 2; chapters 1; schedule 2; gallery a swipe row | |
| About `/about-us` | Mission 2 columns; SDG grid; advisory deck plus grid | Mission 1; SDG 2; advisory 1; ambassadors 2 | SDG 1 |
| Contact `/contact-us` | Details and form side by side | Stacked, details first | |
| Form pages (`/sism-forum-access` and the other two) | Context left, form right | Stacked, context first | |
| Videos `/videos` | 3 columns | 2 columns from 769 to 1024; 1 column at 768 and below | |
| Policy pages | Text plus sticky TOC from 900px | Text only, no TOC | |
| Footer | `2fr 1fr 1fr 1fr` | 2 columns | 1 column |

Test at 360, 768, 1280 and 1440. No horizontal scroll at any width (`section, footer { overflow-x: clip }` catches most overflow, but fix the cause rather than relying on the clip).

## Component inventory

States are listed when the component has them; "n/a" means the state doesn't apply. Every focusable element should show the focus ring; the components marked "focus ring suppressed" set `outline: 'none'` inline, which overrides the global `:focus-visible` rule and leaves keyboard users without a visible focus. That needs fixing in all of them.

### Shared (`components/`, `app/_components/`, `features/*/ui/`)

**SiteHeader** (`components/SiteHeader.tsx`)
- Props: `nav: NavItem[]` (from `content/sitemap.json`).
- States: link hover (white 80% to white); dropdown open on hover or keyboard focus inside; mobile menu open/closed; CTA "Book Forum Access" as `.btn-y`.
- Keyboard: Tab into a parent item opens its dropdown (`:focus-within`). Hamburger has `aria-expanded`. Missing: Escape doesn't close the mobile menu or a dropdown, and focus isn't trapped or returned when the mobile menu closes.
- Reduced motion: only colour transitions, nothing to change.

**SiteFooter** (`components/SiteFooter.tsx`)
- Props: `footer: FooterSection[]`, `socials: SocialLink[]`.
- States: link hover. Fixed WhatsApp button bottom right (`aria-label="WhatsApp us"`, opens in a new tab).
- Keyboard: plain links.

**Countdown** (`components/Countdown.tsx`)
- Props: none. Target is hardcoded to 19 Nov 2026 09:00 MYT.
- States: before hydration shows `--` in every unit; then ticks each second. After the target it shows 00 for everything and stays there; there's no "the summit has started" state. Add one before 19 Nov.
- `role="timer"` with an aria-label naming the date; the digits update silently (no live region), which is right for a per-second timer.

**GlobeVideo** (`components/GlobeVideo.tsx`)
- Props: none. Plays `public/renders/glass-globe.webm` (alpha) or `.mp4`.
- States: poster image first; video plays only while at least 10% is in view and pauses out of view. Poster only on screens under 768px, on Safari (no webm alpha), and under reduced motion. Autoplay blocked: the poster stays.
- Keyboard: none, decorative (`aria-hidden`).

**CountryTablist** (`components/CountryTablist.tsx`)
- Props: `tabs: { id, label, people: { name, role, country, image }[] }[]`.
- States: selected tab filled blue-deep with white text, others white with blue-deep text and border; hover changes colour only.
- Keyboard: tabs are buttons with `role="tab"`, `aria-selected`, `aria-controls`. Missing: arrow-key navigation and roving `tabIndex`, which the ARIA tabs pattern expects. Every tab is a Tab stop today.

**HomeVideosSection** (`components/HomeVideosSection.tsx`)
- Props: `items: VideoItem[]`, `heading?: string`. Wraps CoverflowVideos and owns the player.
- States: closed; open as a modal `<dialog>` with a youtube-nocookie iframe (autoplay).
- Keyboard: Escape closes (native modal dialog); backdrop click closes; close button labelled "Close video".

**SismVideos** (`features/events/SismVideos.tsx`)
- Props: none; six YouTube Shorts ids are hardcoded.
- States: as HomeVideosSection, but the dialog is opened with the `open` attribute, not `showModal()`. Missing: Escape does nothing, focus isn't moved into the dialog, and the page behind stays tabbable. Switch to `showModal()` like HomeVideosSection.

**LenisScroll** (`components/LenisScroll.tsx`)
- Smooth scroll for the whole site, started in `app/layout.tsx`. Not started under reduced motion.

**PolicyLayout** (`app/_components/PolicyLayout.tsx`)
- Props: `title`, `toc: TocEntry[]`, `lastUpdated: string | null`, `children` (rendered markdown).
- States: active TOC entry follows the heading in view; TOC hidden below 900px; empty TOC renders nothing.
- Keyboard: TOC entries are anchor links.

**RegistrationForm** (`features/registration/ui/RegistrationForm.tsx`)
- Props: `ticket: TicketId`, `includes: string[]`.
- Steps: "Your details", then "Review" with consent and pay.
- States: field error (crimson border, message under the field, `aria-invalid`, `aria-describedby`); saved-progress note (`role="status"`) when restored from `localStorage`; server error banner (`role="alert"`); 409 ticket closed, 429 rate limited and 500 messages in that banner; submitting (button reads "Processing...", disabled, 70% opacity); Turnstile widget when the site key is set; consent unchecked blocks submit with a message.
- Keyboard: native inputs; after a failed submit focus moves to the first invalid field. Focus ring suppressed on inputs.
- Hidden honeypot field `website` (`tabIndex=-1`, `aria-hidden`).

**ContactForm** (`features/contact/ui/ContactForm.tsx`)
- States: field errors (`role="alert"` per field, `aria-invalid`); submitting (button disabled); success replaces the form with "Message sent" (`aria-live="polite"`); 400/429/500 shown as a form-level alert.
- Missing: no Turnstile widget, so it fails once Turnstile is on (README). Focus ring suppressed on inputs.

**Unused:** `components/SummitsSwapper.tsx` and `components/VideoModal.tsx` are not imported anywhere. SummitSwitcher and HomeVideosSection replaced them. Delete them or document why they stay.

### Premium (`components/premium/`)

Each has a README with props and usage. Summary:

| Component | Props | States | Keyboard | Reduced motion |
|---|---|---|---|---|
| SplitReveal | `lines: string[]`, `as?: 'h1'/'h2'/'h3'/'p'` (default h2), `delay?` ms, `stagger?` ms (70), `className?`, `id?`, `style?` | Hidden until first in view, then each line slides up from a mask; never replays | n/a, full text in an `sr-only` span, animated lines `aria-hidden` | Opacity fade, 0.2s |
| MagneticButton | `children`, `className?`, `onClick?`, `type?`, `disabled?`, `aria-label?`, `innerClassName?`, `href?` (renders `<a>`) | Rest; pointer near pulls up to 12px; press scales down; disabled passes through | Native button or link | No pull; also off on touch (`hover: hover` and `pointer: fine` only) |
| PageTransition (`ViewTransitionStyles`, `TransitionLink`) | `TransitionLink`: Next `LinkProps`, `children`, `className?`, `aria-label?` | Curtain wipe in blue-ocean, 380ms, on internal navigation | Native link; Ctrl/Cmd/Shift click and external links behave normally | No animation; also a no-op in browsers without View Transitions |
| TicketRail | `tiers: Tier[]` (`id`, `name`, `price`, `priceLabel?`, `description`, `features`, `cta`, `ctaHref`, `featured?`, `closed?`), `defaultActive?` | Active tier (yellow border, `aria-current`); featured (dark variant); closed (CTA `aria-disabled`, `tabIndex=-1`, `pointer-events: none`, label reads "Closed"); CTA hover colour | Tab through CTAs; dot buttons "Go to tier N" on mobile | Instant scroll, no indicator transition |
| SummitSwitcher | `summits: Summit[]` (`id`, `label`, `title: string[]`, `meta`, `imageSrc`, `imageAlt`, `accentColor`, `accentText?`, `status`, `cta`), `autoplay?` (false), `autoplayInterval?` (6000) | Current slide; directional clip-path wipe in the incoming accent colour; image settles from 1.07 scale; title lines reveal | Arrow Left/Right on the focused region; summit tabs (`role="tab"`, `aria-selected`); prev/next buttons; `aria-live` announces the slide. Focus ring suppressed on the region | Opacity cross-fade |
| DeckSlider | `items: Speaker[]` (`id`, `name`, `role`, `organisation`, `imageSrc` 3:4, `imageAlt?`, `topic?`), `heading?` | Top card draggable; dismissed past 80px or 500px/s; up to two cards stacked behind; topic shows on the active card only | Arrow Left/Right on the focused region; prev/next buttons; `sr-only` ordered list with `aria-current`; `aria-live` names the active speaker. Focus ring suppressed on the region | No drag, no rotation, buttons still work |
| HorizontalGallery | `photos: GalleryPhoto[]` (`id`, `src`, `alt`, `caption?`), `heading?` | Vertical scroll drives the track sideways while pinned, with image parallax and a progress bar | Normal page scroll; images are not focusable | Native scroll-snap row (same as under 768px), no pinning |
| CoverflowVideos | `items: VideoItem[]` (`id`, `title`, `category`, `thumbnailSrc`, `thumbnailAlt?`, `duration?`), `onOpen(item)`, `heading?` | Active card centred and flat, neighbours rotated and pushed back; drag to move; active card is a "Play: title" button | Arrow Left/Right move; Enter/Space opens the active video; prev/next buttons; `aria-live` names the active video. Focus ring suppressed on the region | Flat 2D row, no rotation or depth |

None of the premium components has a loading, error or empty state. With an empty array most render an empty frame; callers should not render them without data. Images inside them are plain `<img>` elements, not `next/image`, so they get no automatic resizing or lazy loading from Next; a broken `src` shows the alt text in an empty box.

## Imagery

- **Captions and alt text say what is in the photo, where and when.** Every photo from the FMS Thailand gallery (`fmst-dsc*` files) was taken at FutureMinds Summit Thailand in Bangkok, July 2026, and is captioned that way wherever it appears, including on the home page next to SISM Malaysia content. Never caption or alt-text a Bangkok photo as Kuala Lumpur, and never imply it shows SISM 2026, which hasn't happened yet.
- **No stand-ins.** If GYN has no photo of something (the APU campus, D39), show what exists (the APU logo) rather than another photo with a borrowed caption.
- **Speaker photos are of that speaker.** `app/fms-thailand/page.tsx` falls back to a gallery photo when a speaker has no headshot, which puts a crowd photo in a speaker card. Use a plain initials tile instead. The same page points two speakers at files that don't exist (`/media/advisory/wenbo-li.webp`, `/media/speakers/sura-fitiani.jpg`); the real files are `/media/advisory-board/wenbo-li.webp` and `/media/speakers/sura-fitiani.webp`.
- **Videos are labelled by their real event.** `features/events/SismVideos.tsx` titles its six testimonials "SISM 2026 delegate", under the heading "Hear from past delegates". SISM 2026 is in November; these are past delegates and should be labelled with the event they attended.
- **The 3D render sits with a real photo, not instead of one.** The home hero shows at least one real GYN photo at full opacity next to the globe.
- **Full opacity.** No faded photos. A scrim only where text sits on a photo, commented `/* scrim */`.
- **Logos** on dark backgrounds sit on the white `.logo-chip`. Partner logos with no known name keep their file name out of the alt text; four (`oc`, `tehgzr`, `tss`, `logo-n`) are still "Partner" in `features/media/media.ts` and need real names from GYN.
- **No stock people, no AI-generated people, no abstract 3D blobs.**

## Copy rules

From `docs/ai-tells.md` and `docs/concept-brief-r2.md`. They apply to copy we write (headings, CTAs, labels, captions, alt text, emails). Client copy from `content/` stays verbatim, trimmed, with any em dash swapped for a comma.

| Rule | Instead |
|---|---|
| No em dashes | Comma, full stop or brackets |
| No `·` or `//` dividers | Commas, line breaks or a table |
| No "not just X, but Y" / "it's not X, it's Y" | Say the thing once |
| No words from the banned list (rule 9 in `docs/concept-brief-r2.md` has the full list of twelve; rule 14 in `docs/ai-tells.md` is the earlier list of ten). "Innovation" as part of the summit name is fine | The concrete verb: meet, apply, get a seat, learn |
| No stock CTAs ("Get started", "Learn more", "Ready to...?") | Action plus price: "Book Forum Access, $199" |
| No weightless slogans ("Build faster. Ship smarter.") | A line only GYN could use: a date, a city, a number, a name |
| No triads by reflex | Two or four, or one with a number |
| Sentence case for headings, labels and buttons | Display-face headings may be set in capitals by CSS |
| No eyebrow, pill or label above the hero H1 | Date and venue go below the H1 as plain text |
| No section numbers ("01 ·") | Number only real sequences: summit days, application steps, editions |
| No emoji, including flags | The country name |
| No invented testimonials or "Trusted by 10,000+" | Real names with permission, or nothing |
| Stats in a sentence with their source, or not at all | "Ambassadors in 11 countries" with the list below it |
| Nothing written for the developer ("built with Next.js") | Read every line as a delegate |

The logo tagline stays inside the logo only; it uses a word from the banned list, so it never appears as page copy.

Current violations to clean up: em dashes in visible text in `app/page.tsx` (summit switcher meta and alt text), `app/fms-thailand/page.tsx` (hero meta), `app/sism-2026/page.tsx` (seed grant line and schedule), `app/sism-2026/registration-cancelled/page.tsx`, page titles on the registered and cancelled pages, the form page descriptions, and the SismVideos titles. `app/fms-thailand/page.tsx` also puts a "PAST SUMMIT" label above the H1. `content/events.json` `navLabel` values contain flag emoji (nothing renders that field today; strip the emoji before anything does). The confirmation email in `lib/server/email.ts` names the event "9th SISM – Student International Summit in Medicine 2026"; it is the SDG Innovation Summit Malaysia 2026.
