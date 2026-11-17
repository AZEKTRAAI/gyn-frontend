'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { requirePrisma } from '@gyn/core/db'
import { AdminUserError, createAdminUser, resetUserPassword, setUserActive, setUserRole } from '@gyn/core/admin-users'
import { PermissionError, requirePermission } from '@/lib/auth'
import { getClientIp } from '@/lib/ip'

export type UserActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string }

async function actor() {
  const session = await requirePermission('users.manage')
  return { id: session.user.id, email: session.user.email, ip: getClientIp({ headers: await headers() }) }
}

function failure(e: unknown, what: string): { ok: false; error: string } {
  if (e instanceof PermissionError || e instanceof AdminUserError) return { ok: false, error: e.message }
  console.error(`[admin] ${what} failed`, e)
  return { ok: false, error: `${what[0].toUpperCase()}${what.slice(1)} failed. Nothing was changed. Try again in a minute.` }
}

export async function createUserAction(input: { name: string; email: string; role: string }): Promise<UserActionResult<{ email: string; temporaryPassword: string }>> {
  try {
    const a = await actor()
    const { temporaryPassword } = await createAdminUser(requirePrisma(), { name: String(input?.name), email: String(input?.email), role: String(input?.role) }, a)
    revalidatePath('/users')
    return { ok: true, email: String(input.email).trim().toLowerCase(), temporaryPassword }
  } catch (e) {
    return failure(e, 'creating the user')
  }
}

export async function changeRoleAction(userId: string, role: string): Promise<UserActionResult> {
  try {
    await setUserRole(requirePrisma(), String(userId), String(role), await actor())
    revalidatePath('/users')
    return { ok: true }
  } catch (e) {
    return failure(e, 'changing the role')
  }
}

export async function setActiveAction(userId: string, active: boolean): Promise<UserActionResult> {
  try {
    await setUserActive(requirePrisma(), String(userId), active === true, await actor())
    revalidatePath('/users')
    return { ok: true }
  } catch (e) {
    return failure(e, active ? 'reactivating the user' : 'deactivating the user')
  }
}

export async function resetPasswordAction(userId: string): Promise<UserActionResult<{ temporaryPassword: string }>> {
  try {
    const { temporaryPassword } = await resetUserPassword(requirePrisma(), String(userId), await actor())
    revalidatePath('/users')
    return { ok: true, temporaryPassword }
  } catch (e) {
    return failure(e, 'setting the temporary password')
  }
}
