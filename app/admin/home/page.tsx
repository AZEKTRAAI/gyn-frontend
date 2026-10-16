import type { Metadata } from 'next'
import { z } from 'zod'
import { homeSchema } from '@/features/home/schema'
import { getHome } from '@/features/home/store'
import { HomeEditor, type JsonNode } from './HomeEditor'

export const metadata: Metadata = {
  title: 'Edit home page',
  robots: { index: false, follow: false },
}

// Always read the latest saved content, never a build-time copy.
export const dynamic = 'force-dynamic'

export default async function AdminHomePage() {
  const content = await getHome()
  const storage = process.env.DATABASE_URL ? 'database' : process.env.NODE_ENV === 'production' ? 'none' : 'file'
  return (
    <HomeEditor
      initial={content}
      // JSON round-trip: React refuses the non-plain objects toJSONSchema builds
      schema={JSON.parse(JSON.stringify(z.toJSONSchema(homeSchema))) as JsonNode}
      storage={storage}
      uploads={process.env.CLOUDINARY_URL ? 'cloudinary' : process.env.NODE_ENV === 'production' ? 'none' : 'local'}
    />
  )
}
