import type { ReactNode } from 'react'
import { SectionHead } from '@/components/landing/SectionHead'
import s from './pages.module.css'

/** A page section that opens the way every home section does: centred kicker, heading, intro. `glow` puts it on the soft colour backdrop glass cards need. */
export function PageSection({ id, kicker, heading, intro, link, glow = false, children }: {
  id: string
  kicker: string
  /** Wrap one word in *stars* to mark it. */
  heading: string
  intro?: string
  link?: { label: string; href: string }
  glow?: boolean
  children?: ReactNode
}) {
  return (
    <section id={id} className={glow ? s.glow : s.section} data-name={kicker} aria-labelledby={`${id}-h2`}>
      <div className="wrap">
        <SectionHead id={`${id}-h2`} kicker={kicker} heading={heading} intro={intro} link={link} />
        {children}
      </div>
    </section>
  )
}
