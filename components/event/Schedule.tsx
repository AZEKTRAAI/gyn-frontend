import type { EventPageContent } from '@gyn/core/event-schema'
import { EventSection, cardClass, cardRow } from './EventSection'
import e from './event.module.css'

export function Schedule({ data, glow }: { data: EventPageContent['schedule']; glow: boolean }) {
  return (
    <EventSection id="schedule" kicker={data.kicker} heading={data.heading} glow={glow}>
      <ol className={e.cards} style={cardRow(data.days.length, 240, 330, 4)}>
        {data.days.map((d) => (
          <li key={d.label + d.date} className={cardClass(glow)}>
            <h3 className={e.cardH}>{d.label}</h3>
            {d.date && <p className={e.date}>{d.date}</p>}
            <ul className={e.day} aria-label={`${d.label} programme`}>
              {d.items.map((it, i) => (
                <li key={it.title + i}>
                  <b>{it.title}</b>
                  {it.text && <span>{it.text}</span>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </EventSection>
  )
}
