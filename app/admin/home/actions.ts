'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, AdminAuthError } from '@/lib/server/admin-auth'
import { homeSchema } from '@/features/home/schema'
import { saveHome, HomeStoreUnavailable } from '@/features/home/store'
import { storeImage, UploadError } from '@/features/home/upload'

export type SaveResult =
  | { ok: true; savedAt: string }
  | { ok: false; error: string; issues?: { path: string; message: string }[] }

export async function saveHomeAction(content: unknown): Promise<SaveResult> {
  try {
    const admin = await requireAdmin()
    const parsed = homeSchema.safeParse(content)
    if (!parsed.success) {
      return {
        ok: false,
        error: 'Some fields need fixing before this can be published.',
        issues: parsed.error.issues.slice(0, 50).map((i) => ({ path: i.path.join('.'), message: i.message })),
      }
    }
    await saveHome(parsed.data, admin)
    revalidatePath('/')
    return { ok: true, savedAt: new Date().toISOString() }
  } catch (e) {
    if (e instanceof AdminAuthError || e instanceof HomeStoreUnavailable) return { ok: false, error: e.message }
    console.error('[admin] saveHomeAction failed', e)
    return { ok: false, error: 'Saving failed. Nothing was changed. Try again in a minute.' }
  }
}

export async function uploadImageAction(formData: FormData): Promise<{ ok: true; src: string } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const file = formData.get('file')
    if (!(file instanceof File)) return { ok: false, error: 'Choose an image first.' }
    return { ok: true, src: await storeImage(file) }
  } catch (e) {
    if (e instanceof AdminAuthError || e instanceof UploadError) return { ok: false, error: e.message }
    console.error('[admin] uploadImageAction failed', e)
    return { ok: false, error: 'Upload failed. Try again.' }
  }
}
