import type { Metadata } from 'next'
import Link from 'next/link'
import { TICKETS, type TicketId } from '@/features/registration/schema'

export const metadata: Metadata = {
  title: 'Registration confirmed — SISM 2026',
  robots: 'noindex',
}

// Google Calendar link template for SISM 2026 (19–22 Nov, Teedo Hotel KL)
const GCL =
  'https://calendar.google.com/calendar/render?action=TEMPLATE' +
  '&text=SDG+Innovation+Summit+Malaysia+2026' +
  '&dates=20261119T010000Z%2F20261122T160000Z' +
  '&location=Teedo+Hotel%2C+Kuala+Lumpur%2C+Malaysia' +
  '&details=SISM+2026+%E2%80%94+organized+by+Global+Youth+Network+%28GYN%29+and+co-hosted+by+UNU+Global+Health.'

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function RegisteredPage({ searchParams }: Props) {
  const params = await searchParams
  const ref = params.ref ?? ''
  const ticketParam = params.ticket as TicketId | undefined
  const demo = params.demo === '1'
  const ticketInfo = ticketParam && TICKETS[ticketParam] ? TICKETS[ticketParam] : null

  return (
    <main id="main" style={{ background: 'var(--white)', minHeight: '80vh' }}>
      <div className="wrap" style={{ paddingBlock: 'clamp(4rem,10vw,8rem)', maxWidth: '720px' }}>

        {/* Demo banner */}
        {demo && (
          <div
            role="note"
            style={{ padding: '0.875rem 1.25rem', background: 'var(--yellow)', marginBottom: '2rem', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--navy-900)' }}
          >
            Demo mode: no payment was taken. This is a preview of the confirmation page.
          </div>
        )}

        {/* Confirmation */}
        <div style={{ marginBottom: '0.5rem' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true" style={{ marginBottom: '1.5rem' }}>
            <circle cx="24" cy="24" r="24" fill="var(--leaf-600, #48783F)" />
            <path d="M14 24l8 8 12-16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="d2" style={{ color: 'var(--navy-900)', marginBottom: '1rem' }}>
          {demo ? 'Booking confirmed (demo)' : 'Booking confirmed'}
        </h1>
        {ticketInfo && (
          <p style={{ fontSize: '1rem', color: 'var(--n-600)', marginBottom: '0.5rem' }}>
            {ticketInfo.name}
          </p>
        )}
        {ref && (
          <p style={{ fontSize: '0.875rem', color: 'var(--n-500)', marginBottom: '2rem' }}>
            Reference: <span style={{ fontFamily: 'var(--fd)', color: 'var(--navy-700)' }}>{ref}</span>
          </p>
        )}

        <p style={{ fontSize: '1rem', color: 'var(--n-700)', lineHeight: 1.75, marginBottom: '2.5rem' }}>
          A confirmation email is on its way. Please check your inbox (and spam folder) within a few minutes. If you have questions, email{' '}
          <a href="mailto:contact@thegyn.org" style={{ color: 'var(--blue-deep)', textDecoration: 'underline' }}>contact@thegyn.org</a>.
        </p>

        {/* What happens next */}
        <div style={{ background: 'var(--n-100)', padding: '1.5rem', marginBottom: '2.5rem' }}>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--navy-900)', marginBottom: '1rem' }}>What happens next</p>
          <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              'You will receive a confirmation email with your booking details.',
              'The GYN team will send pre-summit information closer to 19 November 2026.',
              'Prepare for 4 days of learning, networking and innovation in Kuala Lumpur.',
            ].map((item, i) => (
              <li key={i} style={{ fontSize: '0.9375rem', color: 'var(--n-700)', lineHeight: 1.6, paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, fontFamily: 'var(--fd)', color: 'var(--blue-deep)', fontSize: '0.875rem' }}>{i + 1}.</span>
                {item}
              </li>
            ))}
          </ol>
        </div>

        {/* Calendar links */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <a
            href={GCL}
            target="_blank"
            rel="noopener"
            className="btn btn-n"
            style={{ minHeight: '44px' }}
          >
            Add to Google Calendar
          </a>
          <a
            href="/api/calendar/sism-2026.ics"
            download="sism-2026.ics"
            className="btn"
            style={{ background: 'transparent', color: 'var(--navy-900)', border: '2px solid var(--n-300)', minHeight: '44px' }}
          >
            Download .ics file
          </a>
        </div>

        <Link href="/sism-2026" style={{ fontSize: '0.9375rem', color: 'var(--blue-deep)', textDecoration: 'underline' }}>
          Back to the summit page
        </Link>
      </div>
    </main>
  )
}
