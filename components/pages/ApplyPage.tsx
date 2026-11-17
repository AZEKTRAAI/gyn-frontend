import Link from 'next/link'
import type { ReactNode } from 'react'
import { RegistrationForm } from '@/features/registration/ui/RegistrationForm'
import type { TicketId } from '@/features/registration/schema'
import { GALLERY } from '@/features/media/media'
import { PageBox } from './PageBox'
import { PageSection } from './PageSection'
import p from './pages.module.css'
import s from './apply.module.css'

// two Bangkok summit photos for the sides of the box
const PHOTOS = [GALLERY[9], GALLERY[1]].map(({ src, alt }) => ({ src, alt }))

/**
 * One registration page: the royal box with the facts, then what the category includes beside the form.
 * Forum access, self-funded and invitation letter all use it; only the words and the category id differ.
 */
export function ApplyPage({ category, includes, kicker, title, lead, facts, sectionKicker, sectionHeading, includesHeading, note }: {
  /** Registration category id the form submits (the TicketId of features/registration). */
  category: TicketId
  includes: string[]
  kicker: string
  title: string
  lead: string
  facts: string[]
  sectionKicker: string
  sectionHeading: string
  includesHeading: string
  note: ReactNode
}) {
  return (
    <main id="main">
      <PageBox id="apply-h1" kicker={kicker} title={title} lead={lead} facts={facts} photos={PHOTOS}>
        <Link href="/sism-2026" className={`btn glass-dark ${p.btnGlass}`}>Back to summit page</Link>
      </PageBox>

      <PageSection id="apply" kicker={sectionKicker} heading={sectionHeading} glow>
        <div className={s.grid}>
          <div className={`glass-lite ${s.includes}`}>
            <h3>{includesHeading}</h3>
            <ul>
              {includes.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className={s.note}>{note}</p>
          </div>

          <div className={`glass-lite ${s.form}`}>
            <RegistrationForm ticket={category} includes={includes} />
          </div>
        </div>
      </PageSection>
    </main>
  )
}
