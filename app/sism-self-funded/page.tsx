import type { Metadata } from 'next'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import { PageHero } from '@/components/PageHero'
import { RegistrationForm } from '@/features/registration/ui/RegistrationForm'

export const metadata: Metadata = {
  title: 'Self Funded Application | SDG Innovation Summit Malaysia',
  description: 'Self-Funded Application Form (Confirmed Seat with accommodation), SDG Innovation Summit Malaysia 2026. 19–22 November, Kuala Lumpur.',
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
    <main id="main">
      <PageHero
        title="Self *Funded* application"
        lead="Confirmed seat with twin-sharing accommodation at Teedo Hotel, Kuala Lumpur."
        meta={<>19–22 November 2026 / Teedo Hotel, Kuala Lumpur / <strong>$399 USD</strong></>}
        actions={
          <Link href="/sism-2026" style={{ fontSize: '0.875rem', color: 'var(--navy)', textDecoration: 'underline' }}>
            Back to summit page
          </Link>
        }
        tone="field"
      />

      {/* Info + Form */}
      <section style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap who-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>

          {/* Left: includes + facts */}
          <div>
            <h2 className="d3" style={{ color: 'var(--ink)', marginBottom: '1rem' }}>What is included</h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1.5rem' }}>
              {ticket.includes.map(item => (
                <li key={item} style={{ fontSize: '0.9375rem', color: 'var(--n-700)', paddingLeft: '1.25rem', position: 'relative', lineHeight: 1.55 }}>
                  <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: '0.55em', width: '6px', height: '6px', background: 'var(--ink)', display: 'block' }} />
                  {item}
                </li>
              ))}
            </ul>
            <p style={{ fontSize: '0.875rem', color: 'var(--n-500)', lineHeight: 1.6 }}>
              Group discounts available. Email{' '}
              <a href="mailto:contact@thegyn.org" style={{ color: 'var(--navy)', textDecoration: 'underline' }}>contact@thegyn.org</a>.
            </p>
          </div>

          {/* Right: form */}
          <div>
            <RegistrationForm ticket="self-funded" includes={ticket.includes} />
          </div>
        </div>
      </section>
    </main>
  )
}
