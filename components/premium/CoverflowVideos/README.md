# CoverflowVideos

Centred video-thumbnail carousel with CSS 3D perspective. Side items rotate on the Y-axis and recede. Drag or use buttons to navigate. The active item shows title and category. Enter/click on the active card fires `onOpen` so the page can open a modal player.

## Usage

```tsx
import { CoverflowVideos, type VideoItem } from '@/components/premium/CoverflowVideos';

const videos: VideoItem[] = [
  {
    id: 'keynote',
    title: 'Opening keynote: SDGs in 2026',
    category: 'Keynote',
    thumbnailSrc: '/assets/video/keynote-thumb.jpg',
    duration: '22:14',
  },
];

function Page() {
  const [open, setOpen] = useState<VideoItem | null>(null);

  return (
    <>
      <CoverflowVideos items={videos} onOpen={setOpen} heading="Summit sessions" />
      {open && <VideoModal item={open} onClose={() => setOpen(null)} />}
    </>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `VideoItem[]` | required | Video objects |
| `onOpen` | `(item: VideoItem) => void` | required | Called when active item is activated |
| `heading` | `string` | `"Videos"` | aria-label |

## VideoItem shape

| Field | Type | Required |
|-------|------|----------|
| `id` | `string` | yes |
| `title` | `string` | yes |
| `category` | `string` | yes |
| `thumbnailSrc` | `string` | yes |
| `thumbnailAlt` | `string` | no |
| `duration` | `string` | no |

## a11y notes

- `role="region"` + `aria-roledescription="carousel"`.
- Active card has `role="button"` with `aria-label="Play: [title]"`.
- `aria-live="polite"` announces active item on change.
- ArrowLeft/Right/Enter/Space are handled on the region.
- `prefers-reduced-motion`: `rotateY` and `translateZ` are set to 0; flat 2D carousel only.

## Source / inspiration

- CSS `transform-style: preserve-3d` + `perspective` on parent — Emil Kowalski, animations.dev (3D transforms section)
- Coverflow concept: standard CSS 3D technique (no library); own implementation
