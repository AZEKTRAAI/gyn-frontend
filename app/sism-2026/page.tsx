import type { Metadata } from 'next'
import { EventPage, eventMetadata } from '@/components/event/EventPage'

// The shared event page, kept as its own route so the registered and registration-cancelled pages sit beside it.
export const revalidate = 300

export const generateMetadata = (): Promise<Metadata> => eventMetadata('sism-2026')

export default function Sism2026Page() {
  return <EventPage slug="sism-2026" />
}
