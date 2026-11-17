import type { Metadata } from 'next'
import Link from 'next/link'
import type { ContactMessage } from '@prisma/client'
import { can } from '@gyn/core/permissions'
import { CONTACT_TOPICS, ContactStoreUnavailable, firstLine, listContactMessages, parseFilters } from '@gyn/core/contact-store'
import { requireSession } from '@/lib/auth'
import { Forbidden } from '../Forbidden'
import editor from '@/components/editor.module.css'
import styles from './contact.module.css'
import { STATUS_LABEL, TOPIC_LABEL, stamp } from './view'

export const metadata: Metadata = { title: 'Contact inbox' }
export const dynamic = 'force-dynamic'

export default async function ContactInboxPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireSession()
  if (!can(session.permissions, 'contact.view')) return <Forbidden />
  const filters = parseFilters(await searchParams)
  let rows: ContactMessage[] = []
  let problem = ''
  try {
    rows = await listContactMessages(filters)
  } catch (e) {
    problem = e instanceof ContactStoreUnavailable ? e.message : 'The messages could not be loaded. Try again in a minute.'
    if (!(e instanceof ContactStoreUnavailable)) console.error('[admin] listContactMessages failed', e)
  }
  const unread = rows.filter((r) => r.status === 'NEW').length
  const filtered = Boolean(filters.status || filters.topic)

  return (
    <div className={editor.scope}>
      <div className={styles.head}>
        <div>
          <h1>Contact inbox</h1>
          <p className={editor.muted}>Messages sent through the website contact form, newest first.{!problem && ` ${unread} new in this list.`}</p>
        </div>
      </div>
      <form method="get" className={styles.filters}>
        <label>
          Status
          <select name="status" defaultValue={filters.status ?? ''}>
            <option value="">All</option>
            {Object.entries(STATUS_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
        <label>
          Topic
          <select name="topic" defaultValue={filters.topic ?? ''}>
            <option value="">All</option>
            {CONTACT_TOPICS.map((t) => <option key={t} value={t}>{TOPIC_LABEL[t]}</option>)}
          </select>
        </label>
        <button type="submit">Filter</button>
        {filtered && <Link href="/contact">Clear</Link>}
      </form>
      {problem && <p className={editor.bad} role="alert">{problem}</p>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={editor.srOnly}>Contact messages</caption>
          <thead>
            <tr>
              <th scope="col">From</th>
              <th scope="col">Topic</th>
              <th scope="col">Message</th>
              <th scope="col">Received</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className={m.status === 'NEW' ? styles.unread : undefined}>
                <td>
                  <Link href={`/contact/${m.id}`}>{m.name}</Link>
                  <span className={styles.sub}>{m.email}</span>
                </td>
                <td className={styles.nowrap}>{TOPIC_LABEL[m.topic] ?? m.topic}</td>
                <td className={styles.snippet}>{firstLine(m.message)}</td>
                <td className={styles.nowrap}>{stamp(m.submittedAt)}</td>
                <td><span className={`${styles.badge} ${styles[m.status.toLowerCase()]}`}>{STATUS_LABEL[m.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !problem && <p className={styles.empty}>{filtered ? 'No messages match these filters.' : 'No messages yet.'}</p>}
      </div>
    </div>
  )
}
