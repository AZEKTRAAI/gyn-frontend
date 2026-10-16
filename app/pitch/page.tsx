import type { Metadata } from 'next'
import { PitchClient } from './PitchClient'

export const metadata: Metadata = {
  title: 'GYN Redesign – Pitch Demo',
  description: 'Internal pitch demo for the GYN website redesign. Not for public distribution.',
  robots: { index: false, follow: false },
}

export default function PitchPage() {
  return <PitchClient />
}
