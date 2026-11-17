'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import editor from '@/components/editor.module.css'
import { changePasswordAction } from './actions'

export function PasswordForm({ wasTemporary }: { wasTemporary: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const form = ev.currentTarget
    const data = new FormData(form)
    setError('')
    setDone('')
    startTransition(async () => {
      const res = await changePasswordAction({ current: String(data.get('current')), next: String(data.get('next')), confirm: String(data.get('confirm')) })
      if (!res.ok) return setError(res.error)
      form.reset()
      if (wasTemporary) return router.replace('/') // the panel is unlocked now
      setDone(res.otherSessionsEnded ? `Your password was changed. ${res.otherSessionsEnded} other sign-in${res.otherSessionsEnded === 1 ? ' was' : 's were'} ended.` : 'Your password was changed.')
    })
  }

  return (
    <form onSubmit={submit} className={editor.form} style={{ maxWidth: 520, marginTop: 16 }}>
      <div className={editor.field}>
        <label htmlFor="current">Current password</label>
        <input id="current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div className={editor.field}>
        <label htmlFor="next">New password</label>
        <input id="next" name="next" type="password" autoComplete="new-password" minLength={12} required aria-describedby="next-hint" />
        <p id="next-hint" className={editor.hint}>At least 12 characters, and different from the current one. A few random words work well.</p>
      </div>
      <div className={editor.field}>
        <label htmlFor="confirm">Confirm new password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={12} required />
      </div>
      <div role="status" aria-live="polite">
        {error && <p className={editor.bad} role="alert">{error}</p>}
        {done && <p className={editor.ok}>{done}</p>}
      </div>
      <div className={editor.barActions}>
        <button type="submit" className={editor.primary} disabled={pending}>{pending ? 'Changing…' : 'Change password'}</button>
      </div>
      <p className={editor.hint}>Forgot it? Ask a Super Administrator to set a temporary password. Reset by email comes later.</p>
    </form>
  )
}
