import type { Metadata } from 'next'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import { RegistrationForm } from '@/features/registration/ui/RegistrationForm'

export const metadata: Metadata = {
  title: 'Forum Access Application | SDG Innovation Summit Malaysia',
  description: 'Forum Access Application Form (Confirmed Seat) — SDG Innovation Summit Malaysia 2026. 19–22 November, Kuala Lumpur.',
  openGraph: {
    images: [{ url: '/og/sism-application-og.jpg' }],
  },
}

interface EventData {
  id: string
  ticketTypes: { id: string; includes: string[]; status: string }[]
}

export default async function ForumAccessPage() {
  const { events } = await cms.getEvents() as { events: EventData[] }
  const sism = events.find(e => e.id === 'sism-2026')!
  const ticket = sism.ticketTypes.find(t => t.id === 'forum-access')!

  return (
    <main id="main" style={{ background: 'var(--white)', minHeight: '80vh' }}>
      {/* who-grid gets mobile grid collapse from globals.css */}
      <div className="wrap who-grid" style={{ paddingBlock: 'clamp(4rem,8vw,7rem)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>

        {/* Left: context */}
        <div>
          <Link href="/sism-2026" style={{ fontSize: '0.875rem', color: 'var(--blue-deep)', textDecoration: 'underline', display: 'inline-block', marginBottom: '1.5rem' }}>
            Back to summit page
          </Link>
          <h1 className="d2" style={{ color: 'var(--navy-900)', marginBottom: '1rem' }}>
            Forum Access application
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--n-600)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            The SDG Innovation Summit Malaysia 2026 brings together 100 outstanding participants from around the world in Kuala Lumpur from 19–22 November 2026. The forum-access category provides direct access to the summit with no selection process.
          </p>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {[
              ['Event dates', 'November 19–22, 2026'],
              ['Location', 'Kuala Lumpur, Malaysia'],
              ['Category', 'Forum Access (confirmed seat)'],
            ].map(([dt, dd]) => (
              <div key={dt} style={{ display: 'flex', gap: '0.5rem' }}>
                <dt style={{ color: 'var(--n-500)', minWidth: '120px' }}>{dt}</dt>
                <dd style={{ color: 'var(--navy-900)', fontWeight: 500 }}>{dd}</dd>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <dt style={{ color: 'var(--n-500)', minWidth: '120px' }}>Price</dt>
              <dd style={{ fontFamily: 'var(--fd)', fontSize: '1.25rem', color: 'var(--blue-deep)' }}>$199 USD</dd>
            </div>
          </dl>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1rem' }}>
            {ticket.includes.map(item => (
              <li key={item} style={{ fontSize: '0.8125rem', color: 'var(--n-700)', paddingLeft: '1rem', position: 'relative', lineHeight: 1.5 }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: '0.45em', width: '6px', height: '6px', background: 'var(--blue-ocean)', display: 'block' }} />
                {item}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: '0.8125rem', color: 'var(--n-500)', lineHeight: 1.6 }}>
            Group discounts available. Email{' '}
            <a href="mailto:contact@thegyn.org" style={{ color: 'var(--blue-deep)', textDecoration: 'underline' }}>contact@thegyn.org</a>.
          </p>
        </div>

        {/* Right: form */}
        <div>
          <RegistrationForm ticket="forum-access" includes={ticket.includes} />
        </div>
      </div>
    </main>
  )
}
