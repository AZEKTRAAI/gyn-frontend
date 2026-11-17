import type { Metadata } from 'next'
import { requirePrisma } from '@gyn/core/db'
import { can } from '@gyn/core/permissions'
import { requireSession } from '@/lib/auth'
import { Forbidden } from '../Forbidden'
import editor from '@/components/editor.module.css'
import styles from '@/components/table.module.css'
import { UsersPanel } from './UsersPanel'

export const metadata: Metadata = { title: 'Users and roles' }
export const dynamic = 'force-dynamic'

const stamp = (d: Date) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(d) + ' UTC'

export default async function UsersPage() {
  const session = await requireSession()
  if (!can(session.permissions, 'users.manage')) return <Forbidden />
  const prisma = requirePrisma()
  const [users, roles] = await Promise.all([
    prisma.user.findMany({ include: { role: true }, orderBy: [{ active: 'desc' }, { createdAt: 'asc' }] }),
    prisma.role.findMany({ orderBy: { createdAt: 'asc' } }),
  ])

  return (
    <div className={editor.scope}>
      <div className={styles.head}>
        <div>
          <h1>Users and roles</h1>
          <p className={editor.muted}>People who can sign in to this admin. Accounts are deactivated, never deleted, because the audit log keeps pointing at them.</p>
        </div>
      </div>
      <UsersPanel
        roles={roles.map((r) => r.name)}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role.name,
          active: u.active,
          lastLogin: u.lastLoginAt ? stamp(u.lastLoginAt) : 'Never',
          created: stamp(u.createdAt),
          isSelf: u.id === session.user.id,
        }))}
      />

      <section className={styles.box} aria-labelledby="roles-h" style={{ marginTop: 20 }}>
        <h2 id="roles-h">What each role may do</h2>
        <p className={editor.muted}>Read only. Editing a role&apos;s permissions is not built yet: the roles are stored in the database but the seed rewrites them from code, so an edit screen needs that decided first.</p>
        <div className={styles.roles}>
          {roles.map((r) => {
            const all = r.permissions.includes('*')
            return (
              <details key={r.id}>
                <summary>{r.name} <span className={editor.muted}>({all ? 'everything' : `${r.permissions.length} permissions`}, {users.filter((u) => u.roleId === r.id).length} users)</span></summary>
                {r.description && <p>{r.description}</p>}
                {all ? <p>Every permission, including ones added later.</p> : <ul>{r.permissions.map((p) => <li key={p}><code>{p}</code></li>)}</ul>}
              </details>
            )
          })}
        </div>
      </section>
    </div>
  )
}
