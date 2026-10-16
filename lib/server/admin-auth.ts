// Auth boundary for admin server actions. proxy.ts also guards /admin, but server actions
// must check for themselves (Next docs: treat every action as a public endpoint).
// shortcut: one shared Basic Auth login from ADMIN_BASIC_AUTH="user:password"; swap for Auth.js roles (docs/admin-panel.md) before handing to GYN staff.
import { timingSafeEqual } from 'node:crypto'
import { headers } from 'next/headers'
import { getClientIp } from './ip'

export class AdminAuthError extends Error {}

export async function requireAdmin(): Promise<{ actor: string; ip: string }> {
  const h = await headers()
  const ip = getClientIp({ headers: h })
  const expected = process.env.ADMIN_BASIC_AUTH
  if (!expected) {
    if (process.env.NODE_ENV === 'production') throw new AdminAuthError('The admin is locked. Set ADMIN_BASIC_AUTH on the server.')
    return { actor: 'dev', ip }
  }
  const auth = h.get('authorization') ?? ''
  const got = Buffer.from(auth.startsWith('Basic ') ? Buffer.from(auth.slice(6), 'base64').toString('utf8') : '')
  const want = Buffer.from(expected)
  if (got.length !== want.length || !timingSafeEqual(got, want)) throw new AdminAuthError('Not signed in to the admin.')
  return { actor: expected.split(':')[0], ip }
}
