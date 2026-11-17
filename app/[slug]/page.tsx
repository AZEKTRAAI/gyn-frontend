import type { Metadata } from 'next'
import { listPublicEvents } from '@gyn/core/event-store'
import { EventPage, eventMetadata } from '@/components/event/EventPage'

// The admin tells this site to refresh when an event is published; this is the safety net if that call is missed.
export const revalidate = 300

// Events published after the build render on first visit and are then cached like the rest.
export async function generateStaticParams() {
  return (await listPublicEvents()).map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return eventMetadata((await params).slug)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <EventPage slug={(await params).slug} />
}
