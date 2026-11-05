import { redirect } from 'next/navigation'
import { can } from '@gyn/core/permissions'
import { requireSession, signOut } from '@/lib/auth'
import { MODULES } from '@/lib/modules'
import { NavLinks } from './NavLinks'
import styles from './panel.module.css'

export const dynamic = 'force-dynamic'

async function signOutAction() {
  'use server'
  await signOut()
  redirect('/login')
}

// The frame around every signed-in page. Each page still checks the session and permission itself: a layout is not re-run on
// every navigation, so it cannot be the only gate.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  const items = MODULES.filter((m) => can(session.permissions, m.permission)).map((m) => ({ href: m.href, label: m.label, built: m.built }))
  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        <div className={styles.brand}>GYN Admin</div>
        <NavLinks items={items} />
      </aside>
      <div className={styles.main}>
        <header className={styles.top}>
          <div>
            <strong>{session.user.name}</strong>
            <span className={styles.role}>{session.roleName}</span>
          </div>
          <form action={signOutAction}>
            <button type="submit">Sign out</button>
          </form>
        </header>
        <main id="main" className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  )
}
