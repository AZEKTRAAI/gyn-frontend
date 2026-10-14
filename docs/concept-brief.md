# Design-direction concepts: shared brief

Goal: four homepage prototypes, one per direction, that Azam's team compares side by side to pick a direction before the Next.js build. They're published together as one hosted page on claude.ai, and that host imposes hard technical limits (below). Each concept must feel like a finished, award-level site rather than a wireframe. They should differ from each other in **layout, type, motion and mood**, while sharing the same content and logo palette.

## Read first
1. `content/pages/home.md`, `content/pages/sism-2026.md`, `content/events.json`, `content/sitemap.json`, `content/media.json`. Every word on the page comes from these, verbatim or lightly trimmed. Never invent copy, stats, quotes, partners or claims. Allowed numbers are only ones in content (e.g. 100 seats, 30 scholarships, 15 fully + 15 partially funded, 4 SDGs, $1,000 seed grant, $199/$399/$49, 19–22 Nov 2026, the count of ambassadors and advisors shown).
2. `design/palette.md` + `design/tokens/tokens.css`: brand palette and contrast rules. Use these hex values. Orange is never body text on light. The old yellow `#FEFF00` must not appear.
3. `docs/benchmarks.md` §4: your direction's description, references and risk.
4. `docs/personas.md`: Amina (first-time applicant, mobile), Daniel (returning delegate), Dr. Farah (partner).
5. Design skills, read and apply: `~/.claude/skills/taste-skill/SKILL.md` (state a "Design Read" + dials in an HTML comment at top), `~/.claude/skills/emil-design-eng/SKILL.md` (easing, durations, hover/press polish), `~/.claude/skills/impeccable/SKILL.md`.

## Content the concept must show (homepage)
- Header: GYN logo (`assets/logos/gyn-logo.png`; on dark backgrounds put it on a light chip or use CSS to adapt), the real nav (Home, Past Events → FMS Thailand, Upcoming Events → SIS Malaysia 2026, About Us, Contact Us), a primary CTA.
- Hero: SDG Innovation Summit Malaysia 2026, 19–22 Nov 2026, Teedo Hotel, Kuala Lumpur, co-hosted by UNU Global Health. **Truthful state:** scholarship applications closed 11 Oct 2026; results 16 Oct; confirmed seats (Forum Access $199, Self Funded $399, Invitation Letter $49) still open. The countdown, if any, counts to the summit start (19 Nov 2026), not the expired deadline.
- Who we are + the six "what we do" items.
- 4 focus SDGs (4, 5, 9, 13) with official UN colours from tokens.css.
- SISM 2026 block: what it is, ticket tiers (scholarships shown as closed, confirmed-seat tiers open with price + includes), $1,000 seed grant, APU visit.
- Speakers (8, `assets/speakers/`), advisory board (8, `assets/advisors/`), global ambassadors (12 with country, `assets/ambassadors/`).
- Videos: custom thumbnail cards from `assets/video/<youtubeId>.jpg` with titles from media.json; clicking opens a **branded modal** (our own chrome: title, category, "Watch on YouTube" link out). Iframes are blocked on the host, so no embed. Make the modal look like the real player will.
- Gallery from `assets/gallery/` (real FMS Thailand photos), partner logos strip, UNU Global Health co-host logo, footer with socials, policies, contact@thegyn.org, WhatsApp.

## Hard technical limits (the host enforces these)
- Output **one file**: `concepts/<slug>.html`, a complete standalone document (`<!doctype html>`, `<html lang="en">`, head with charset + viewport `width=device-width, initial-scale=1, viewport-fit=cover`, `<title>`).
- Images: only relative paths under `assets/` (the folder next to your file). No external image URLs, no hotlinking.
- Fonts: Google Fonts `<link>` only, with real fallback stacks.
- Scripts: only from `https://cdnjs.cloudflare.com` (preferred), `https://cdn.jsdelivr.net/npm/`, or `https://unpkg.com`, pinned to an exact version (e.g. `three@0.160.0`), never `@latest`. No ES-module imports from other hosts. Everything else is inline. Prefer zero libraries; use one only if it does real work (e.g. three.js for a 3D hero).
- No iframes, no `alert/confirm/prompt`, no `window.print`. Forms `preventDefault()`.
- `mailto:`/`tel:` links are unreliable on the host, so show the address as visible text too.
- Keep the HTML under ~200 KB.

## Quality bar
- Mobile-first; must look intentional at 375, 768, 1024 and 1440 px. No horizontal page scroll at any width. Side gutter ≥16px.
- Light and dark: define colour tokens on `:root`, redefine under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }` and `:root[data-theme="dark"] {…}`, `body` has an explicit token background. A dark-first direction may mirror this (dark on bare `:root`). Include a small theme toggle.
- `prefers-reduced-motion`: all motion off or reduced; 3D replaced by a static poster.
- **Complete at rest:** everything readable is visible on load. Reveal animations start from a visible state; never leave content at `opacity:0` waiting for an IntersectionObserver.
- Accessibility: semantic landmarks, one h1, alt text with real names, visible focus rings, keyboard-operable modal (Esc closes, focus trap, focus returns), contrast per palette.md.
- Avoid AI-default looks: no purple gradients, no Inter/Space Grotesk, no emoji section markers, no everything-centred, no identical rounded cards everywhere, no "01/02/03" numbering unless the content is a real sequence.
- A small fixed pill in a corner: "Direction <letter> · <name>" with a link "All directions" → `index.html`. Keep it discreet; it's for the team review.

## Return
A 6-line summary: file path, fonts, signature interaction, libraries + versions, what you'd do differently in the real Next.js build, any compromise you made.
