import Link from 'next/link'
import type { HomeContent } from '@gyn/core/home-schema'
import { Countdown } from '@/components/Countdown'
import { Accent } from './Accent'
import s from './landing.module.css'

/** One of the next event's registration categories: fee, the old fee if it was cut, open or closed, and where it leads. Only open ones are shown. */
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
  serverNow,
}: {
  event: HomeContent['event']
  strip: HomeContent['strip']
  categories: Category[]
  target: number
  serverNow: number
}) {
  // closed categories are not offered; an event with none open has nothing for the right half, so centre the left one instead
  const open = categories.filter((c) => c.open)
  const alone = open.length === 0
  return (
    <section id="next" className={s.tight} data-name={`Next: ${strip.eventName}`} aria-labelledby="next-h2">
      <div className="wrap">
        <div className={s.nextCard} style={alone ? { gridTemplateColumns: '1fr', justifyItems: 'center', textAlign: 'center' } : undefined}>
          <div className={s.nextMain}>
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
            </div>
          </div>

          {!alone && (
            <ul className={s.cats}>
              {open.map((c) => (
                <li key={c.id} className={`glass-dark ${s.cat}`}>
                  <Link href={c.href} className={s.catLink}>
                    <span className={s.catName}>{sentence(c.name)}</span>
                    <span className={s.catPrice}>
                      {c.was ? <s className={s.catWas}>{c.was}</s> : null}
                      {c.price}
                    </span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
