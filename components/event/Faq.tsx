import type { EventPageContent } from '@gyn/core/event-schema'
import { EventSection, cardClass, paragraphs } from './EventSection'
import e from './event.module.css'

/** Native <details>: keyboard and screen-reader friendly with no script. */
export function Faq({ data, glow }: { data: EventPageContent['faq']; glow: boolean }) {
  return (
    <EventSection id="faq" kicker={data.kicker} heading={data.heading} glow={glow}>
      <ul className={e.faq}>
        {data.items.map((f) => (
          <li key={f.q}>
            <details className={cardClass(glow)} style={{ textAlign: 'left' }}>
              <summary>{f.q}</summary>
              <div className={e.answer}>{paragraphs(f.a).map((p) => <p key={p.slice(0, 40)}>{p}</p>)}</div>
            </details>
          </li>
        ))}
      </ul>
    </EventSection>
  )
}
