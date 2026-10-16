# SummitSwitcher

Full-width slide set for switching between summits (e.g. FMS Thailand past, SISM Malaysia next).

**Transition effect:** A clip-path horizontal wipe in the incoming summit's accent colour, with the hero image scaling from 1.07 → 1.0 and the title lines revealing line-by-line from an overflow mask.

Autoplay is off by default.

## Usage

```tsx
import { SummitSwitcher, type Summit } from '@/components/premium/SummitSwitcher';

const summits: Summit[] = [
  {
    id: 'fms-2024',
    label: 'FMS Thailand 2024',
    title: ['Future Makers', 'Summit Thailand'],
    meta: 'Chiang Mai, Thailand · October 2024',
    imageSrc: '/assets/fms-thailand-hero.jpg',
    imageAlt: 'Delegates at the Future Makers Summit in Chiang Mai',
    accentColor: '#00689D',
    status: 'Past summit',
    cta: { label: 'View highlights', href: '/fms-thailand' },
  },
  {
    id: 'sism-2026',
    label: 'SISM Malaysia 2026',
    title: ['SDG Innovation', 'Summit Malaysia'],
    meta: 'Kuala Lumpur, Malaysia · 19 Nov 2026',
    imageSrc: '/assets/sism-kl-hero.jpg',
    imageAlt: 'Kuala Lumpur skyline at dusk',
    accentColor: '#0A97D9',
    status: 'Next summit',
    cta: { label: 'Register, from $199', href: '/sism-2026' },
  },
];

<SummitSwitcher summits={summits} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `summits` | `Summit[]` | required | Two or more summit objects |
| `autoplay` | `boolean` | `false` | Enable auto-advance |
| `autoplayInterval` | `number` | `6000` | Advance interval in ms |

## a11y notes

- `role="region"` with `aria-roledescription="carousel"`.
- Slide region is keyboard-focusable; ArrowLeft/Right navigate.
- Tab buttons use `role="tab"` + `aria-selected`.
- `aria-live="polite"` announces current slide to screen readers.
- `prefers-reduced-motion`: clip-path wipe and scale replaced with plain opacity cross-fade.

## Source / inspiration

- Clip-path horizontal wipe: Emil Kowalski, animations.dev (`clip-path: inset()` animation)
- Codrops "Shape Slideshow with Clip-path" (concept, no code copied; MIT)
- WAI-ARIA Authoring Practices Guide — Carousel Pattern
