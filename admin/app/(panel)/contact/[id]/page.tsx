import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { can } from '@gyn/core/permissions'
import { ContactStoreUnavailable, getContactMessage } from '@gyn/core/contact-store'
import { requireSession } from '@/lib/auth'
import { Forbidden } from '../../Forbidden'
import { setStatusAction } from '../actions'
import { STATUS_LABEL, TOPIC_LABEL, stamp } from '../view'
import editor from '@/components/editor.module.css'
import styles from '../contact.module.css'

export const metadata: Metadata = { title: 'Contact message' }
export const dynamic = 'force-dynamic'

const BUTTONS = [['READ', 'Mark as read'], ['NEW', 'Mark as new'], ['ARCHIVED', 'Archive']] as const

export default async function ContactMessagePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ failed?: string }> }) {
  const session = await requireSession()
  if (!can(session.permissions, 'contact.view')) return <Forbidden />
  const { id } = await params
  const { failed } = await searchParams
  let m
  try {
    m = await getContactMessage(id)
  } catch (e) {
    if (!(e instanceof ContactStoreUnavailable)) throw e
    return <p className={editor.bad} role="alert">{e.message}</p>
  }
  if (!m) notFound()
  const subject = `Re: your message to GYN (${TOPIC_LABEL[m.topic] ?? m.topic})`
  // The address is encoded, so it cannot add mail headers or break out of the link.
  const mailto = `mailto:${encodeURIComponent(m.email).replace(/%40/g, '@')}?subject=${encodeURIComponent(subject)}`

  return (
    <div className={editor.scope}>
      <p className={editor.crumb}><Link href="/contact">Contact inbox</Link></p>
      <div className={styles.head}>
        <h1>{m.name}</h1>
        <span className={`${styles.badge} ${styles[m.status.toLowerCase()]}`}>{STATUS_LABEL[m.status]}</span>
      </div>
      {failed && <p className={editor.bad} role="alert">The status was not changed. The message may have been removed, you may have lost access, or the database is unreachable. Try again in a minute.</p>}
      <div className={styles.card}>
        <dl className={styles.facts}>
          <dt>Email</dt><dd>{m.email}</dd>
          <dt>Topic</dt><dd>{TOPIC_LABEL[m.topic] ?? m.topic}</dd>
          <dt>Received</dt><dd>{stamp(m.submittedAt)}</dd>
          {m.readAt && <><dt>First read</dt><dd>{stamp(m.readAt)}</dd></>}
          {m.ipAddress && <><dt>IP address</dt><dd>{m.ipAddress}</dd></>}
        </dl>
        <p className={styles.body}>{m.message}</p>
        <div className={styles.btns}>
          <a className={styles.reply} href={mailto}>Reply by email</a>
          {BUTTONS.filter(([s]) => s !== m.status).map(([s, text]) => (
            <form key={s} action={setStatusAction}>
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="status" value={s} />
              <button type="submit">{text}</button>
            </form>
          ))}
        </div>
      </div>
    </div>
  )
}
