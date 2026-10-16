import type { Metadata } from 'next'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import { RegistrationForm } from '@/features/registration/ui/RegistrationForm'

export const metadata: Metadata = {
  title: 'Self Funded Application | SDG Innovation Summit Malaysia',
  description: 'Self-Funded Application Form (Confirmed Seat with accommodation) — SDG Innovation Summit Malaysia 2026. 19–22 November, Kuala Lumpur.',
  openGraph: {
    images: [{ url: '/og/sism-application-og.jpg' }],
  },
}

interface EventData {
  id: string
  ticketTypes: { id: string; includes: string[]; status: string }[]
}

export default async function SelfFundedPage() {
  const { events } = await cms.getEvents() as { events: EventData[] }
  const sism = events.find(e => e.id === 'sism-2026')!
  const ticket = sism.ticketTypes.find(t => t.id === 'self-funded')!

  return (
    <main id="main" style={{ background: 'var(--white)', minHeight: '80vh' }}>
      <div className="wrap who-grid" style={{ paddingBlock: 'clamp(4rem,8vw,7rem)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>

        <div>
          <Link href="/sism-2026" style={{ fontSize: '0.875rem', color: 'var(--blue-deep)', textDecoration: 'underline', display: 'inline-block', marginBottom: '1.5rem' }}>
            Back to summit page
          </Link>
          <h1 className="d2" style={{ color: 'var(--navy-900)', marginBottom: '1rem' }}>
            Self Funded application
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--n-600)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            The Self-Funded category includes accommodation at Teedo Hotel, Kuala Lumpur, alongside full summit access. Taking place 19–22 November 2026.
          </p>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {[
              ['Event dates', 'November 19–22, 2026'],
              ['Location', 'Teedo Hotel, Kuala Lumpur, Malaysia'],
              ['Category', 'Self Funded (confirmed seat with accommodation)'],
            ].map(([dt, dd]) => (
              <div key={dt} style={{ display: 'flex', gap: '0.5rem' }}>
                <dt style={{ color: 'var(--n-500)', minWidth: '120px' }}>{dt}</dt>
                <dd style={{ color: 'var(--navy-900)', fontWeight: 500 }}>{dd}</dd>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <dt style={{ color: 'var(--n-500)', minWidth: '120px' }}>Price</dt>
              <dd style={{ fontFamily: 'var(--fd)', fontSize: '1.25rem', color: 'var(--blue-deep)' }}>$399 USD</dd>
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

        <div>
          <RegistrationForm ticket="self-funded" includes={ticket.includes} />
        </div>
      </div>
    </main>
  )
}
