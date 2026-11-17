import type { Metadata } from 'next'
import { PolicyPage } from '@/app/_components/PolicyPage'

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description:
    'By using the Global Youth Network website or participating in any programs organized by the Global Youth Network, you agree to these terms.',
}

export default function Page() {
  return <PolicyPage slug="terms-conditions" title="Terms and Conditions" />
}
