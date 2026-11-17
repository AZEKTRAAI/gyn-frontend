import type { Metadata } from 'next'
import { z } from 'zod'
import { homeSchema } from '@gyn/core/home-schema'
import { getHome } from '@gyn/core/home-store'
import { can } from '@gyn/core/permissions'
import { requireSession } from '@/lib/auth'
import { Forbidden } from '../Forbidden'
import type { JsonNode } from '@/components/SchemaForm'
import { HomeEditor } from './HomeEditor'

export const metadata: Metadata = { title: 'Edit home page' }

// Always read the latest saved content, never a build-time copy.
export const dynamic = 'force-dynamic'

export default async function AdminHomePage() {
  const session = await requireSession()
  if (!can(session.permissions, 'home.edit')) return <Forbidden />
  const content = await getHome()
  return (
    <HomeEditor
      initial={content}
      // JSON round-trip: React refuses the non-plain objects toJSONSchema builds
      schema={JSON.parse(JSON.stringify(z.toJSONSchema(homeSchema))) as JsonNode}
      storage={process.env.DATABASE_URL ? 'database' : 'none'}
      uploads="local"
    />
  )
}
