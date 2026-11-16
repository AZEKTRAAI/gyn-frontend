import Link from 'next/link'
import type { HomeContent } from '@gyn/core/home-schema'
import { countdownTarget } from '@gyn/core/home-schema'
import { Countdown } from '@/components/Countdown'
import { Accent } from './Accent'
import s from './landing.module.css'

export interface Category {
  id: string
  name: string
  price: number
  originalPrice?: number | null
  status: string
}

// shortcut: categories and their page links come from content/events.json and the /sism-<id> booking pages;
// replace with the featured Event's registration categories from the database in phase 4.
const sentence = (t: string) => t.charAt(0) + t.slice(1).toLowerCase()
const money = (n: number) => `$${n % 1 ? n.toFixed(2) : n}`

/** The featured upcoming event, as one section of GYN's page rather than the whole page. */
export function NextEvent({
  event,
  strip,
  categories,
  serverNow,
}: {
  event: HomeContent['event']
  strip: HomeContent['strip']
  categories: Category[]
  serverNow: number
}) {
  const { total, full, partial } = event.seats
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / total) * 100))}%`
  return (
    <section id="next" className={s.tight} data-name={`Next: ${strip.eventName}`} aria-labelledby="next-h2">
      <div className="wrap">
        <div className={s.nextCard}>
          <div className={s.nextMain}>
            <p className={s.kickerDark}>{event.kicker}</p>
            <h2 id="next-h2" className={s.h2}><Accent text={event.heading} dark /></h2>
            <p className={s.nextName}>{strip.eventName}</p>
            <p className={s.nextMeta}>{strip.dateVenue}</p>
            {strip.cohost && <p className={s.nextMeta}>{strip.cohost}</p>}
            <div className={s.countdown}>
              <Countdown serverNow={serverNow} target={countdownTarget(event)} />
            </div>
            <div className={s.ctas}>
              <Link href={event.primaryCta.href} className="btn btn-y">
                {event.primaryCta.label} <span aria-hidden="true">&rarr;</span>
              </Link>
              {event.secondaryCta.label && (
                <Link href={event.secondaryCta.href} className="btn btn-ow">{event.secondaryCta.label}</Link>
              )}
            </div>
          </div>

          <div className={s.nextSide}>
            <p className={s.sideLabel}>Ways in</p>
            <ul className={s.cats}>
              {categories.map((c) => {
                const open = c.status === 'open'
                const inner = (
                  <>
                    <span className={s.catName}>{sentence(c.name)}</span>
                    <span className={s.catPrice}>
                      {c.originalPrice ? <s className={s.catWas}>{money(c.originalPrice)}</s> : null}
                      {open ? money(c.price) : 'Closed'}
                    </span>
                  </>
                )
                return (
                  <li key={c.id} className={`glass-dark ${s.cat} ${open ? '' : s.catClosed}`}>
                    {open ? <Link href={`/sism-${c.id}`} className={s.catLink}>{inner}<span aria-hidden="true">&rarr;</span></Link> : <div className={s.catLink}>{inner}</div>}
                  </li>
                )
              })}
            </ul>

            <div className={s.seats} aria-label={`${total} seats: ${event.seats.fullLabel}, ${event.seats.partialLabel}, ${event.seats.restLabel}`}>
              <div className={s.seatBar} aria-hidden="true">
                <span style={{ width: pct(full) }} />
                <span style={{ width: pct(partial) }} />
                <span />
              </div>
              <ul className={s.seatKey} aria-hidden="true">
                <li>{event.seats.fullLabel}</li>
                <li>{event.seats.partialLabel}</li>
                <li>{event.seats.restLabel}</li>
              </ul>
            </div>
            {event.note && <p className={s.small}>{event.note}</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
