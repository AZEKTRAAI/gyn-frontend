import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DEMO_PASSWORD, DEMO_USERS } from '@gyn/core/access-seed'
import { LoginForm } from './LoginForm'
import styles from './login.module.css'

export const metadata: Metadata = { title: 'Sign in' }
export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  if (await getSession()) redirect('/')
  // Only when the development flag is set: lists the dummy accounts so they are easy to try. Never on a real server.
  const showDemo = process.env.ALLOW_DEMO_ACCOUNTS === '1' && process.env.NODE_ENV !== 'production'
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1>GYN Admin</h1>
        <p className={styles.sub}>Sign in with your staff account.</p>
        <LoginForm />
      </div>
      {showDemo && (
        <aside className={styles.demo} aria-label="Demo accounts">
          <h2>Demo accounts (development only)</h2>
          <p>
            Password for all of them: <code>{DEMO_PASSWORD}</code>
          </p>
          <ul>
            {DEMO_USERS.map((u) => (
              <li key={u.email}>
                <code>{u.email}</code> <span>{u.role}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </main>
  )
}
