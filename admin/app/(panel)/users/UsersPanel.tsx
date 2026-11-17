'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import editor from '@/components/editor.module.css'
import styles from '@/components/table.module.css'
import { changeRoleAction, createUserAction, resetPasswordAction, setActiveAction } from './actions'

export interface UserRow {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  lastLogin: string
  created: string
  isSelf: boolean
}

type Secret = { email: string; password: string }

export function UsersPanel({ users, roles }: { users: UserRow[]; roles: string[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [secret, setSecret] = useState<Secret | null>(null)
  const [draft, setDraft] = useState({ name: '', email: '', role: 'Viewer' })
  const [roleChoice, setRoleChoice] = useState<Record<string, string>>({})
  const formId = useId()

  // One path for every action: clear the old messages, run it, show the error or refresh the list.
  function run(task: () => Promise<{ ok: true; password?: string; email?: string; text: string } | { ok: false; error: string }>) {
    setError('')
    setNotice('')
    startTransition(async () => {
      const res = await task()
      if (!res.ok) return setError(res.error)
      setSecret(res.password && res.email ? { email: res.email, password: res.password } : null)
      setNotice(res.text)
      router.refresh()
    })
  }

  const create = (ev: React.FormEvent) => {
    ev.preventDefault()
    run(async () => {
      const res = await createUserAction(draft)
      if (!res.ok) return res
      setDraft({ name: '', email: '', role: draft.role })
      return { ok: true, email: res.email, password: res.temporaryPassword, text: `${res.email} was created.` }
    })
  }

  return (
    <>
      <div role="status" aria-live="polite">
        {error && <p className={editor.bad} role="alert">{error}</p>}
        {notice && !secret && <p className={editor.ok}>{notice}</p>}
      </div>
      {secret && (
        <section className={styles.secret} aria-label="Temporary password">
          <p><strong>Temporary password for {secret.email}</strong></p>
          <p><code>{secret.password}</code></p>
          <p className={editor.muted}>It is shown only once and is not stored anywhere readable. Give it to them in person or by phone. They must change it after signing in (Account, then Change password).</p>
          <button type="button" className={styles.small} onClick={() => setSecret(null)}>I have copied it, hide it</button>
        </section>
      )}

      <form className={styles.box} onSubmit={create} aria-labelledby={formId}>
        <h2 id={formId}>Add a user</h2>
        <div className={styles.grid}>
          <label>Name<input type="text" required maxLength={120} autoComplete="off" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label>Email<input type="email" required maxLength={200} autoComplete="off" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
          <label>Role
            <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}>
              {roles.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <button type="submit" className={editor.primary} disabled={pending}>Create user</button>
        </div>
        <p className={editor.hint} style={{ margin: '10px 0 0' }}>A random 16-character temporary password is made and shown once. Emailing it comes later.</p>
      </form>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={editor.srOnly}>Admin users</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Last sign-in</th>
              <th scope="col">Created</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const choice = roleChoice[u.id] ?? u.role
              return (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>{u.isSelf && <span className={editor.muted}> (you)</span>}
                    <span className={styles.sub}>{u.email}</span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <select aria-label={`Role for ${u.name}`} value={choice} disabled={pending} onChange={(e) => setRoleChoice({ ...roleChoice, [u.id]: e.target.value })}>
                        {roles.map((r) => <option key={r}>{r}</option>)}
                      </select>
                      {choice !== u.role && (
                        <button type="button" className={styles.small} disabled={pending} onClick={() => run(async () => {
                          const res = await changeRoleAction(u.id, choice)
                          if (res.ok) setRoleChoice((rc) => Object.fromEntries(Object.entries(rc).filter(([id]) => id !== u.id)))
                          return res.ok ? { ok: true, text: `${u.name} is now ${choice}.` } : res
                        })}>Save role</button>
                      )}
                    </div>
                  </td>
                  <td><span className={`${styles.badge} ${u.active ? styles.on : styles.off}`}>{u.active ? 'Active' : 'Deactivated'}</span></td>
                  <td className={styles.nowrap}>{u.lastLogin}</td>
                  <td className={styles.nowrap}>{u.created}</td>
                  <td>
                    <div className={styles.rowActions}>
                      {u.active ? (
                        <button type="button" className={`${styles.small} ${styles.warn}`} disabled={pending || u.isSelf} title={u.isSelf ? 'You cannot deactivate yourself' : undefined} onClick={() => {
                          if (!window.confirm(`Deactivate ${u.name}? They are signed out straight away and cannot sign in until reactivated.`)) return
                          run(async () => {
                            const res = await setActiveAction(u.id, false)
                            return res.ok ? { ok: true, text: `${u.name} was deactivated and signed out.` } : res
                          })
                        }}>Deactivate</button>
                      ) : (
                        <button type="button" className={styles.small} disabled={pending} onClick={() => run(async () => {
                          const res = await setActiveAction(u.id, true)
                          return res.ok ? { ok: true, text: `${u.name} can sign in again.` } : res
                        })}>Reactivate</button>
                      )}
                      <button type="button" className={styles.small} disabled={pending || u.isSelf} title={u.isSelf ? 'Use Change password for your own account' : undefined} onClick={() => {
                        if (!window.confirm(`Set a new temporary password for ${u.name}? Their current password stops working and they are signed out everywhere.`)) return
                        run(async () => {
                          const res = await resetPasswordAction(u.id)
                          return res.ok ? { ok: true, email: u.email, password: res.temporaryPassword, text: '' } : res
                        })
                      }}>Set temporary password</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
