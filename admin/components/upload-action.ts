'use server'

import { PermissionError, requirePermission } from '@/lib/auth'
import { storeImage, UploadError } from '@/lib/upload'

export type UploadResult = { ok: true; src: string } | { ok: false; error: string }

// Shared by every schema-driven editor: whoever may edit the home page or manage events may upload an image.
export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  try {
    try {
      await requirePermission('home.edit')
    } catch {
      await requirePermission('events.manage')
    }
    const file = formData.get('file')
    if (!(file instanceof File)) return { ok: false, error: 'Choose an image first.' }
    return { ok: true, src: await storeImage(file) }
  } catch (e) {
    if (e instanceof PermissionError || e instanceof UploadError) return { ok: false, error: e.message }
    console.error('[admin] uploadImageAction failed', e)
    return { ok: false, error: 'Upload failed. Try again.' }
  }
}
