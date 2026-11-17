import Link from 'next/link'
import type { HomeContent } from '@gyn/core/home-schema'
import { Countdown } from '@/components/Countdown'
import { Accent } from './Accent'
import s from './landing.module.css'

/** One of the next event's registration categories: fee, the old fee if it was cut, open or closed, and where it leads. */
export interface Category {
  id: string
  name: string
  price: string
  was?: string
  open: boolean
  href: string
}

const sentence = (t: string) => t.charAt(0) + t.slice(1).toLowerCase()

/** The next event (featured, else soonest), as one section of GYN's page rather than the whole page. `target` is its start in ms. */
export function NextEvent({
  event,
  strip,
  categories,
  target,
  showSeats,
  serverNow,
}: {
  event: HomeContent['event']
  strip: HomeContent['strip']
  categories: Category[]
  target: number
  /** The seat bar is the home editor's text for one event; hide it when the event is another. */
  showSeats: boolean
  serverNow: number
}) {
  const { total, full, partial } = event.seats
  // An event with no categories and no editor copy has nothing for the right half: centre the left one instead.
  const alone = categories.length === 0 && !showSeats && !event.note
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / total) * 100))}%`
  return (
    <section id="next" className={s.tight} data-name={`Next: ${strip.eventName}`} aria-labelledby="next-h2">
      <div className="wrap">
        <div className={s.nextCard} style={alone ? { gridTemplateColumns: '1fr', justifyItems: 'center', textAlign: 'center' } : undefined}>
          <div className={s.nextMain}>
            <p className={s.kickerDark}>{event.kicker}</p>
            <h2 id="next-h2" className={s.h2}><Accent text={event.heading} dark /></h2>
            <p className={s.nextName}>{strip.eventName}</p>
            <p className={s.nextMeta}>{strip.dateVenue}</p>
            {strip.cohost && <p className={s.nextMeta}>{strip.cohost}</p>}
            <div className={s.countdown}>
              <Countdown serverNow={serverNow} target={target} />
            </div>
            <div className={s.ctas} style={alone ? { justifyContent: 'center' } : undefined}>
              <Link href={event.primaryCta.href} className="btn btn-y">
                {event.primaryCta.label} <span aria-hidden="true">&rarr;</span>
              </Link>
              {event.secondaryCta.label && (
                <Link href={event.secondaryCta.href} className="btn btn-ow">{event.secondaryCta.label}</Link>
              )}
            </div>
          </div>

          {!alone && <div className={s.nextSide}>
            {categories.length > 0 && <p className={s.sideLabel}>Ways in</p>}
            <ul className={s.cats}>
              {categories.map((c) => {
                const open = c.open
                const inner = (
                  <>
                    <span className={s.catName}>{sentence(c.name)}</span>
                    <span className={s.catPrice}>
                      {c.was ? <s className={s.catWas}>{c.was}</s> : null}
                      {open ? c.price : 'Closed'}
                    </span>
                  </>
                )
                return (
                  <li key={c.id} className={`glass-dark ${s.cat} ${open ? '' : s.catClosed}`}>
                    {open ? <Link href={c.href} className={s.catLink}>{inner}<span aria-hidden="true">&rarr;</span></Link> : <div className={s.catLink}>{inner}</div>}
                  </li>
                )
              })}
            </ul>

            {showSeats && <div className={s.seats} aria-label={`${total} seats: ${event.seats.fullLabel}, ${event.seats.partialLabel}, ${event.seats.restLabel}`}>
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
            </div>}
            {event.note && <p className={s.small}>{event.note}</p>}
          </div>}
        </div>
      </div>
    </section>
  )
}
