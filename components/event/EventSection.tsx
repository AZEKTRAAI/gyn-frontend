import type { CSSProperties, ReactNode } from 'react'
import { SectionHead } from '@/components/landing/SectionHead'
import l from '@/components/landing/landing.module.css'
import e from './event.module.css'

/** The one way every event section opens (small label, heading, intro, all centred), on white or on the soft glow glass needs. */
export function EventSection({ id, kicker, heading, intro, glow, children }: {
  id: string
  kicker: string
  /** Wrap words in *stars* to highlight them. */
  heading: string
  intro?: string
  glow: boolean
  children: ReactNode
}) {
  return (
    <section id={id} className={`${l.section} ${e.sec} ${glow ? l.glowSection : ''}`} data-name={kicker || heading.replace(/\*/g, '')} aria-labelledby={`${id}-h2`}>
      <div className="wrap">
        <SectionHead id={`${id}-h2`} kicker={kicker} heading={heading} intro={intro} />
        {children}
      </div>
    </section>
  )
}

/** Glass cards on the glow; flat mist cards on white, where glass would be invisible. */
export const cardClass = (glow: boolean) => (glow ? `glass-lite ${e.card}` : `${e.card} ${e.flat}`)

/**
 * Width of the cards in a `.cards` row, in px, and how many fit across: the row is capped so a short list wraps evenly
 * (8 cards as 4 + 4, not 6 + 2) and a short last row stays centred.
 */
export function cardRow(count: number, min: number, max: number, cols: number): CSSProperties {
  const across = count <= cols ? count : Math.ceil(count / Math.ceil(count / cols))
  return { '--min': `${min}px`, '--max': `${max}px`, maxWidth: across * max + (across - 1) * 18, marginInline: 'auto' } as CSSProperties
}

/** One paragraph per line break in an admin text field. */
export const paragraphs = (text: string) => text.split(/\n+/).map((p) => p.trim()).filter(Boolean)
