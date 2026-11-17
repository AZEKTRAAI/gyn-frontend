import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { getPublicEvent, type PublicEvent } from '@gyn/core/event-store'
import { EVENT_SECTIONS, type EventPageContent, type EventSectionKey } from '@gyn/core/event-schema'
import { Ambassadors } from './Ambassadors'
import { Categories } from './Categories'
import { Chapters } from './Chapters'
import { Cta } from './Cta'
import { EventHero } from './EventHero'
import { Faq } from './Faq'
import { Gallery } from './Gallery'
import { Highlights } from './Highlights'
import { Overview } from './Overview'
import { Schedule } from './Schedule'
import { Speakers } from './Speakers'
import { Steps } from './Steps'
import { Stories } from './Stories'
import { Videos } from './Videos'

/** True when a section has nothing to show, so it is skipped even if it is switched on. */
function isEmpty(key: EventSectionKey, c: EventPageContent, ev: PublicEvent): boolean {
  switch (key) {
    case 'highlights': return c.highlights.items.length === 0
    case 'overview': return !c.overview.text
    case 'categories': return ev.categories.length === 0
    case 'steps': return c.steps.items.length === 0
    case 'ambassadors': return c.ambassadors.people.length === 0
    case 'chapters': return c.chapters.items.length === 0
    case 'schedule': return c.schedule.days.length === 0
    case 'speakers': return c.speakers.people.length === 0
    case 'gallery': return c.gallery.photos.length === 0
    case 'videos': return c.videos.items.length === 0
    case 'stories': return c.stories.quotes.length === 0
    case 'faq': return c.faq.items.length === 0
    case 'cta': return !c.cta.heading
    default: return false
  }
}

function section(key: EventSectionKey, c: EventPageContent, ev: PublicEvent, glow: boolean) {
  switch (key) {
    case 'highlights': return <Highlights key={key} data={c.highlights} />
    case 'overview': return <Overview key={key} data={c.overview} glow={glow} />
    case 'categories': return <Categories key={key} data={c.categories} categories={ev.categories} glow={glow} />
    case 'steps': return <Steps key={key} data={c.steps} glow={glow} />
    case 'ambassadors': return <Ambassadors key={key} data={c.ambassadors} />
    case 'chapters': return <Chapters key={key} data={c.chapters} glow={glow} />
    case 'schedule': return <Schedule key={key} data={c.schedule} glow={glow} />
    case 'speakers': return <Speakers key={key} data={c.speakers} glow={glow} />
    case 'gallery': return <Gallery key={key} data={c.gallery} glow={glow} />
    case 'videos': return <Videos key={key} data={c.videos} glow={glow} />
    case 'stories': return <Stories key={key} data={c.stories} glow={glow} />
    case 'faq': return <Faq key={key} data={c.faq} glow={glow} />
    case 'cta': return <Cta key={key} data={c.cta} />
    default: return null
  }
}

/** The visible sections in schema order. White and glow backgrounds alternate; the ambassadors map and the closing panel bring their own. */
function buildBody(c: EventPageContent, ev: PublicEvent) {
  let prevGlow: boolean = true
  const out: ReactNode[] = []
  for (const k of EVENT_SECTIONS) {
    if (k === 'seo' || k === 'hero') continue
    const s = c[k]
    if (('visible' in s && !s.visible) || isEmpty(k, c, ev)) continue
    const own = k === 'highlights' || k === 'ambassadors' || k === 'cta'
    const glow: boolean = own ? false : !prevGlow
    if (!own || k === 'ambassadors') prevGlow = glow
    out.push(section(k, c, ev, glow))
  }
  return out
}

// The page is rendered on the server and refreshed every 5 minutes; the countdown starts from this moment.
const renderedAt = () => Date.now()

/** Any published event, built from its stored sections in schema order. Unknown or unpublished slugs are a 404. */
export async function EventPage({ slug }: { slug: string }) {
  const ev = await getPublicEvent(slug)
  if (!ev) notFound()
  const c = ev.content
  const now = renderedAt()

  const body = buildBody(c, ev)

  return (
    <main id="main">
      <EventHero hero={c.hero} startsAt={ev.startsAt.getTime()} now={now} upcoming={ev.timing === 'upcoming'} />
      {body}
    </main>
  )
}

export async function eventMetadata(slug: string): Promise<Metadata> {
  const ev = await getPublicEvent(slug)
  if (!ev) return {}
  const { seo, hero } = ev.content
  const image = hero.photos[0]
  return {
    title: seo.title,
    description: seo.description,
    openGraph: { title: seo.title, description: seo.description, images: image ? [{ url: image.src, alt: image.alt }] : undefined },
  }
}
