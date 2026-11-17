import type { EventPageContent } from '@gyn/core/event-schema'
import { EventSection, cardClass, cardRow } from './EventSection'
import e from './event.module.css'

/** Programme chapters of a past summit, with their sessions. */
export function Chapters({ data, glow }: { data: EventPageContent['chapters']; glow: boolean }) {
  return (
    <EventSection id="chapters" kicker={data.kicker} heading={data.heading} glow={glow}>
      <ul className={e.cards} style={cardRow(data.items.length, 380, 600, 2)}>
        {data.items.map((c) => (
          <li key={c.label + c.title} className={cardClass(glow)}>
            <p className={e.label}>{c.label}</p>
            <h3 className={e.cardH}>{c.title}</h3>
            {c.text && <p className={e.cardP}>{c.text}</p>}
            {c.sessions.length > 0 && (
              <ul className={e.sessions}>
                {c.sessions.map((s) => (
                  <li key={s.title}>
                    {s.type && <span className={e.tag}>{s.type}</span>}
                    {s.title}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </EventSection>
  )
}
