// Admin sign-in and sessions.
//  - Passwords are checked with scrypt (@gyn/core/password). An unknown email takes as long as a wrong password.
//  - A session is a random token in an httpOnly cookie. Only its SHA-256 is stored, so a database leak cannot be used to sign in.
//  - 5 wrong passwords lock the account for 15 minutes. Every sign-in, failure and sign-out is written to the audit log.
//  - Every page and every server action checks the session itself. The layout is only the frame around the page.
// Two-step login (an authenticator app) is added at the end of the build; the User table already has the columns for it.

import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { requirePrisma } from '@gyn/core/db'
import { hashToken, randomToken } from '@gyn/core/crypto'
import { decoyHash, verifyPassword } from '@gyn/core/password'
import { can, type Permission } from '@gyn/core/permissions'
import { getClientIp } from './ip'

const SESSION_MS = 8 * 3600 * 1000
const MAX_FAILED = 5
const LOCK_MS = 15 * 60 * 1000
// "__Host-" makes the browser refuse the cookie unless it is Secure, path=/ and has no Domain. It needs https, so not in development.
export const COOKIE = process.env.NODE_ENV === 'production' ? '__Host-gyn_admin' : 'gyn_admin'

export class PermissionError extends Error {}

export interface AdminSession {
  sessionId: string
  user: { id: string; email: string; name: string; mustChangePassword: boolean }
  roleName: string
  permissions: string[]
}

// shortcut: attempts are counted in memory, so they reset when the server restarts and are per process. Fine for one
// instance; the account lockout above is the real protection and is stored in the database.
const attempts = new Map<string, number[]>()
function allowAttempt(ip: string): boolean {
  const now = Date.now()
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000)
  recent.push(now)
  attempts.set(ip, recent)
  return recent.length <= 20
}

// A typed value goes into the audit log only if it looks like an email: people paste passwords into the wrong box.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const auditableEmail = (typed: string): string | null => (typed.length <= 254 && EMAIL_SHAPE.test(typed) ? typed : null)

const GENERIC_FAILURE = 'That email and password do not match, or the account is locked.'

export async function signIn(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const prisma = requirePrisma()
  const h = await headers()
  const ip = getClientIp({ headers: h })
  const addr = email.trim().toLowerCase()
  if (!allowAttempt(ip)) return { ok: false, error: 'Too many attempts. Wait a few minutes and try again.' }

  const user = addr ? await prisma.user.findUnique({ where: { email: addr }, include: { role: true } }) : null
  const now = new Date()
  const locked = !!user?.lockedUntil && user.lockedUntil > now
  const valid = await verifyPassword(password, user?.passwordHash ?? (await decoyHash()))

  if (!user || !user.active || locked || !valid) {
    if (user && !locked) {
      const failed = user.failedLogins + 1
      await prisma.user.update({
        where: { id: user.id },
        data: failed >= MAX_FAILED ? { failedLogins: 0, lockedUntil: new Date(now.getTime() + LOCK_MS) } : { failedLogins: failed },
      })
    }
    await prisma.auditLog.create({
      data: { userId: user?.id ?? null, userEmail: user?.email ?? auditableEmail(addr), action: 'LOGIN_FAILED', entityType: 'User', entityId: user?.id ?? 'unknown', ip, meta: { locked, ...(!user && addr && !auditableEmail(addr) ? { note: 'not an email' } : {}) } },
    })
    return { ok: false, error: GENERIC_FAILURE }
  }

  const token = randomToken()
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: now } }),
    prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(now.getTime() + SESSION_MS),
        ip,
        userAgent: h.get('user-agent')?.slice(0, 300) ?? null,
      },
    }),
    prisma.auditLog.create({ data: { userId: user.id, userEmail: user.email, action: 'LOGIN', entityType: 'User', entityId: user.id, ip } }),
  ])
  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MS / 1000,
  })
  return { ok: true }
}

export const getSession = cache(async (): Promise<AdminSession | null> => {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const row = await requirePrisma().session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { role: true } } },
  })
  if (!row || row.expiresAt < new Date() || !row.user.active) return null
  return {
    sessionId: row.id,
    user: { id: row.user.id, email: row.user.email, name: row.user.name, mustChangePassword: row.user.mustChangePassword },
    roleName: row.user.role.name,
    permissions: row.user.role.permissions,
  }
})

export const PASSWORD_PAGE = '/account/password'
export const MUST_CHANGE_MESSAGE = 'You are using a temporary password. Change it first (Change password page), then try again.'

/**
 * For pages: send the visitor to the sign-in page when there is no valid session. While the password is a temporary one, every
 * page except the change-password page (which passes allowTemporaryPassword) redirects there.
 */
export async function requireSession(opts: { allowTemporaryPassword?: boolean } = {}): Promise<AdminSession> {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.user.mustChangePassword && !opts.allowTemporaryPassword) redirect(PASSWORD_PAGE)
  return session
}

/** For server actions: throws instead of redirecting, so the action can answer with a clear message. */
export async function requirePermission(permission: Permission): Promise<AdminSession> {
  const session = await getSession()
  if (!session) throw new PermissionError('You are signed out. Sign in again.')
  if (session.user.mustChangePassword) throw new PermissionError(MUST_CHANGE_MESSAGE)
  if (!can(session.permissions, permission)) throw new PermissionError('Your role does not allow this.')
  return session
}

export async function signOut(): Promise<void> {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  const session = await getSession()
  if (token) await requirePrisma().session.deleteMany({ where: { tokenHash: hashToken(token) } })
  if (session) {
    const ip = getClientIp({ headers: await headers() })
    await requirePrisma().auditLog.create({
      data: { userId: session.user.id, userEmail: session.user.email, action: 'LOGOUT', entityType: 'User', entityId: session.user.id, ip },
    })
  }
  jar.delete(COOKIE)
}
