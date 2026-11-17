import Link from 'next/link'
import type { PublicCategory } from '@gyn/core/event-store'
import type { EventPageContent } from '@gyn/core/event-schema'
import { EventSection, cardClass, cardRow } from './EventSection'
import { money } from './money'
import e from './event.module.css'

// shortcut: only SISM 2026 has real registration forms, and its pages are fixed per category slug (their fees are
// features/registration TICKETS, which is what gets charged). Phase 5's form engine replaces this map with forms
// generated per category; until then every other event and category only gets the contact line.
const SISM = 'sism-2026'
const REGISTER: Record<string, string> = {
  'forum-access': '/sism-forum-access',
  'self-funded': '/sism-self-funded',
  'invitation-letter': '/sism-invitation-letter',
}
const isScholarship = (slug: string) => /^(fully|partially)-funded$|scholarship/.test(slug)

/** "11 Oct 2026" in the event's own time zone (the admin enters close dates there). */
function day(at: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone }).format(at)
  } catch {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(at)
  }
}

/** The event's registration categories as cards: fee, how it is decided, open or closed, and the way in. */
export function Categories({ data, categories, glow, eventSlug, timeZone, now }: {
  data: EventPageContent['categories']
  categories: PublicCategory[]
  glow: boolean
  eventSlug: string
  timeZone: string
  now: number
}) {
  return (
    <EventSection id="categories" heading={data.heading} glow={glow}>
      <ul className={`${e.cards} ${e.catRow}`} style={cardRow(categories.length, 200, 300, 5)}>
        {categories.map((c) => {
          const href = eventSlug === SISM ? REGISTER[c.slug] : undefined
          const scholarship = isScholarship(c.slug)
          const closesAt = c.closesAt
          const closeLine = closesAt && (c.open ? `Applications close ${day(closesAt, timeZone)}` : closesAt.getTime() <= now ? `Closed on ${day(closesAt, timeZone)}` : null)
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
              {closeLine && <p className={e.cardP}>{closeLine}</p>}
              <div className={e.catAct}>
                {!c.open ? (
                  <span className={e.off}>{scholarship ? 'Applications closed' : 'Registration closed'}</span>
                ) : href && !scholarship ? (
                  <Link href={href} className="btn btn-y">Register <span aria-hidden="true">&rarr;</span></Link>
                ) : (
                  <p className={e.catSoon}>
                    Registration opens soon. <Link href="/contact-us?topic=general">Contact us</Link>
                  </p>
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
