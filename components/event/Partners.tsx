import Image from 'next/image'
import Link from 'next/link'
import type { EventPageContent } from '@gyn/core/event-schema'
import { EventSection, cardClass, cardRow } from './EventSection'
import e from './event.module.css'

/** Hosts and partners: an optional logo on white, the role, a name and a short text. */
export function Partners({ data, glow }: { data: EventPageContent['partners']; glow: boolean }) {
  return (
    <EventSection id="partners" kicker={data.kicker} heading={data.heading} glow={glow}>
      <ul className={e.cards} style={cardRow(data.items.length, 280, 440, 3)}>
        {data.items.map((p) => (
          <li key={p.name} className={`${cardClass(glow)} ${e.partner}`}>
            {p.logo[0] && (
              <div className={e.logo}>
                <Image src={p.logo[0].src} alt={p.logo[0].alt || `${p.name} logo`} fill sizes="200px" style={{ objectFit: 'contain' }} />
              </div>
            )}
            {p.role && <span className={e.tag}>{p.role}</span>}
            <h3 className={e.cardH}>{p.name}</h3>
            <p className={e.cardP}>{p.text}</p>
            {p.link.label && <Link href={p.link.href} className={e.more}>{p.link.label} <span aria-hidden="true">&rarr;</span></Link>}
          </li>
        ))}
      </ul>
    </EventSection>
  )
}
