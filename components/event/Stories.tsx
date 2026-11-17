import Image from 'next/image'
import type { EventPageContent } from '@gyn/core/event-schema'
import { EventSection, cardClass, cardRow } from './EventSection'
import e from './event.module.css'

export function Stories({ data, glow }: { data: EventPageContent['stories']; glow: boolean }) {
  return (
    <EventSection id="stories" heading={data.heading} glow={glow}>
      <ul className={e.cards} style={cardRow(data.quotes.length, 280, 400, 3)}>
        {data.quotes.map((q) => (
          <li key={q.name + q.quote.slice(0, 20)} className={`${cardClass(glow)} ${e.quote}`}>
            <blockquote>&ldquo;{q.quote}&rdquo;</blockquote>
            <div className={e.by}>
              <Image src={q.photo.src} alt={q.photo.alt || q.name} width={48} height={48} sizes="48px" />
              <span>
                <b>{q.name}</b>
                {q.country && <small>{q.country}</small>}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </EventSection>
  )
}
