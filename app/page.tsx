import type { Metadata } from 'next'
import { getHome } from '@/features/home/store'
import { FloatingPill } from '@/components/home/FloatingPill'
import { Hero } from '@/components/home/Hero'
import { EventStrip } from '@/components/home/EventStrip'
import { Benefits } from '@/components/home/Benefits'
import { Network } from '@/components/home/Network'
import { PastSummit } from '@/components/home/PastSummit'
import { EventBand } from '@/components/home/EventBand'
import { Speakers } from '@/components/home/Speakers'
import { Programme } from '@/components/home/Programme'
import { Advisors } from '@/components/home/Advisors'
import { Wall } from '@/components/home/Wall'
import { Stories } from '@/components/home/Stories'
import { Partners } from '@/components/home/Partners'
import { Closing } from '@/components/home/Closing'

// RENDERED_AT is the server's render time (build time for this static page); Countdown hydrates from it.
const RENDERED_AT = Date.now()

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getHome()
  return { title: { absolute: seo.title }, description: seo.description, openGraph: { title: seo.title, description: seo.description } }
}

// Direction J "Echo stack": every section reads from HomeContent (features/home/schema.ts), edited at /admin/home.
export default async function HomePage() {
  const c = await getHome()
  return (
    <main id="main">
      <FloatingPill apply={c.hero.primaryCta} />
      <Hero hero={c.hero} />
      <EventStrip strip={c.strip} />
      {c.benefits.visible && <Benefits data={c.benefits} />}
      {c.network.visible && c.network.people.length > 0 && <Network data={c.network} />}
      {c.past.visible && c.past.editions.length > 0 && <PastSummit data={c.past} />}
      {c.event.visible && <EventBand data={c.event} serverNow={RENDERED_AT} />}
      {c.speakers.visible && c.speakers.people.length > 0 && <Speakers data={c.speakers} />}
      {c.programme.visible && c.programme.days.length > 0 && <Programme data={c.programme} />}
      {c.advisors.visible && c.advisors.people.length > 0 && <Advisors data={c.advisors} />}
      {c.gallery.visible && c.gallery.items.length > 0 && <Wall data={c.gallery} />}
      {c.stories.visible && (c.stories.quotes.length > 0 || c.stories.videos.length > 0) && <Stories data={c.stories} />}
      {c.partners.visible && <Partners data={c.partners} />}
      {c.closing.visible && <Closing data={c.closing} />}
    </main>
  )
}
