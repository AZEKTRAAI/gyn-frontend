import type { CSSProperties } from 'react'
import type { EventPageContent } from '@gyn/core/event-schema'
import l from '@/components/landing/landing.module.css'
import e from './event.module.css'

/** The event in a few numbers: glass tiles on a colour stage, as in "Who we are" on the home page. */
export function Highlights({ data }: { data: EventPageContent['highlights'] }) {
  return (
    <section className={e.statsSec} data-name="At a glance" aria-label="At a glance">
      <div className="wrap">
        <div className={l.statsStage}>
          <ul className={e.statsRow} style={{ '--n': data.items.length } as CSSProperties}>
            {data.items.map((x) => (
              <li key={x.label} className="glass">
                <b>{x.n}</b>
                <span>{x.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
