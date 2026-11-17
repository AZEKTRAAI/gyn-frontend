import type { Metadata } from 'next'
import { PolicyPage } from '@/app/_components/PolicyPage'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description:
    'GYN is committed to delivering an exceptional experience for all conference delegates. This page outlines our refund policy and credit voucher conditions.',
}

export default function Page() {
  return <PolicyPage slug="refund-policy" title="Refund Policy" />
}
