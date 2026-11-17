import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { eventPageSchema } from '@gyn/core/event-schema'
import { getEventForEdit } from '@gyn/core/event-store'
import { can } from '@gyn/core/permissions'
import type { JsonNode } from '@/components/SchemaForm'
import { requireSession } from '@/lib/auth'
import { Forbidden } from '../../Forbidden'
import { EventEditor } from './EventEditor'

export const metadata: Metadata = { title: 'Edit event' }
// Always read the latest saved event, never a build-time copy.
export const dynamic = 'force-dynamic'

// Where "View page" points. The admin lives on its own address, so this is the public site's address, not a relative link.
const webUrl = () => (process.env.WEB_PUBLIC_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

export default async function EditEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await requireSession()
  if (!can(session.permissions, 'events.view')) return <Forbidden />
  const { slug } = await params
  const event = await getEventForEdit(slug)
  if (!event) notFound()
  return (
    <EventEditor
      slug={event.slug}
      name={event.details.name}
      initialStatus={event.status}
      timing={event.timing}
      initialDetails={event.details}
      initialContent={event.content}
      // JSON round-trip: React refuses the non-plain objects toJSONSchema builds
      schema={JSON.parse(JSON.stringify(z.toJSONSchema(eventPageSchema))) as JsonNode}
      canManage={can(session.permissions, 'events.manage')}
      viewUrl={`${webUrl()}/${event.slug}`}
    />
  )
}
