import type { Metadata } from 'next'
import Link from 'next/link'
import { TICKETS, type TicketId } from '@/features/registration/schema'
import { ClearRegistrationStorage } from '@/features/registration/ui/ClearRegistrationStorage'
import { WheelComplete } from '@/components/WheelComplete'
import { PageBox } from '@/components/pages/PageBox'
import { PageSection } from '@/components/pages/PageSection'
import p from '@/components/pages/pages.module.css'
import s from './page.module.css'

export const metadata: Metadata = {
  title: 'Registration confirmed, SISM 2026',
  robots: 'noindex',
}

// Google Calendar link template for SISM 2026 (19–22 Nov, Teedo Hotel KL)
const GCL =
  'https://calendar.google.com/calendar/render?action=TEMPLATE' +
  '&text=SDG+Innovation+Summit+Malaysia+2026' +
  '&dates=20261119T010000Z%2F20261122T160000Z' +
  '&location=Teedo+Hotel%2C+Kuala+Lumpur%2C+Malaysia' +
  '&details=SISM+2026+%E2%80%94+organized+by+Global+Youth+Network+%28GYN%29+and+co-hosted+by+UNU+Global+Health.'

const NEXT_STEPS = [
  'You will receive a confirmation email with your booking details.',
  'The GYN team will send pre-summit information closer to 19 November 2026.',
  'Prepare for 4 days of learning, networking and innovation in Kuala Lumpur.',
]

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function RegisteredPage({ searchParams }: Props) {
  const params = await searchParams
  const ref = params.ref ?? ''
  const ticketParam = params.ticket as TicketId | undefined
  const demo = params.demo === '1'
  const ticketInfo = ticketParam && TICKETS[ticketParam] ? TICKETS[ticketParam] : null
  const facts = [...(ticketInfo ? [ticketInfo.name] : []), ...(ref ? [`Reference: ${ref}`] : [])]

  return (
    <main id="main">
      <PageBox
        id="registered-h1"
        kicker="SISM 2026"
        title={demo ? 'Booking *confirmed* (demo)' : 'Booking *confirmed*'}
        above={<WheelComplete size={104} />}
        lead={
          <>
            A confirmation email is on its way. Please check your inbox (and spam folder) within a few minutes. If you have questions, email{' '}
            <a href="mailto:contact@thegyn.org">contact@thegyn.org</a>.
          </>
        }
        facts={facts}
      >
        <a href={GCL} target="_blank" rel="noopener" className="btn btn-y">Add to Google Calendar</a>
        <a href="/api/calendar/sism-2026.ics" download="sism-2026.ics" className={`btn glass-dark ${p.btnGlass}`}>Download .ics file</a>
      </PageBox>

      <PageSection id="next" heading="What happens *next*" glow>
        {demo && (
          <p role="note" className={s.demo}>
            Demo mode: no payment was taken. This is a preview of the confirmation page.
          </p>
        )}
        <ol className={s.steps}>
          {NEXT_STEPS.map((item, i) => (
            <li key={item} className="glass-lite">
              <span aria-hidden="true">{i + 1}</span>
              <p>{item}</p>
            </li>
          ))}
        </ol>
        <p className={s.back}><Link href="/sism-2026">Back to the summit page</Link></p>
      </PageSection>

      {/* Clear saved form data now that registration succeeded (RT-057) */}
      {ticketParam && <ClearRegistrationStorage ticket={ticketParam} />}
    </main>
  )
}
