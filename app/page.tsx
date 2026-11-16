import type { Metadata } from 'next'
import { getHome } from '@gyn/core/home-store'
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
  const [c, { events }] = await Promise.all([getHome(), cms.getEvents() as Promise<{ events: { id: string; ticketTypes?: Category[] }[] }>])
  // 'unlisted' types are private links (e.g. a discounted form), not shown to the public
  const countries = new Set(c.network.people.map((p) => p.country)).size
  const ambassadors = `${c.network.people.length} ambassadors in ${countries} countries`
  const categories = (events.find((e) => e.id === 'sism-2026')?.ticketTypes ?? []).filter((t) => t.status !== 'unlisted')

  return (
    <main id="main">
      <Hero hero={c.hero} strip={c.strip} ambassadors={ambassadors} />
      {c.about.visible && <About data={c.about} />}
      {c.event.visible && <NextEvent event={c.event} strip={c.strip} categories={categories} serverNow={RENDERED_AT} />}
      {c.benefits.visible && <WhatYouGet data={c.benefits} />}
      {c.network.visible && c.network.people.length > 0 && <Network data={c.network} tone="light" />}
      {c.past.visible && c.past.editions.length > 0 && <PastEvents data={c.past} />}
      {c.stories.visible && (c.stories.quotes.length > 0 || c.stories.videos.length > 0) && <Voices stories={c.stories} gallery={c.gallery} />}
      <Closing partners={c.partners} closing={c.closing} />
    </main>
  )
}
