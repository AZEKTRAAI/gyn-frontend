import Link from 'next/link'
import type { HomeContent } from '@/features/home/schema'
import s from './EventStrip.module.css'

interface Props {
  strip: HomeContent['strip']
}

/** White strip directly below the hero: next event at a glance. Server component. */
export function EventStrip({ strip }: Props) {
  return (
    <div className={s.strip}>
      <div className={`wrap ${s.inner}`}>
        <span>
          <b>{strip.label}</b> {strip.eventName}
        </span>
        <span>{strip.dateVenue}</span>
        {strip.cohost && <span>{strip.cohost}</span>}
        <Link href={strip.link.href} className={s.link}>
          <b>{strip.link.label}</b>
        </Link>
      </div>
    </div>
  )
}
