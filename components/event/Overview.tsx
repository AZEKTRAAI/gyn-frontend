import Image from 'next/image'
import type { EventPageContent } from '@gyn/core/event-schema'
import { EventSection, paragraphs } from './EventSection'
import e from './event.module.css'

export function Overview({ data, glow }: { data: EventPageContent['overview']; glow: boolean }) {
  return (
    <EventSection id="overview" heading={data.heading} glow={glow}>
      <div className={e.split}>
        <figure className={e.photo}>
          <Image src={data.image.src} alt={data.image.alt} fill sizes="(max-width: 900px) 100vw, 45vw" style={{ objectFit: 'cover' }} />
        </figure>
        <div className={e.prose}>
          {paragraphs(data.text).map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
        </div>
      </div>
    </EventSection>
  )
}
