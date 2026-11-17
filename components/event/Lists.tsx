import type { EventPageContent } from '@gyn/core/event-schema'
import { EventSection, cardClass, cardRow } from './EventSection'
import e from './event.module.css'

/** Titled lists side by side (who can apply, scholarship criteria): equal columns, left-aligned points inside each card. */
export function Lists({ data, glow }: { data: EventPageContent['lists']; glow: boolean }) {
  return (
    <EventSection id="lists" kicker={data.kicker} heading={data.heading} intro={data.intro} glow={glow}>
      <div className={e.cards} style={cardRow(data.groups.length, 280, 520, 2)}>
        {data.groups.map((g) => (
          <section key={g.title} className={`${cardClass(glow)} ${e.listCard}`} aria-label={g.title}>
            <h3 className={e.cardH}>{g.title}</h3>
            <ul className={e.points}>
              {g.items.map((it) => <li key={it}>{it}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </EventSection>
  )
}
