import type { MetadataRoute } from 'next'
import { listPublicEvents } from '@gyn/core/event-store'

// Events published after the build show up within the hour.
export const revalidate = 3600

// Fixed pages only. /pitch, /sism-2026/registered, /sism-2026/registration-cancelled and /api are deliberately absent.
const FIXED = [
  'upcoming-events', 'past-events', 'about-us', 'contact-us', 'videos', 'sism-forum-access', 'sism-self-funded', 'sism-invitation-letter',
  'privacy-policy', 'refund-policy', 'terms-conditions',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = (process.env.NEXT_PUBLIC_BASE_URL || 'https://thegyn.org').replace(/\/$/, '')
  const events = await listPublicEvents()
  // No lastModified: neither the fixed pages nor EventSummary carry a trustworthy edit date, and a wrong one is worse than none.
  return [
    { url: `${origin}/`, changeFrequency: 'weekly', priority: 1 },
    ...events.map((e) => ({ url: `${origin}/${e.slug}`, changeFrequency: 'weekly' as const, priority: 0.9 })),
    ...FIXED.map((slug) => ({ url: `${origin}/${slug}`, changeFrequency: 'monthly' as const, priority: 0.5 })),
  ]
}
