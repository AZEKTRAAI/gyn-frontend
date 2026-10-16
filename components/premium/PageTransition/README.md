# PageTransition

Vertical curtain route transition using the View Transitions API. The outgoing page wipes upward, the incoming page reveals downward, both in SDG-14 ocean blue. No-op on unsupported browsers.

## Setup

1. Add `<ViewTransitionStyles />` once in `app/layout.tsx`:

```tsx
import { ViewTransitionStyles } from '@/components/premium/PageTransition';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ViewTransitionStyles />
        {children}
      </body>
    </html>
  );
}
```

2. Replace `<Link>` with `<TransitionLink>` for internal navigation:

```tsx
import { TransitionLink } from '@/components/premium/PageTransition';

<TransitionLink href="/sism-2026" className="btn btn-y">
  See the programme
</TransitionLink>
```

## a11y notes

- `prefers-reduced-motion`: CSS `animation: none` on both view-transition pseudos.
- Modifier-key clicks (Ctrl, Meta, Shift) fall through to the browser default.
- External links fall through unchanged.

## Browser support

- Chrome 111+, Edge 111+, Safari 18+: full support.
- Firefox 130+ (behind flag until stable): graceful no-op.
- Browsers without `document.startViewTransition`: normal `router.push()`.

## Source / inspiration

- MDN: [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- Next.js App Router `useRouter` + `router.push` pattern
