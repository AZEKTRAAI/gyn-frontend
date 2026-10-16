# HorizontalGallery

Sticky section: vertical scroll drives a horizontal photo track with inner-image parallax and a progress bar.

Mobile (< 768 px) and `prefers-reduced-motion`: falls back to a native CSS `scroll-snap` horizontal row — no JS, no stickiness.

## Usage

```tsx
import { HorizontalGallery, type GalleryPhoto } from '@/components/premium/HorizontalGallery';

const photos: GalleryPhoto[] = [
  { id: '1', src: '/assets/gallery/sism-01.jpg', alt: 'Opening ceremony', caption: 'Opening ceremony, KL 2026' },
  { id: '2', src: '/assets/gallery/sism-02.jpg', alt: 'Panel discussion' },
];

<HorizontalGallery photos={photos} heading="From the summit floor" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `photos` | `GalleryPhoto[]` | required | Gallery images |
| `heading` | `string` | — | Section heading |

## GalleryPhoto shape

| Field | Type | Required |
|-------|------|----------|
| `id` | `string` | yes |
| `src` | `string` | yes |
| `alt` | `string` | yes |
| `caption` | `string` | no |

## Performance notes

- Track uses `transform: translateX()` (GPU-composited, no layout).
- Image parallax via `transform: translateX()` on the image wrapper.
- `willChange: 'transform'` on the track only.
- Mobile fallback uses no JS scroll listeners.

## a11y notes

- Progress bar is `aria-hidden`.
- All images have meaningful `alt` text.
- `prefers-reduced-motion`: sticky scroll-drive is disabled; plain row is shown.

## Source / inspiration

- Motion.dev official tutorial: [Scroll pinning](https://motion.dev/tutorials/js-scroll-pinning) — `useScroll` + sticky container pattern (own implementation)
- 21st.dev Horizontal Scroll Gallery component (MIT) — reference for card sizing approach
