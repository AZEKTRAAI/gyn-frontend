# TicketRail

Ticket-tier display. Mobile: scroll-snap rail with active indicator and peeking neighbours. Desktop (md+): static flex row.

Price is always the largest typographic element. Active tier highlighted with `--yellow` border.

## Usage

```tsx
import { TicketRail, type Tier } from '@/components/premium/TicketRail';

const tiers: Tier[] = [
  {
    id: 'forum',
    name: 'Forum Access',
    price: '$199',
    description: 'Full access to the two-day summit.',
    features: ['Summit sessions', 'Networking dinner', 'Digital certificate'],
    cta: 'Book Forum Access, $199',
    ctaHref: '/sism-2026/forum-access',
  },
  {
    id: 'funded',
    name: 'Fully Funded',
    price: 'Funded',
    description: 'Scholarship covering flights and accommodation.',
    features: ['All Forum Access perks', 'Flights & hotel', 'Mentorship track'],
    cta: 'Application closed',
    ctaHref: '#',
    closed: true,
  },
];

<TicketRail tiers={tiers} defaultActive={0} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tiers` | `Tier[]` | required | Array of tier objects |
| `defaultActive` | `number` | first `featured` or `0` | Initially highlighted tier |

## Tier shape

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | yes | Unique key |
| `name` | `string` | yes | Display name |
| `price` | `string` | yes | Rendered at display size |
| `priceLabel` | `string` | no | Sub-price note (e.g. "per delegate") |
| `description` | `string` | yes | One sentence |
| `features` | `string[]` | yes | Bullet list |
| `cta` | `string` | yes | Say the action and price |
| `ctaHref` | `string` | yes | Link destination |
| `featured` | `boolean` | no | Dark background variant |
| `closed` | `boolean` | no | Disables CTA |

## a11y notes

- Container is `role="list"`, cards are `role="listitem"`.
- Active card has `aria-current="true"`.
- Closed CTA has `aria-disabled` and `tabIndex=-1`.
- Dot buttons have `aria-label="Go to tier N"`.
- `prefers-reduced-motion`: `scrollBehavior: auto` and no transition on indicator.
