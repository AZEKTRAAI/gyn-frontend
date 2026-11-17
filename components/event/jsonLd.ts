// schema.org Event structured data for an event page (SRS section 6). Pure functions so they can be tested without rendering.
import type { PublicEvent } from '@gyn/core/event-store'

const abs = (base: string, src: string) => (/^https?:\/\//.test(src) ? src : `${base}${src.startsWith('/') ? '' : '/'}${src}`)

export function eventJsonLd(ev: PublicEvent, base: string): Record<string, unknown> {
  const url = `${base}/${ev.slug}`
  const photo = ev.content.hero.photos[0]
  const offers = ev.timing === 'upcoming'
    ? ev.categories.filter((c) => c.open).map((c) => ({
        '@type': 'Offer',
        name: c.name,
        price: (c.feeCents / 100).toFixed(2),
        priceCurrency: c.currency,
        availability: 'https://schema.org/InStock',
        url,
        ...(c.closesAt && { validThrough: c.closesAt.toISOString() }),
      }))
    : []
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.name,
    // Date-only values are the dates the team entered, in the event's own time zone.
    startDate: ev.details.startsAt,
    endDate: ev.details.endsAt,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: ev.details.venue || ev.city,
      address: { '@type': 'PostalAddress', addressLocality: ev.city, addressCountry: ev.country },
    },
    ...(photo && { image: [abs(base, photo.src)] }),
    organizer: { '@type': 'Organization', name: 'Global Youth Network', url: base },
    url,
    ...(offers.length && { offers }),
  }
}

/** JSON for a <script type="application/ld+json">: `<` is escaped so event text can never close the tag. */
export const jsonLdString = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c')
