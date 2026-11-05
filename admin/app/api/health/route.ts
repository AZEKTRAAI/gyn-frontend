// Liveness and database check for Docker and the uptime monitor. Returns no details beyond up or down.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { getPrisma } from '@gyn/core/db'

export async function GET(): Promise<Response> {
  const prisma = getPrisma()
  if (!prisma) return Response.json({ ok: false, db: 'not-configured' }, { status: 503 })
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ ok: true, db: 'up' })
  } catch {
    return Response.json({ ok: false, db: 'down' }, { status: 503 })
  }
}
