'use server'

import { headers } from 'next/headers'
import { homeSchema } from '@gyn/core/home-schema'
import { saveHome, HomeStoreUnavailable } from '@gyn/core/home-store'
import { PermissionError, requirePermission } from '@/lib/auth'
import { getClientIp } from '@/lib/ip'
import { storeImage, UploadError } from '@/lib/upload'
import { revalidateWeb } from '@/lib/web'

export type SaveResult =
  | { ok: true; savedAt: string }
  | { ok: false; error: string; issues?: { path: string; message: string }[] }

export async function saveHomeAction(content: unknown): Promise<SaveResult> {
  try {
    const session = await requirePermission('home.edit')
    const parsed = homeSchema.safeParse(content)
    if (!parsed.success) {
      return {
        ok: false,
        error: 'Some fields need fixing before this can be published.',
        issues: parsed.error.issues.slice(0, 50).map((i) => ({ path: i.path.join('.'), message: i.message })),
      }
    }
    await saveHome(parsed.data, { actor: session.user.email, userId: session.user.id, ip: getClientIp({ headers: await headers() }) })
    // The edit is saved either way. If the website cannot be reached it refreshes on its own within 5 minutes.
    await revalidateWeb(['/', '/about-us'])
    return { ok: true, savedAt: new Date().toISOString() }
  } catch (e) {
    if (e instanceof PermissionError || e instanceof HomeStoreUnavailable) return { ok: false, error: e.message }
    console.error('[admin] saveHomeAction failed', e)
    return { ok: false, error: 'Saving failed. Nothing was changed. Try again in a minute.' }
  }
}

export async function uploadImageAction(formData: FormData): Promise<{ ok: true; src: string } | { ok: false; error: string }> {
  try {
    await requirePermission('home.edit')
    const file = formData.get('file')
    if (!(file instanceof File)) return { ok: false, error: 'Choose an image first.' }
    return { ok: true, src: await storeImage(file) }
  } catch (e) {
    if (e instanceof PermissionError || e instanceof UploadError) return { ok: false, error: e.message }
    console.error('[admin] uploadImageAction failed', e)
    return { ok: false, error: 'Upload failed. Try again.' }
  }
}
