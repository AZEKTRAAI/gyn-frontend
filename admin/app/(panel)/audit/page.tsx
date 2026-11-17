import type { Metadata } from 'next'
import Link from 'next/link'
import { requirePrisma } from '@gyn/core/db'
import { listAuditLog, type AuditFilters } from '@gyn/core/admin-users'
import { can } from '@gyn/core/permissions'
import { requireSession } from '@/lib/auth'
import { Forbidden } from '../Forbidden'
import editor from '@/components/editor.module.css'
import styles from '@/components/table.module.css'

export const metadata: Metadata = { title: 'Audit log' }
export const dynamic = 'force-dynamic'

const stamp = (d: Date) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' }).format(d) + ' UTC'
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
const show = (v: unknown) => (v === null || v === undefined ? null : JSON.stringify(v, null, 2))

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireSession()
  if (!can(session.permissions, 'audit.view')) return <Forbidden />
  const sp = await searchParams
  const filters: AuditFilters = { userId: one(sp.user), action: one(sp.action), entityType: one(sp.entity), from: one(sp.from), to: one(sp.to) }
  const page = Math.max(0, Number.parseInt(one(sp.page), 10) || 0)

  const prisma = requirePrisma()
  const [{ rows, more }, users, actions, entities] = await Promise.all([
    listAuditLog(prisma, filters, page),
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } }),
    prisma.auditLog.groupBy({ by: ['action'], orderBy: { action: 'asc' } }),
    prisma.auditLog.groupBy({ by: ['entityType'], orderBy: { entityType: 'asc' } }),
  ])

  const link = (p: number) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries({ user: filters.userId, action: filters.action, entity: filters.entityType, from: filters.from, to: filters.to })) if (v) q.set(k, v)
    if (p > 0) q.set('page', String(p))
    return `/audit${q.size ? `?${q}` : ''}`
  }
  const filtered = Object.values(filters).some(Boolean)

  return (
    <div className={editor.scope}>
      <div className={styles.head}>
        <div>
          <h1>Audit log</h1>
          <p className={editor.muted}>Who changed what and when, newest first. Nobody can edit or remove these rows. Times are UTC. Passwords are never recorded.</p>
        </div>
      </div>

      <form method="get" action="/audit" className={styles.filters}>
        <label>User
          <select name="user" defaultValue={filters.userId}>
            <option value="">Everyone</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </label>
        <label>Action
          <select name="action" defaultValue={filters.action}>
            <option value="">Any action</option>
            {actions.map((a) => <option key={a.action}>{a.action}</option>)}
          </select>
        </label>
        <label>Entity type
          <select name="entity" defaultValue={filters.entityType}>
            <option value="">Any type</option>
            {entities.map((e) => <option key={e.entityType}>{e.entityType}</option>)}
          </select>
        </label>
        <label>From<input type="date" name="from" defaultValue={filters.from} /></label>
        <label>To<input type="date" name="to" defaultValue={filters.to} /></label>
        <button type="submit" className={editor.primary}>Filter</button>
        {filtered && <Link href="/audit" className={editor.ghost}>Clear</Link>}
      </form>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={editor.srOnly}>Audit log, newest first</caption>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">User</th>
              <th scope="col">Action</th>
              <th scope="col">Entity</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const [oldV, newV, meta] = [show(r.oldValue), show(r.newValue), show(r.meta)]
              return (
                <tr key={r.id}>
                  <td className={styles.nowrap}>{stamp(r.createdAt)}</td>
                  <td>{r.userEmail ?? <span className={editor.muted}>unknown</span>}{r.ip && <span className={styles.sub}>{r.ip}</span>}</td>
                  <td><code>{r.action}</code></td>
                  <td>{r.entityType}<span className={`${styles.sub} ${styles.mono}`}>{r.entityId}</span></td>
                  <td>
                    {oldV || newV || meta ? (
                      <details>
                        <summary>Show values</summary>
                        <div className={styles.diff}>
                          {oldV && <div><h3>Before</h3><pre className={styles.json}>{oldV}</pre></div>}
                          {newV && <div><h3>After</h3><pre className={styles.json}>{newV}</pre></div>}
                          {meta && <div><h3>Extra</h3><pre className={styles.json}>{meta}</pre></div>}
                        </div>
                      </details>
                    ) : <span className={editor.muted}>none</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!rows.length && <p className={styles.empty}>{filtered ? 'Nothing matches these filters.' : 'Nothing has been logged yet.'}</p>}
      </div>

      <nav className={styles.pager} aria-label="Pages">
        {page > 0 ? <Link href={link(page - 1)} className={editor.ghost}>Newer</Link> : <span />}
        <span className={editor.muted}>Page {page + 1}</span>
        {more ? <Link href={link(page + 1)} className={editor.ghost}>Older</Link> : <span />}
      </nav>
    </div>
  )
}
