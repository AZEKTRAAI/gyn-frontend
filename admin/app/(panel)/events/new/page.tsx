import type { Metadata } from 'next'
import { can } from '@gyn/core/permissions'
import { requireSession } from '@/lib/auth'
import { Forbidden } from '../../Forbidden'
import { NewEventForm } from './NewEventForm'

export const metadata: Metadata = { title: 'New event' }
export const dynamic = 'force-dynamic'

export default async function NewEventPage() {
  const session = await requireSession()
  if (!can(session.permissions, 'events.manage')) return <Forbidden />
  return <NewEventForm />
}
