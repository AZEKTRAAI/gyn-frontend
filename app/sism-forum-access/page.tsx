import type { Metadata } from 'next'
import { cms } from '@/lib/cms'
import { ApplyPage } from '@/components/pages/ApplyPage'

export const metadata: Metadata = {
  title: 'Forum Access Application | SDG Innovation Summit Malaysia',
  description: 'Forum Access Application Form (Confirmed Seat), SDG Innovation Summit Malaysia 2026. 19–22 November, Kuala Lumpur.',
  openGraph: {
    images: [{ url: '/og/sism-application-og.jpg' }],
  },
}

interface EventData {
  id: string
  ticketTypes: { id: string; includes: string[]; status: string }[]
}

export default async function ForumAccessPage() {
  const { events } = await cms.getEvents() as { events: EventData[] }
  const sism = events.find(e => e.id === 'sism-2026')!
  const ticket = sism.ticketTypes.find(t => t.id === 'forum-access')!

  return (
    <ApplyPage
      category="forum-access"
      includes={ticket.includes}
      kicker="Forum Access"
      title="Forum *Access* application"
      lead="Confirmed seat at SISM 2026. No selection process: pay and your place is secured."
      facts={['19–22 November 2026', 'Kuala Lumpur, Malaysia', '$199 USD']}
      sectionKicker="Book your seat"
      sectionHeading="Secure your *place*"
      includesHeading="What is included"
      note={<>Group discounts available. Email{' '}
          <a href="mailto:contact@thegyn.org">contact@thegyn.org</a>.</>}
    />
  )
}
