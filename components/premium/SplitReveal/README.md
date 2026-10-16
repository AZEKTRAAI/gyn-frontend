# SplitReveal

Line-by-line mask reveal for section H2s. Triggers once on first scroll entry; never re-triggers.

## Usage

```tsx
import { SplitReveal } from '@/components/premium/SplitReveal';

<SplitReveal
  lines={['Where young leaders', 'shape tomorrow']}
  as="h2"
  delay={100}
  stagger={70}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lines` | `string[]` | required | One entry per visual line |
| `as` | `h1\|h2\|h3\|p` | `h2` | Wrapper element |
| `delay` | `number` | `0` | Pre-animation delay in ms |
| `stagger` | `number` | `70` | Per-line stagger in ms |
| `className` | `string` | — | Applied to the wrapper |

## a11y notes

- Wrapper element contains a `sr-only` span with the full text for screen readers.
- Animated spans are `aria-hidden`.
- `useReducedMotion` swaps motion for a plain opacity fade.

## Source / inspiration

Overflow-hidden curtain reveal — standard typographic reveal pattern documented in:
- Emil Kowalski, animations.dev (clip-path inset / translateY mask technique)
- Codrops "Reveal animations with Intersection Observer" (MIT-licensed concept)

No third-party code copied. Own implementation.
