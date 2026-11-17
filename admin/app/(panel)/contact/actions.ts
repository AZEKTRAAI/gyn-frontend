'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ContactStoreError, ContactStoreUnavailable, setContactStatus } from '@gyn/core/contact-store'
import { PermissionError, requirePermission } from '@/lib/auth'
import { getClientIp } from '@/lib/ip'

// A form action: the message id and the new status come from hidden fields, so this works without client JavaScript.
// The only permission the contact module has is contact.view, so whoever may open the inbox may triage it.
export async function setStatusAction(form: FormData): Promise<void> {
  const id = String(form.get('id') ?? '')
  let failed = false
  try {
    const session = await requirePermission('contact.view')
    await setContactStatus(id, String(form.get('status') ?? ''), { actor: session.user.email, userId: session.user.id, ip: getClientIp({ headers: await headers() }) })
  } catch (e) {
    failed = true
    if (!(e instanceof PermissionError || e instanceof ContactStoreError || e instanceof ContactStoreUnavailable)) console.error('[admin] changing the contact status failed', e)
  }
  revalidatePath('/contact')
  redirect(`/contact/${encodeURIComponent(id)}${failed ? '?failed=1' : ''}`)
}
