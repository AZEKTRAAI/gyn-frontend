import type { EventPageContent } from '@gyn/core/event-schema'
import { EventSection, cardClass, cardRow } from './EventSection'
import e from './event.module.css'

/** How to apply: numbered steps. */
export function Steps({ data, glow }: { data: EventPageContent['steps']; glow: boolean }) {
  return (
    <EventSection id="steps" heading={data.heading} glow={glow}>
      <ol className={e.cards} style={cardRow(data.items.length, 220, 290, 4)}>
        {data.items.map((s, i) => (
          <li key={s.title} className={cardClass(glow)}>
            <span className={e.num} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <h3 className={e.cardH}>{s.title}</h3>
            <p className={e.cardP}>{s.text}</p>
          </li>
        ))}
      </ol>
    </EventSection>
  )
}
