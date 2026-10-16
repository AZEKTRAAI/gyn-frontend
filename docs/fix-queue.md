# Front-end fix queue

Collected from the docs review (README/handoff writer) on 16 Oct. Red team pass 2 findings get merged in when they land. Picked up after the Lighthouse fixes finish, since they touch the same files.

## Accessibility
- [ ] 7 CSS variables used but never defined in `:root`: `--n-50`, `--n-300`, `--n-500`, `--n-800`, `--n-900`, `--navy-300`, `--leaf-600`
- [ ] Yellow focus ring is 1.6:1 on white; needs a two-tone ring that passes 3:1 on every background
- [ ] `.t-b` stat labels at 4.12:1 (small text needs 4.5:1)
- [ ] Inline `outline: none` hides focus on all form inputs and the three carousels
- [ ] `SismVideos` opens a non-modal dialog: Esc does nothing, no focus trap (use `showModal()`)
- [ ] `CountryTablist` has no arrow-key navigation (WAI-ARIA tabs pattern)
- [ ] Skip link probably never shows on focus (`.sr-only` in globals.css sits outside Tailwind layers and beats `focus:not-sr-only`); check in a browser
- [ ] 768px breakpoint overlaps between `max-width: 768px` and `min-width: 768px` rules

## Truth and content
- [ ] `/fms-thailand`: two speaker images 404 (`/media/advisory/wenbo-li.webp`, `/media/speakers/sura-fitiani.jpg`); speakers without headshots get a gallery photo instead of an initials tile
- [ ] `SismVideos` labels past delegates "SISM 2026 delegate" (they were at FMS Thailand)
- [ ] "PAST SUMMIT" label sits above the H1 on `/fms-thailand`
- [ ] Em dashes in visible copy we wrote on about 10 pages/components (client copy stays verbatim)
- [ ] Sticky mobile "Book a seat" bar from D38 doesn't exist on `/sism-2026`
- [ ] Contact form needs the Turnstile widget when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set
- [ ] Several pages hardcode `/media/...` paths instead of using `features/media/media.ts`

## Consistency and cleanup
- [ ] Two easing curves in use; standardise on `cubic-bezier(0.23, 1, 0.32, 1)`
- [ ] Dead files: `components/SummitsSwapper.tsx`, `components/VideoModal.tsx`, `public/renders/ribbons.*` (about 3 MB)

## From red team pass 2 (docs/redteam.md, RT-045 to RT-074)
- [x] RT-045 optional "how did you hear" blocked the paid form (fixed in the schema, 3acaa81)
- [ ] RT-046 to RT-074 except RT-058 (config agent): work through every blocker, high and medium in docs/redteam.md Pass 2
