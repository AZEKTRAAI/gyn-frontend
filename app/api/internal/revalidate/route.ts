// Called by the admin app (over the private Docker network) after it publishes content, so a changed page refreshes
// straight away instead of waiting for the 5 minute safety net. Caddy never forwards /api/internal/* from the internet.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { revalidatePath } from 'next/cache'
import { safeEqual } from '@gyn/core/crypto'

const LAYOUT = '__layout'

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.INTERNAL_API_SECRET
  const given = req.headers.get('x-internal-secret') ?? ''
  // 404, not 401: a wrong guess learns nothing about this route.
  if (!secret || !safeEqual(given, secret)) return new Response('Not found', { status: 404 })

  const body = (await req.json().catch(() => null)) as { paths?: unknown } | null
  const paths = Array.isArray(body?.paths)
    ? body.paths.filter((p): p is string => typeof p === 'string' && (p.startsWith('/') || p === LAYOUT) && p.length < 200).slice(0, 20)
    : []
  for (const p of paths) {
    // The navbar lives in the root layout, so a change that alters the menu refreshes every page.
    if (p === LAYOUT) revalidatePath('/', 'layout')
    else revalidatePath(p)
  }
  return Response.json({ revalidated: paths.length })
}
