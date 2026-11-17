import type { Metadata } from 'next'
import Link from 'next/link'
import { PageBox } from '@/components/pages/PageBox'
import { PageSection } from '@/components/pages/PageSection'
import p from '@/components/pages/pages.module.css'

export const metadata: Metadata = {
  title: 'Registration not completed, SISM 2026',
  robots: 'noindex',
}

export default function RegistrationCancelledPage() {
  return (
    <main id="main">
      <PageBox
        id="cancelled-h1"
        kicker="SISM 2026"
        title="Registration not *completed*"
        lead="Your payment was not processed. Your registration progress has been saved, so you can return to the form to complete your booking."
      >
        <Link href="/sism-forum-access" className="btn btn-y">Try again, $199</Link>
        <Link href="/sism-2026" className={`btn glass-dark ${p.btnGlass}`}>Back to summit page</Link>
      </PageBox>

      <PageSection id="help" heading="Trouble with your *card*?" glow>
        <div className={`glass-lite ${p.card} ${p.narrow}`}>
          <p className={p.body}>
            If you ran into a problem with your card, check that international transactions are enabled and that your account has sufficient funds. Need help? Email{' '}
            <a href="mailto:contact@thegyn.org" className={p.mail}>contact@thegyn.org</a>.
          </p>
        </div>
      </PageSection>
    </main>
  )
}
