'use server'

import { headers } from 'next/headers'
import { requirePrisma } from '@gyn/core/db'
import { PermissionError, requirePermission, type AdminSession } from '@/lib/auth'
import { getClientIp } from '@/lib/ip'
import { storeImage, UploadError } from '@/lib/upload'

export type UploadResult = { ok: true; src: string } | { ok: false; error: string }

// Shared by every schema-driven editor: whoever may edit the home page or manage events may upload an image.
export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  try {
    let session: AdminSession
    try {
      session = await requirePermission('home.edit')
    } catch {
      session = await requirePermission('events.manage')
    }
    const file = formData.get('file')
    if (!(file instanceof File)) return { ok: false, error: 'Choose an image first.' }
    const src = await storeImage(file)
    // Files have no MediaAsset row yet, so the stored path is the entity. Never the file contents.
    await requirePrisma().auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'MEDIA_UPLOADED',
        entityType: 'MediaFile',
        entityId: src,
        newValue: { path: src, size: file.size, type: file.type || null },
        ip: getClientIp({ headers: await headers() }),
      },
    })
    return { ok: true, src }
  } catch (e) {
    if (e instanceof PermissionError || e instanceof UploadError) return { ok: false, error: e.message }
    console.error('[admin] uploadImageAction failed', e)
    return { ok: false, error: 'Upload failed. Try again.' }
  }
}
