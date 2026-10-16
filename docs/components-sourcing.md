# Premium components — source, licence and modifications

Every component in `components/premium/` is an original implementation.
Where a technique or pattern from another project was studied, it is recorded here.
No proprietary asset or code was copied. Adaptations of MIT-licensed concept code retain this notice.

---

## SplitReveal

| | |
|---|---|
| **Technique** | Overflow-hidden wrapper + translateY(100% → 0) line reveal |
| **Primary source** | Emil Kowalski, *animations.dev* — `clip-path: inset()` mask pattern (own course material, not MIT) |
| **Secondary source** | Codrops "Reveal animations with Intersection Observer" — MIT concept, no code copied |
| **Licence of source** | Concept only; own implementation, no licence required |
| **Modifications** | `useReducedMotion` opacity-only fallback; `sr-only` full-text for screen readers; per-line stagger configurable via props |

---

## MagneticButton

| | |
|---|---|
| **Technique** | `useSpring` tracking pointer offset relative to button centre |
| **Primary source** | Emil Kowalski, *animations.dev* — spring mouse interaction section |
| **Licence of source** | Concept; own implementation |
| **Modifications** | `matchMedia('(hover: hover) and (pointer: fine)')` guard (touch devices unaffected); `MAX_PULL` clamp prevents runaway offset; `whileTap` scale-down added |

---

## PageTransition

| | |
|---|---|
| **Technique** | `document.startViewTransition` wrapping `router.push()`. CSS `::view-transition-old/new` clip-path curtain |
| **Primary source** | MDN View Transitions API documentation (public domain) |
| **Secondary source** | Next.js App Router `useRouter` pattern (Next.js MIT licence — pattern, not code) |
| **Licence of source** | Public domain / MIT concept |
| **Modifications** | Modifier-key passthrough; external link passthrough; `useReducedMotion` disables CSS animation via media query in injected `<style>` |

---

## TicketRail

| | |
|---|---|
| **Technique** | Native CSS `scroll-snap-type: x mandatory` rail; active-tier indicator |
| **Primary source** | MDN CSS Scroll Snap (public domain) |
| **Licence of source** | Public domain |
| **Modifications** | Scroll-to-card via `scrollIntoView`; active index tracked from scroll position; dot indicators sync to scroll; `prefers-reduced-motion` disables smooth scroll and transitions |

---

## SummitSwitcher

| | |
|---|---|
| **Technique** | AnimatePresence directional `clip-path: inset()` wipe + image scale-settle + inline title-line mask reveal |
| **Primary source** | Emil Kowalski, *animations.dev* — `clip-path: inset()` hold/reveal animation |
| **Secondary source** | Codrops "Shape Slideshow with Clip-path" (tympanus.net/codrops) — MIT-licensed article concept (clip-path shapes for slide transitions). No code copied. |
| **Tertiary source** | WAI-ARIA Authoring Practices Guide — Carousel pattern |
| **Licence of source** | Concept; own implementation |
| **Modifications** | Directional wipe (left/right) via `AnimatePresence custom` prop; accent colour per summit; `useReducedMotion` falls back to opacity cross-fade; keyboard navigation on the region element |

---

## DeckSlider

| | |
|---|---|
| **Technique** | Motion `drag` with velocity-based dismiss on `dragEnd`; depth stack via `y`/`scale` offsets per card |
| **Primary source** | Emil Kowalski — velocity-based dismissal pattern (Sonner/Vaul, MIT concept, own implementation) |
| **Secondary source** | WAI-ARIA Authoring Practices Guide — Carousel pattern |
| **Licence of source** | MIT concept; own implementation |
| **Modifications** | Two-behind stack limit; `useMotionValue` + `useTransform` for drag rotation; `sr-only` `<ol>` fallback for screen readers; `prefers-reduced-motion` removes drag and rotation |

---

## HorizontalGallery

| | |
|---|---|
| **Technique** | `useScroll({ target, offset })` → `useTransform` for track `x`; sticky container; inner image parallax |
| **Primary source** | Motion.dev official tutorial — *Scroll pinning* (https://motion.dev/tutorials/js-scroll-pinning) — MIT concept, own implementation |
| **Secondary source** | 21st.dev Horizontal Scroll Gallery by @motiondotdev (MIT licence) — reference for card-sizing approach only, no code copied |
| **Licence of source** | MIT concept |
| **Modifications** | Inner-image parallax layer; `useScroll` target scoped to container; mobile/reduced-motion fallback to native `scroll-snap` row; progress bar via `scaleX` MotionValue |

---

## CoverflowVideos

| | |
|---|---|
| **Technique** | CSS `perspective` on parent + `rotateY` / `translateZ` / `scale` per card derived from index offset |
| **Primary source** | Emil Kowalski, *animations.dev* — `transform-style: preserve-3d` orbit/3D effects section |
| **Secondary source** | Coverflow concept — public-domain CSS technique; own implementation |
| **Licence of source** | Public domain / concept |
| **Modifications** | Drag-to-snap via Motion `drag`; `onOpen` callback pattern (page owns the modal); `prefers-reduced-motion` zeroes `rotateY` and `translateZ`; active item info panel below stage |
