import type { Metadata } from 'next'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import { PageHero } from '@/components/PageHero'
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
    <main id="main">
      <PageHero
        title="*Invitation* letter application"
        lead="Official invitation letter for your Malaysian visa application. Delivered within 48 hours of payment."
        meta={<>For SISM 2026 / 19–22 November, Teedo Hotel, Kuala Lumpur / <strong>$49 USD</strong></>}
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

          {/* Left: includes + note */}
          <div>
            <h2 className="d3" style={{ color: 'var(--ink)', marginBottom: '1rem' }}>What you receive</h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1.5rem' }}>
              {ticket.includes.map(item => (
                <li key={item} style={{ fontSize: '0.9375rem', color: 'var(--n-700)', paddingLeft: '1.25rem', position: 'relative', lineHeight: 1.55 }}>
                  <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: '0.55em', width: '6px', height: '6px', background: 'var(--ink)', display: 'block' }} />
                  {item}
                </li>
              ))}
            </ul>
            <p style={{ fontSize: '0.875rem', color: 'var(--n-500)', lineHeight: 1.6 }}>
              Passport number is used only to generate the letter and is not stored afterwards.
            </p>
          </div>

          {/* Right: form */}
          <div>
            <RegistrationForm ticket="invitation-letter" includes={ticket.includes} />
          </div>
        </div>
      </section>
    </main>
  )
}
