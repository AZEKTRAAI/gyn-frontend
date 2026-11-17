import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth'
import editor from '@/components/editor.module.css'
import { PasswordForm } from './PasswordForm'

export const metadata: Metadata = { title: 'Change password' }
export const dynamic = 'force-dynamic'

// Every role may change their own password, so there is no permission check beyond being signed in.
export default async function PasswordPage() {
  const session = await requireSession({ allowTemporaryPassword: true })
  return (
    <div className={editor.scope}>
      <h1>Change password</h1>
      <p className={editor.muted}>Signed in as {session.user.email}. Changing it signs you out of every other browser or device; this one stays signed in.</p>
      {session.user.mustChangePassword && <p className={editor.note}>Your password is a temporary one someone else chose. Please set your own now.</p>}
      <PasswordForm wasTemporary={session.user.mustChangePassword} />
    </div>
  )
}
