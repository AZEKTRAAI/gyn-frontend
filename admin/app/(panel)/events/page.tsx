import type { Metadata } from 'next'
import Link from 'next/link'
import { can } from '@gyn/core/permissions'
import { listAllEvents, EventStoreUnavailable, type AdminEventRow } from '@gyn/core/event-store'
import { requireSession } from '@/lib/auth'
import { Forbidden } from '../Forbidden'
import editor from '@/components/editor.module.css'
import styles from './events.module.css'

export const metadata: Metadata = { title: 'Events' }
export const dynamic = 'force-dynamic'

const STATUS = { PUBLISHED: ['Published', styles.published], DRAFT: ['Draft', styles.draft], ARCHIVED: ['Archived', styles.archived] } as const

// Event days are calendar days in the event's own time zone; the last-updated time is shown in UTC like the dashboard.
const day = (d: Date, tz: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: tz }).format(d)
const stamp = (d: Date) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(d) + ' UTC'
const range = (e: AdminEventRow) => {
  const [a, b] = [day(e.startsAt, e.timezone), day(e.endsAt, e.timezone)]
  return a === b ? a : `${a} to ${b}`
}

export default async function EventsPage() {
  const session = await requireSession()
  if (!can(session.permissions, 'events.view')) return <Forbidden />
  const canManage = can(session.permissions, 'events.manage')
  let events: AdminEventRow[] = []
  let problem = ''
  try {
    events = await listAllEvents()
  } catch (e) {
    problem = e instanceof EventStoreUnavailable ? e.message : 'The events could not be loaded. Try again in a minute.'
    if (!(e instanceof EventStoreUnavailable)) console.error('[admin] listAllEvents failed', e)
  }

  return (
    <div className={editor.scope}>
      <div className={styles.head}>
        <div>
          <h1>Events</h1>
          <p className={editor.muted}>Upcoming events first, then past ones. An event moves to past by itself once its last day has gone by.</p>
        </div>
        {canManage && <Link href="/events/new" className={editor.primary}>New event</Link>}
      </div>
      {problem && <p className={editor.bad} role="alert">{problem}</p>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={editor.srOnly}>All events</caption>
          <thead>
            <tr>
              <th scope="col">Event</th>
              <th scope="col">Dates</th>
              <th scope="col">Timing</th>
              <th scope="col">Status</th>
              <th scope="col">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              const [label, cls] = STATUS[e.status]
              return (
                <tr key={e.slug}>
                  <td>
                    <Link href={`/events/${e.slug}`}>{e.name}</Link>
                    <span className={styles.sub}>/{e.slug}{e.city ? ` · ${[e.city, e.country].filter(Boolean).join(', ')}` : ''}</span>
                  </td>
                  <td className={styles.nowrap}>{range(e)}</td>
                  <td><span className={`${styles.badge} ${styles[e.timing]}`}>{e.timing === 'upcoming' ? 'Upcoming' : 'Past'}</span>{e.featured && <> <span className={`${styles.badge} ${styles.upcoming}`}>Featured</span></>}</td>
                  <td><span className={`${styles.badge} ${cls}`}>{label}</span></td>
                  <td className={styles.nowrap}>{stamp(e.updatedAt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!events.length && !problem && <p className={styles.empty}>No events yet.{canManage ? ' Use "New event" to create the first one.' : ''}</p>}
      </div>
    </div>
  )
}
