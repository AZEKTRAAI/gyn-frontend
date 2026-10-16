# MagneticButton

Subtle pointer-attraction effect for primary CTAs. The button drifts toward the cursor; springs back on leave.

**Only activates** on `(hover: hover) and (pointer: fine)` — desktop mice only. Touch and reduced-motion users see a plain button.

## Usage

```tsx
import { MagneticButton } from '@/components/premium/MagneticButton';

<MagneticButton className="btn btn-y" onClick={handleRegister}>
  Register now
</MagneticButton>
```

## Props

Extends all `HTMLButtonElement` attributes.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Button label / content |
| `innerClassName` | `string` | Class on the inner `<span>` (for layout separation from the magnetic wrapper) |

## a11y notes

- Renders a native `<button>` — keyboard and screen-reader behaviour unchanged.
- No visual change except subtle translation; no focus-state disruption.
- `whileTap` scale does not affect keyboard activation.

## Source / inspiration

- Emil Kowalski, animations.dev — `useSpring` mouse tracking pattern
- MAX_PULL clamping and `pointer: fine` guard are own additions
