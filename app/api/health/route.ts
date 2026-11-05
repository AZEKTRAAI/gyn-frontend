// Liveness and database check for Docker, Caddy and the uptime monitor. Returns no details beyond up/down.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { getPrisma } from '@/lib/db'

export async function GET(): Promise<Response> {
  const prisma = getPrisma()
  if (!prisma) return Response.json({ ok: true, db: 'not-configured' })
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ ok: true, db: 'up' })
  } catch {
    return Response.json({ ok: false, db: 'down' }, { status: 503 })
  }
}
