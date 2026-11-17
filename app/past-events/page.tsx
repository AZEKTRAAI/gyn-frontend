import type { Metadata } from 'next'
import { listPublicEvents } from '@gyn/core/event-store'
import { EventListing } from '@/components/pages/EventListing'

export const revalidate = 300

const description = 'GYN summits and forums held so far, with photos, videos and delegate stories.'
export const metadata: Metadata = {
  title: 'Past events',
  description,
  openGraph: { title: 'Past events | Global Youth Network', description },
}

export default async function PastEventsPage() {
  return <EventListing kind="past" events={await listPublicEvents()} />
}
