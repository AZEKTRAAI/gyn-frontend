import type { Metadata } from 'next'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import { RegistrationForm } from '@/features/registration/ui/RegistrationForm'

export const metadata: Metadata = {
  title: 'Buy Invitation Letter | SDG Innovation Summit Malaysia 2026',
  description: 'Get your official invitation letter for the SDG Innovation Summit Malaysia for just $49. Receive it within 48 hours, with visa support included.',
  openGraph: {
    images: [{ url: '/og/sism-application-og.jpg' }],
  },
}

interface EventData {
  id: string
  ticketTypes: { id: string; includes: string[]; status: string }[]
}

export default async function InvitationLetterPage() {
  const { events } = await cms.getEvents() as { events: EventData[] }
  const sism = events.find(e => e.id === 'sism-2026')!
  const ticket = sism.ticketTypes.find(t => t.id === 'invitation-letter')!

  return (
    <main id="main" style={{ background: 'var(--white)', minHeight: '80vh' }}>
      <div className="wrap who-grid" style={{ paddingBlock: 'clamp(4rem,8vw,7rem)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>

        <div>
          <Link href="/sism-2026" style={{ fontSize: '0.875rem', color: 'var(--blue-deep)', textDecoration: 'underline', display: 'inline-block', marginBottom: '1.5rem' }}>
            Back to summit page
          </Link>
          <h1 className="d2" style={{ color: 'var(--navy-900)', marginBottom: '1rem' }}>
            Invitation letter application
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--n-600)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            This invitation letter supports your Malaysian visa application for the SDG Innovation Summit Malaysia 2026 (19–22 November, Teedo Hotel, Kuala Lumpur). You will receive the letter within 48 hours of payment.
          </p>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {[
              ['Event dates', 'November 19–22, 2026'],
              ['Location', 'Teedo Hotel, Kuala Lumpur, Malaysia'],
              ['Category', 'Invitation Letter'],
            ].map(([dt, dd]) => (
              <div key={dt} style={{ display: 'flex', gap: '0.5rem' }}>
                <dt style={{ color: 'var(--n-500)', minWidth: '120px' }}>{dt}</dt>
                <dd style={{ color: 'var(--navy-900)', fontWeight: 500 }}>{dd}</dd>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <dt style={{ color: 'var(--n-500)', minWidth: '120px' }}>Price</dt>
              <dd style={{ fontFamily: 'var(--fd)', fontSize: '1.25rem', color: 'var(--blue-deep)' }}>$49 USD</dd>
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
            Passport number is used only to generate the letter and is not stored afterwards.
          </p>
        </div>

        <div>
          <RegistrationForm ticket="invitation-letter" includes={ticket.includes} />
        </div>
      </div>
    </main>
  )
}
