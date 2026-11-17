import type { ReactNode } from 'react'
import { SectionHead } from '@/components/landing/SectionHead'
import s from './pages.module.css'

/** A page section that opens the way every home section does: a centred heading. `glow` puts it on the soft colour backdrop glass cards need. */
export function PageSection({ id, heading, glow = false, children }: {
  id: string
  /** Wrap one word in *stars* to mark it. */
  heading: string
  glow?: boolean
  children?: ReactNode
}) {
  return (
    <section id={id} className={glow ? s.glow : s.section} data-name={heading.replace(/\*/g, '')} aria-labelledby={`${id}-h2`}>
      <div className="wrap">
        <SectionHead id={`${id}-h2`} heading={heading} />
        {children}
      </div>
    </section>
  )
}
