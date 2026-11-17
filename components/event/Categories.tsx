import Link from 'next/link'
import type { PublicCategory } from '@gyn/core/event-store'
import type { EventPageContent } from '@gyn/core/event-schema'
import { EventSection, cardClass, cardRow } from './EventSection'
import e from './event.module.css'

// shortcut: the registration pages are fixed per category slug until the form engine (phase 5) generates them;
// an open category without a page sends people to the contact page.
const REGISTER: Record<string, { href: string; label: string }> = {
  'forum-access': { href: '/sism-forum-access', label: 'Register' },
  'self-funded': { href: '/sism-self-funded', label: 'Register' },
  'invitation-letter': { href: '/sism-invitation-letter', label: 'Register' },
}
const isScholarship = (slug: string) => /^(fully|partially)-funded$|scholarship/.test(slug)

function money(cents: number, currency: string): string {
  if (cents === 0) return 'Free'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100)
  } catch {
    return `${currency} ${cents / 100}`
  }
}

/** The event's registration categories as cards: fee, how it is decided, open or closed, and the way in. */
export function Categories({ data, categories, glow }: {
  data: EventPageContent['categories']
  categories: PublicCategory[]
  glow: boolean
}) {
  return (
    <EventSection id="categories" kicker={data.kicker} heading={data.heading} intro={data.intro} glow={glow}>
      <ul className={`${e.cards} ${e.catRow}`} style={cardRow(categories.length, 200, 300, 5)}>
        {categories.map((c) => {
          const go = REGISTER[c.slug] ?? { href: '/contact-us', label: 'Contact us' }
          return (
            <li key={c.slug} className={cardClass(glow)}>
              <div className={e.catTop}>
                <span className={`${e.pill} ${c.open ? e.pillOpen : ''}`}>{c.open ? 'Open' : 'Closed'}</span>
                <span className={e.pill}>{c.approvalMode === 'MANUAL_REVIEW' ? 'Reviewed application' : 'Instant confirmation'}</span>
              </div>
              <h3 className={`${e.cardH} ${e.catName}`}>{c.name}</h3>
              <p className={e.fee}>
                {money(c.feeCents, c.currency)}
                {isScholarship(c.slug) && c.feeCents > 0 && <small className={e.feeNote}>application fee</small>}
              </p>
              {c.description && <p className={e.cardP}>{c.description}</p>}
              {c.seatLimit && <p className={e.cardP}>{c.seatLimit} seats</p>}
              <div className={e.catAct}>
                {c.open ? (
                  <Link href={go.href} className="btn btn-y">{go.label} <span aria-hidden="true">&rarr;</span></Link>
                ) : (
                  <span className={e.off}>{isScholarship(c.slug) ? 'Applications closed' : 'Registration closed'}</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {data.note && <p className={e.note}>{data.note}</p>}
    </EventSection>
  )
}
