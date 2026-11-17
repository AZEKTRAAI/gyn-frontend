'use client'

// "New event": the few facts needed to create a draft. Everything else is edited on the event's own page afterwards.
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { Field, setIn, type Path } from '@/components/SchemaForm'
import styles from '@/components/editor.module.css'
import { newEventNode, slugify, validateDetails, validateSlug, type FieldIssues } from '@/lib/event-form'
import { createEventAction } from '../actions'

const EMPTY = { name: '', slug: '', kind: 'upcoming', startsAt: '', endsAt: '', timezone: 'Asia/Kuala_Lumpur', venue: '', city: '', country: '' }
type Form = typeof EMPTY

export function NewEventForm() {
  const router = useRouter()
  const [form, setForm] = useState<Form>(EMPTY)
  // Until the person types their own address, it follows the name.
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState<FieldIssues>({})
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()
  const statusId = useId()

  const onChange = (path: Path, value: unknown) => {
    const key = String(path[0])
    setForm((f) => {
      const next = setIn(f, path, value) as Form
      if (key === 'name' && !slugTouched) next.slug = slugify(String(value))
      return next
    })
    if (key === 'slug') setSlugTouched(String(value) !== '')
    setErrors((e) => (e[key] ? { ...e, [key]: '' } : e))
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault()
    const { slug, kind, ...details } = form
    const found: FieldIssues = validateDetails({ ...details, shortName: '', theme: '', navLabel: '', timingOverride: '', featured: false })
    const slugError = validateSlug(slug)
    if (slugError) found.slug = slugError
    if (Object.keys(found).length) {
      setErrors(found)
      setMessage(`${Object.keys(found).length} field${Object.keys(found).length === 1 ? ' needs' : 's need'} fixing. ${Object.keys(found).length === 1 ? 'It is' : 'They are'} marked in red.`)
      return
    }
    setErrors({})
    setMessage('')
    startTransition(async () => {
      const res = await createEventAction({ slug, kind, details: { ...details, shortName: '', theme: '', navLabel: '', timingOverride: '', featured: false } })
      if (res.ok) {
        router.push(`/events/${res.slug}`)
        return
      }
      setErrors(Object.fromEntries((res.issues ?? []).map((i) => [i.path, i.message])))
      setMessage(res.error)
    })
  }

  return (
    <div className={styles.scope}>
      <p className={styles.crumb}><Link href="/events">Events</Link> / New event</p>
      <h1>New event</h1>
      <p className={styles.muted}>It starts as a draft. Nobody sees it on the website until you publish it.</p>
      <form onSubmit={submit} noValidate className={styles.form} aria-describedby={statusId} style={{ maxWidth: 720, marginTop: 16 }}>
        {Object.entries(newEventNode.properties ?? {}).map(([k, node]) => (
          <Field key={k} node={node} path={[k]} value={form[k as keyof Form]} errors={errors} onChange={onChange} uploads="none" />
        ))}
        <div id={statusId} role="status" className={message ? styles.bad : styles.srOnly}>{message}</div>
        <div className={styles.barActions}>
          <button type="submit" className={styles.primary} disabled={pending}>{pending ? 'Creating…' : 'Create event'}</button>
          <Link href="/events" className={styles.ghost}>Cancel</Link>
        </div>
      </form>
    </div>
  )
}
