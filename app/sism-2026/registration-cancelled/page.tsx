import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Registration not completed — SISM 2026',
  robots: 'noindex',
}

export default function RegistrationCancelledPage() {
  return (
    <main id="main" style={{ background: 'var(--white)', minHeight: '80vh' }}>
      <div className="wrap" style={{ paddingBlock: 'clamp(4rem,10vw,8rem)', maxWidth: '600px' }}>
        <h1 className="d2" style={{ color: 'var(--navy-900)', marginBottom: '1rem' }}>
          Registration not completed
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--n-700)', lineHeight: 1.75, marginBottom: '1.5rem' }}>
          Your payment was not processed. Your registration progress has been saved — you can return to the form to complete your booking.
        </p>
        <p style={{ fontSize: '0.9375rem', color: 'var(--n-600)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
          If you ran into a problem with your card, check that international transactions are enabled and that your account has sufficient funds. Need help? Email{' '}
          <a href="mailto:contact@thegyn.org" style={{ color: 'var(--blue-deep)', textDecoration: 'underline' }}>contact@thegyn.org</a>.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/sism-forum-access" className="btn btn-y" style={{ minHeight: '44px' }}>
            Try again, $199
          </Link>
          <Link href="/sism-2026" className="btn" style={{ background: 'transparent', color: 'var(--navy-900)', border: '2px solid var(--n-300)', minHeight: '44px' }}>
            Back to summit page
          </Link>
        </div>
      </div>
    </main>
  )
}
