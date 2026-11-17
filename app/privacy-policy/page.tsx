import type { Metadata } from 'next'
import { PolicyPage } from '@/app/_components/PolicyPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'The Global Youth Network (GYN) is committed to protecting the privacy and personal information of all visitors, applicants, delegates, partners, and stakeholders.',
}

export default function Page() {
  return <PolicyPage slug="privacy-policy" title="Privacy Policy" />
}
