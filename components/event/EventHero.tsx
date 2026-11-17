import Link from 'next/link'
import type { EventPageContent } from '@gyn/core/event-schema'
import { Countdown } from '@/components/Countdown'
import { SdgWheel } from '@/components/SdgWheel'
import { Accent } from '@/components/landing/Accent'
import { Scatter } from '@/components/landing/Scatter'
import l from '@/components/landing/landing.module.css'

/**
 * The top of an event page: the home hero's royal box, with the event's own headline centred and its photos
 * scattered with torn edges down both sides. An upcoming event also counts down to its start.
 */
export function EventHero({ hero, startsAt, now, upcoming }: { hero: EventPageContent['hero']; startsAt: number; now: number; upcoming: boolean }) {
  return (
    <section className={l.hero} data-name={hero.kicker || 'Event'} aria-labelledby="event-h1">
      <div className={l.heroBox}>
        <SdgWheel className={l.wheel} />
        <SdgWheel className={l.wheel2} />

        <Scatter items={hero.photos} />

        <div className={l.heroCopy}>
          {hero.kicker && (
            <p className={`glass-dark ${l.eyebrow}`}>
              <span className={l.eyebrowDot} aria-hidden="true" />
              <span>{hero.kicker}</span>
            </p>
          )}
          <h1 id="event-h1" className={l.h1}>
            <Accent text={hero.headline} dark />
          </h1>
          {hero.lead && <p className={l.lead}>{hero.lead}</p>}
          <div className={l.ctas}>
            <Link href={hero.primaryCta.href} className="btn btn-y">
              {hero.primaryCta.label} <span aria-hidden="true">&rarr;</span>
            </Link>
            {hero.secondaryCta.label && (
              <Link href={hero.secondaryCta.href} className={`btn glass-dark ${l.btnGlass}`}>
                {hero.secondaryCta.label}
              </Link>
            )}
          </div>
          {hero.chips.length > 0 && (
            <ul className={l.facts} aria-label="At a glance">
              {hero.chips.map((c) => <li key={c.label} className="glass-dark">{c.label}</li>)}
            </ul>
          )}
          {upcoming && startsAt > now && (
            <div className={l.countdown}>
              <Countdown serverNow={now} target={startsAt} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
