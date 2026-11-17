import type { CSSProperties } from 'react'
import type { EventPageContent } from '@gyn/core/event-schema'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'
import l from '@/components/landing/landing.module.css'
import { EventSection } from './EventSection'
import e from './event.module.css'

const isShort = (url: string) => url.includes('/shorts/')

/** Videos load only on tap. Shorts stand tall, other videos lie wide, all at one row height. */
export function Videos({ data, glow }: { data: EventPageContent['videos']; glow: boolean }) {
  const sum = data.items.reduce((n, v) => n + (isShort(v.url) ? 9 / 16 : 16 / 9), 0)
  return (
    <EventSection id="videos" heading={data.heading} glow={glow}>
      <ul className={e.reel} style={{ '--sum': sum, '--cnt': data.items.length } as CSSProperties}>
        {data.items.map((v) => (
          <li key={v.url} className={`${e.clip} ${isShort(v.url) ? e.tall : ''}`}>
            <YouTubeEmbed
              videoUrl={v.url}
              posterSrc={v.poster.src}
              posterAlt={v.title || v.poster.alt}
              overlayClassName={l.playOverlay}
              playBtnClassName={`${l.playBtn} ${l.playSm}`}
            />
          </li>
        ))}
      </ul>
    </EventSection>
  )
}
