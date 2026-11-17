import type { Metadata } from 'next'
import { getHome } from '@gyn/core/home-store'
import { getPublicEvent, listPublicEvents } from '@gyn/core/event-store'
import { eventRange } from '@/components/event/dates'
import { money } from '@/components/event/money'
import { cms } from '@/lib/cms'
import { Hero } from '@/components/landing/Hero'
import { About } from '@/components/landing/About'
import { NextEvent, type Category } from '@/components/landing/NextEvent'
import { WhatYouGet } from '@/components/landing/WhatYouGet'
import { Network } from '@/components/home/Network'
import { PastEvents } from '@/components/landing/PastEvents'
import { Voices } from '@/components/landing/Voices'
import { Closing } from '@/components/landing/Closing'

// The admin app tells this site to refresh when content is published; this is the safety net if that call is missed.
export const revalidate = 300

// RENDERED_AT is the server's render time (build time for this static page); Countdown hydrates from it.
const RENDERED_AT = Date.now()

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getHome()
  return { title: { absolute: seo.title }, description: seo.description, openGraph: { title: seo.title, description: seo.description } }
}

// GYN first, then its next event (the client found the old page read like one event's page). docs/frontend-design-plan.md.
// Speakers, programme and advisors belong to an event, so they move to the event pages.
export default async function HomePage() {
  const [c, summaries, { events: oldPrices }] = await Promise.all([
    getHome(),
    listPublicEvents(),
    cms.getEvents() as Promise<{ events: { id: string; ticketTypes?: { id: string; originalPrice?: number | null }[] }[] }>,
  ])
  // 'unlisted' types are private links (e.g. a discounted form), not shown to the public
  const countries = new Set(c.network.people.map((p) => p.country)).size
  const ambassadors = `${c.network.people.length} ambassadors in ${countries} countries`
  // The next event: the featured upcoming one, else the soonest (the store lists featured first). Its categories come from the database.
  const next = summaries.find((e) => e.timing === 'upcoming')
  const ev = next && (await getPublicEvent(next.slug))
  // The home editor's strip and event copy were written for one event; use it only while it is about this one, else state the plain facts.
  const stripName = c.strip.eventName.trim().toLowerCase()
  const written = !!ev && stripName !== '' && ev.name.toLowerCase().includes(stripName)
  // The old (crossed-out) fee is not stored with the category, so it still comes from the static event file.
  const was = new Map(oldPrices.find((o) => o.id === ev?.slug)?.ticketTypes?.map((t) => [t.id, t.originalPrice]))
  const categories: Category[] = (ev?.categories ?? []).map((k) => {
    const before = was.get(k.slug)
    return {
      id: k.slug,
      name: k.name,
      price: money(k.feeCents, k.currency),
      was: before && before * 100 > k.feeCents ? money(Math.round(before * 100), k.currency) : undefined,
      open: k.open,
      // shortcut: only SISM 2026 has a registration page per category (see components/event/Categories.tsx); other events go to their own page until phase 5 forms exist.
      href: ev?.slug === 'sism-2026' ? `/sism-${k.slug}` : `/${ev?.slug}#categories`,
    }
  })
  const strip = ev && !written
    ? { ...c.strip, eventName: ev.name, cohost: '', dateVenue: [eventRange(ev.startsAt, ev.endsAt, ev.timezone), ev.details.venue, ev.city].filter(Boolean).join(', ') }
    : c.strip
  const event = ev && !written
    ? { ...c.event, heading: `Next: *${ev.city || ev.name}*.`, primaryCta: { label: 'See the event', href: `/${ev.slug}` }, secondaryCta: { label: '', href: '/' }, note: '' }
    : c.event

  return (
    <main id="main">
      <Hero hero={c.hero} strip={c.strip} ambassadors={ambassadors} />
      {c.about.visible && <About data={c.about} />}
      {c.event.visible && ev && (
        <NextEvent event={event} strip={strip} categories={categories} target={ev.startsAt.getTime()} showSeats={written} serverNow={RENDERED_AT} />
      )}
      {c.benefits.visible && <WhatYouGet data={c.benefits} />}
      {c.network.visible && c.network.people.length > 0 && <Network data={c.network} tone="light" />}
      {c.past.visible && c.past.editions.length > 0 && <PastEvents data={c.past} />}
      {c.stories.visible && (c.stories.quotes.length > 0 || c.stories.videos.length > 0) && <Voices stories={c.stories} gallery={c.gallery} />}
      <Closing partners={c.partners} closing={c.closing} />
    </main>
  )
}
