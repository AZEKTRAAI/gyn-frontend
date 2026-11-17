'use server'

import { headers } from 'next/headers'
import { requirePrisma } from '@gyn/core/db'
import { AdminUserError, changeOwnPassword } from '@gyn/core/admin-users'
import { getSession } from '@/lib/auth'
import { getClientIp } from '@/lib/ip'

export type ChangePasswordResult = { ok: true; otherSessionsEnded: number } | { ok: false; error: string }

// shortcut: wrong attempts are counted in memory per account (same pattern as the sign-in limiter), so they reset on a restart.
// Fine for one instance; the current password is also checked with scrypt, which is slow on purpose.
const MAX_WRONG = 5
const WINDOW_MS = 15 * 60 * 1000
const wrong = new Map<string, number[]>()
const recentWrong = (userId: string) => {
  const recent = (wrong.get(userId) ?? []).filter((t) => Date.now() - t < WINDOW_MS)
  wrong.set(userId, recent)
  return recent
}

export async function changePasswordAction(input: { current: string; next: string; confirm: string }): Promise<ChangePasswordResult> {
  try {
    const session = await getSession()
    if (!session) return { ok: false, error: 'You are signed out. Sign in again.' }
    if (recentWrong(session.user.id).length >= MAX_WRONG) return { ok: false, error: 'Too many wrong passwords. Wait 15 minutes and try again.' }
    const ip = getClientIp({ headers: await headers() })
    const res = await changeOwnPassword(
      requirePrisma(),
      { userId: session.user.id, sessionId: session.sessionId, current: String(input?.current ?? ''), next: String(input?.next ?? ''), confirm: String(input?.confirm ?? '') },
      { id: session.user.id, email: session.user.email, ip },
    )
    wrong.delete(session.user.id)
    return { ok: true, otherSessionsEnded: res.otherSessionsEnded }
  } catch (e) {
    if (e instanceof AdminUserError) {
      if (e.code === 'WRONG_PASSWORD') {
        const s = await getSession()
        if (s) wrong.set(s.user.id, [...recentWrong(s.user.id), Date.now()])
      }
      return { ok: false, error: e.message }
    }
    console.error('[admin] changing the password failed', e)
    return { ok: false, error: 'Changing the password failed. Nothing was changed. Try again in a minute.' }
  }
}
