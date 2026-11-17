import Image from 'next/image'
import type { EventPageContent } from '@gyn/core/event-schema'
import { EventSection } from './EventSection'
import e from './event.module.css'

export function Gallery({ data, glow }: { data: EventPageContent['gallery']; glow: boolean }) {
  return (
    <EventSection id="gallery" heading={data.heading} glow={glow}>
      <ul className={e.wall}>
        {data.photos.map((p) => (
          <li key={p.image.src} className={e.tile}>
            <Image src={p.image.src} alt={p.image.alt} fill sizes="(max-width: 640px) 50vw, 17vw" style={{ objectFit: 'cover' }} />
            {p.caption && <span className={`glass-dark ${e.tileCap}`}>{p.caption}</span>}
          </li>
        ))}
      </ul>
    </EventSection>
  )
}
