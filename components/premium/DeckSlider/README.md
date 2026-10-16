# DeckSlider

Photo-card stack for speakers or advisors. The top card is draggable; a fast flick or a drag past 80 px dismisses it and advances the deck. Subsequent cards rise from behind with spring physics.

Prev/Next buttons and ArrowLeft/Right keyboard shortcuts. Screen readers see a flat `<ol>` list.

## Usage

```tsx
import { DeckSlider, type Speaker } from '@/components/premium/DeckSlider';

const speakers: Speaker[] = [
  {
    id: 'ada',
    name: 'Ada Okafor',
    role: 'SDG Ambassador',
    organisation: 'UN Environment Programme',
    imageSrc: '/assets/speakers/ada.jpg',
    topic: 'Finance mechanisms for climate adaptation',
  },
];

<DeckSlider items={speakers} heading="Summit speakers" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Speaker[]` | required | Speaker objects |
| `heading` | `string` | `"Speakers"` | Used in aria-label and sr-only list label |

## Speaker shape

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | yes | |
| `name` | `string` | yes | |
| `role` | `string` | yes | |
| `organisation` | `string` | yes | |
| `imageSrc` | `string` | yes | Portrait, 3:4 ratio |
| `imageAlt` | `string` | no | Defaults to `name` |
| `topic` | `string` | no | Shown only on active card |

## a11y notes

- `role="region"` + `aria-roledescription="carousel"`.
- Keyboard focus on the region; ArrowLeft/Right navigate.
- `sr-only` `<ol>` with `aria-current` on active item.
- `aria-live="polite"` announces active speaker name on change.
- `prefers-reduced-motion`: no drag, no rotate — plain stacked divs, buttons still work.

## Source / inspiration

- Velocity-based dismiss: Emil Kowalski / Sonner (own implementation, concept MIT)
- Stack depth: rotateY/scale per depth offset — standard card-stack pattern
- `dragConstraints` + `dragElastic`: Motion (Framer) drag API
