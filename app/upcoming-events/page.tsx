import type { Metadata } from 'next'
import { listPublicEvents } from '@gyn/core/event-store'
import { EventListing } from '@/components/pages/EventListing'

export const revalidate = 300

const description = 'Upcoming GYN summits and forums: dates, venues and how to register.'
export const metadata: Metadata = {
  title: 'Upcoming events',
  description,
  openGraph: { title: 'Upcoming events | Global Youth Network', description },
}

export default async function UpcomingEventsPage() {
  return <EventListing kind="upcoming" events={await listPublicEvents()} />
}
