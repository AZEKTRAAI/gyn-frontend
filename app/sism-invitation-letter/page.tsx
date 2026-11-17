import type { Metadata } from 'next'
import { cms } from '@/lib/cms'
import { ApplyPage } from '@/components/pages/ApplyPage'

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
    <ApplyPage
      category="invitation-letter"
      includes={ticket.includes}
      kicker="Invitation Letter"
      title="*Invitation* letter application"
      lead="Official invitation letter for your Malaysian visa application. Delivered within 48 hours of payment."
      facts={['For SISM 2026', '19–22 Nov, Teedo Hotel, Kuala Lumpur', '$49 USD']}
      sectionKicker="Get your letter"
      sectionHeading="Request your *letter*"
      includesHeading="What you receive"
      note={<>Passport number is used only to generate the letter and is not stored afterwards.</>}
    />
  )
}
