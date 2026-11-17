import type { EventPageContent } from '@gyn/core/event-schema'
import { EventSection, cardClass, paragraphs } from './EventSection'
import e from './event.module.css'

/** Questions shown before the rest are folded behind "Show all questions". */
const SHOWN = 6

type Item = EventPageContent['faq']['items'][number]

function List({ items, glow }: { items: Item[]; glow: boolean }) {
  return (
    <ul className={e.faq}>
      {items.map((f) => (
        <li key={f.q}>
          <details className={cardClass(glow)}>
            <summary>{f.q}</summary>
            <div className={e.answer}>{paragraphs(f.a).map((p) => <p key={p.slice(0, 40)}>{p}</p>)}</div>
          </details>
        </li>
      ))}
    </ul>
  )
}

/** Native <details> all the way down: keyboard and screen-reader friendly, and the fold works with no script. */
export function Faq({ data, glow }: { data: EventPageContent['faq']; glow: boolean }) {
  const rest = data.items.slice(SHOWN)
  return (
    <EventSection id="faq" heading={data.heading} glow={glow}>
      <List items={data.items.slice(0, SHOWN)} glow={glow} />
      {rest.length > 0 && (
        <details className={e.faqMore}>
          <summary>
            <span className={e.whenClosed}>Show all questions ({data.items.length})</span>
            <span className={e.whenOpen}>Show fewer questions</span>
          </summary>
          <List items={rest} glow={glow} />
        </details>
      )}
    </EventSection>
  )
}
