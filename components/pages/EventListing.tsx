import Image from 'next/image'
import Link from 'next/link'
import type { EventSummary } from '@gyn/core/event-store'
import { eventRange } from '@/components/event/dates'
import { cardRow } from '@/components/event/EventSection'
import { PageBox } from './PageBox'
import { PageSection } from './PageSection'
import s from './eventListing.module.css'

const COPY = {
  upcoming: {
    kicker: 'Upcoming events',
    title: 'Upcoming *events*',
    lead: 'Where GYN gathers next. Open an event to see its programme, speakers and how to register.',
    heading: 'Pick an *event*',
    empty: 'No upcoming events are announced right now. New ones appear here as soon as they are published.',
    other: { label: 'See past events', href: '/past-events' },
  },
  past: {
    kicker: 'Past events',
    title: 'Past *events*',
    lead: 'The summits GYN has hosted, with photos, videos and the delegates who were there.',
    heading: 'Where we have *been*',
    empty: 'No past events are published yet.',
    other: { label: 'See upcoming events', href: '/upcoming-events' },
  },
}

/** /upcoming-events and /past-events: a royal top box, then the events as cards (featured ones first, the order the store gives). */
export function EventListing({ kind, events }: { kind: 'upcoming' | 'past'; events: EventSummary[] }) {
  const c = COPY[kind]
  const list = events.filter((e) => e.timing === kind)
  return (
    <main id="main">
      <PageBox id={`${kind}-events-h1`} kicker={c.kicker} title={c.title} lead={c.lead} />
      <PageSection id="events" heading={c.heading} glow>
        {list.length === 0 ? (
          <div className={`glass-lite ${s.empty}`}>
            <p>{c.empty}</p>
            <Link href={c.other.href} className={s.link}>{c.other.label} <span aria-hidden="true">&rarr;</span></Link>
          </div>
        ) : (
          <ul className={s.cards} style={cardRow(list.length, 280, 360, 3)}>
            {list.map((e, i) => (
              <li key={e.slug} className={`glass-lite ${s.card}`}>
                {e.cardImage && (
                  <div className={s.photo}>
                    <Image src={e.cardImage.src} alt={e.cardImage.alt} fill sizes="(max-width: 640px) 100vw, 360px" priority={i === 0} style={{ objectFit: 'cover' }} />
                  </div>
                )}
                <div className={s.body}>
                  {(e.featured || (kind === 'upcoming' && e.registration)) && (
                    <p className={s.pills}>
                      {e.featured && <span className={s.pill}>Featured</span>}
                      {kind === 'upcoming' && e.registration && (
                        <span className={`${s.pill} ${e.registration === 'open' ? s.pillOpen : ''}`}>{e.registration === 'open' ? 'Registration open' : 'Registration closed'}</span>
                      )}
                    </p>
                  )}
                  <h3 className={s.name}>
                    <Link href={`/${e.slug}`} className={s.stretch}>{e.name}</Link>
                  </h3>
                  <p className={s.when}>{eventRange(e.startsAt, e.endsAt, e.timezone)}</p>
                  {(e.city || e.country) && <p className={s.where}>{[e.city, e.country].filter(Boolean).join(', ')}</p>}
                  {e.lead && <p className={s.lead}>{e.lead}</p>}
                  <span className={s.more} aria-hidden="true">View event &rarr;</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {list.length > 0 && <p className={s.other}><Link href={c.other.href} className={s.link}>{c.other.label} <span aria-hidden="true">&rarr;</span></Link></p>}
      </PageSection>
    </main>
  )
}
