import Image from 'next/image'
import type { EventPageContent } from '@gyn/core/event-schema'
import { EventSection, cardClass, cardRow } from './EventSection'
import e from './event.module.css'

export function Speakers({ data, glow }: { data: EventPageContent['speakers']; glow: boolean }) {
  return (
    <EventSection id="speakers" heading={data.heading} glow={glow}>
      <ul className={`${e.cards} ${e.people}`} style={cardRow(data.people.length, 170, 200, 6)}>
        {data.people.map((p) => (
          <li key={p.name} className={`${cardClass(glow)} ${e.person}`}>
            <div className={e.portrait}>
              <Image src={p.photo.src} alt={p.photo.alt || p.name} fill sizes="200px" style={{ objectFit: 'cover' }} />
            </div>
            <h3>{p.name}</h3>
            {p.role && <p>{p.role}</p>}
          </li>
        ))}
      </ul>
    </EventSection>
  )
}
