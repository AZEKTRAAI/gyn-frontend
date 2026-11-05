'use client'

import { useActionState } from 'react'
import { loginAction } from './actions'
import styles from './login.module.css'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null)
  return (
    <form action={formAction} className={styles.form}>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      {state?.error && (
        <p role="alert" className={styles.error}>
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
