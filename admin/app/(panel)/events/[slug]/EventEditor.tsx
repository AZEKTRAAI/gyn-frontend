'use client'

// One event: its details (name, dates, venue ...) and its page (the sections, generated from eventPageSchema), plus the
// status buttons. Without events.manage everything is shown but cannot be changed.
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useMemo, useState, useTransition } from 'react'
import { eventPageSchema, type EventDetails, type EventPageContent } from '@gyn/core/event-schema'
import type { EventStatus } from '@gyn/core/event-store'
import { Field, SectionEditor, setIn, useUnsavedWarning, type Errors, type JsonNode, type Path } from '@/components/SchemaForm'
import editor from '@/components/editor.module.css'
import { detailsNode, issuesToErrors, validateDetails } from '@/lib/event-form'
import type { CategoryRow } from '@gyn/core/category-store'
import { saveEventAction, setEventStatusAction } from '../actions'
import { CategoriesPanel } from './CategoriesPanel'
import styles from '../events.module.css'

type Tab = 'details' | 'page' | 'categories'
const TABS: [Tab, string][] = [['details', 'Details'], ['page', 'Page'], ['categories', 'Registration categories']]

const STATUS_TEXT: Record<EventStatus, string> = {
  DRAFT: 'Draft: only the team can see it. It is not on the website or in the menu.',
  PUBLISHED: 'Published: the page is live and the event is in the site menu.',
  ARCHIVED: 'Archived: hidden from the website and the menu. It can be published again.',
}
const STATUS_LABEL: Record<EventStatus, string> = { DRAFT: 'Draft', PUBLISHED: 'Published', ARCHIVED: 'Archived' }
const STATUS_CLASS: Record<EventStatus, string> = { DRAFT: styles.draft, PUBLISHED: styles.published, ARCHIVED: styles.archived }
const CONFIRM: Record<EventStatus, string> = {
  PUBLISHED: 'Publish this event? Its page goes live and it appears in the site menu.',
  DRAFT: 'Move this event back to draft? It disappears from the website and the menu until you publish it again.',
  ARCHIVED: 'Archive this event? It disappears from the website and the menu. You can publish it again later.',
}
const STATUS_BUTTONS: [EventStatus, string][] = [
  ['PUBLISHED', 'Publish'],
  ['DRAFT', 'Move to draft'],
  ['ARCHIVED', 'Archive'],
]

export function EventEditor(props: {
  slug: string
  name: string
  initialStatus: EventStatus
  initialUpdatedAt: string
  timing: 'upcoming' | 'past'
  initialDetails: EventDetails
  initialContent: EventPageContent
  categories: CategoryRow[]
  timezone: string
  schema: JsonNode
  canManage: boolean
  viewUrl: string
}) {
  const { slug, canManage, schema } = props
  const sections = useMemo(() => Object.entries(schema.properties ?? {}), [schema])
  const [details, setDetails] = useState(props.initialDetails)
  const [content, setContent] = useState(props.initialContent)
  const [saved, setSaved] = useState(() => JSON.stringify([props.initialDetails, props.initialContent]))
  const [status, setStatus] = useState(props.initialStatus)
  // The version this edit started from, sent with every save. A save or status change moves it forward.
  const [updatedAt, setUpdatedAt] = useState(props.initialUpdatedAt)
  const [tab, setTab] = useState<Tab>('details')
  const [active, setActive] = useState(sections[0]?.[0] ?? 'hero')
  const [detailErrors, setDetailErrors] = useState<Errors>({})
  const [pageErrors, setPageErrors] = useState<Errors>({})
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const statusId = useId()
  const dirty = JSON.stringify([details, content]) !== saved
  useUnsavedWarning(dirty)

  const onDetail = (path: Path, value: unknown) => setDetails((d) => setIn(d, path, value) as EventDetails)
  const onPage = (path: Path, value: unknown) => setContent((c) => setIn(c, path, value) as EventPageContent)

  function showErrors(d: Errors, p: Errors) {
    setDetailErrors(d)
    setPageErrors(p)
    const n = Object.keys(d).length + Object.keys(p).length
    if (Object.keys(d).length) setTab('details')
    else if (n) {
      setTab('page')
      setActive(Object.keys(p)[0].split('.')[0])
    }
    setMessage({ kind: 'error', text: `${n} field${n === 1 ? ' needs' : 's need'} fixing. ${n === 1 ? 'It is' : 'They are'} marked in red.` })
  }

  function save() {
    const d = validateDetails(details)
    const page = eventPageSchema.safeParse(content)
    const p = page.success ? {} : issuesToErrors(page.error.issues)
    if (Object.keys(d).length || Object.keys(p).length) return showErrors(d, p)
    startTransition(async () => {
      const res = await saveEventAction(slug, { details, content, expectedUpdatedAt: updatedAt })
      if (res.ok) {
        setUpdatedAt(res.updatedAt)
        setSaved(JSON.stringify([details, content]))
        setDetailErrors({})
        setPageErrors({})
        const live = status === 'PUBLISHED' ? 'The website now shows these changes.' : 'It is not published, so the website is unchanged.'
        router.refresh() // the heading and the timing badge come from the saved event
        setMessage({ kind: 'ok', text: `Saved at ${new Date(res.savedAt).toLocaleTimeString()}. ${live}` })
      } else if (res.issues?.length) {
        const pick = (area: string) => Object.fromEntries(res.issues!.filter((i) => i.area === area).map((i) => [i.path, i.message]))
        showErrors(pick('details'), pick('page'))
        setMessage({ kind: 'error', text: res.error })
      } else {
        setMessage({ kind: 'error', text: res.error })
      }
    })
  }

  function change(next: EventStatus) {
    if (!window.confirm(CONFIRM[next])) return
    startTransition(async () => {
      const res = await setEventStatusAction(slug, next)
      if (res.ok) {
        setStatus(res.status)
        if (res.updatedAt) setUpdatedAt(res.updatedAt)
        setMessage({ kind: 'ok', text: `Now ${STATUS_LABEL[res.status].toLowerCase()}.` })
      } else {
        setMessage({ kind: 'error', text: res.error })
      }
    })
  }

  const errorCount = { details: Object.keys(detailErrors).length, page: Object.keys(pageErrors).length }

  return (
    <div className={editor.scope}>
      <header className={editor.bar}>
        <div>
          <p className={editor.crumb}><Link href="/events">Events</Link> / {props.name}</p>
          <div className={styles.titleRow}>
            <h1>{props.name}</h1>
            <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
            <span className={`${styles.badge} ${styles[props.timing]}`}>{props.timing === 'upcoming' ? 'Upcoming' : 'Past'}</span>
          </div>
          <p className={styles.meta}>Address: /{slug}</p>
        </div>
        <div className={editor.barActions}>
          {canManage && <span className={editor.muted} aria-live="polite">{dirty ? 'Unsaved changes' : 'Everything saved'}</span>}
          <a href={props.viewUrl} target="_blank" rel="noopener" className={editor.ghost}>View page{status === 'PUBLISHED' ? '' : ' (not public yet)'}</a>
          {canManage && (
            <button type="button" className={editor.primary} onClick={save} disabled={pending || !dirty} aria-describedby={statusId}>
              {pending ? 'Working…' : 'Save changes'}
            </button>
          )}
        </div>
      </header>

      <div id={statusId} role="status" className={message ? (message.kind === 'ok' ? editor.ok : editor.bad) : editor.srOnly}>
        {message?.text}
      </div>
      {!canManage && <p className={editor.note}>You can look at this event but not change it. Editing needs the Events Manager role.</p>}

      <div className={styles.statusBox}>
        <p>{STATUS_TEXT[status]}{canManage && dirty ? ' Save your changes before changing the status.' : ''}</p>
        {canManage && (
          <div className={styles.statusBtns}>
            {STATUS_BUTTONS.filter(([s]) => s !== status).map(([s, label]) => (
              <button
                key={s}
                type="button"
                className={s === 'PUBLISHED' ? styles.go : s === 'ARCHIVED' ? styles.warn : undefined}
                disabled={pending || dirty}
                onClick={() => change(s)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Event">
        {TABS.map(([key, label], i) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`panel-${key}`}
            tabIndex={tab === key ? 0 : -1}
            className={styles.tab}
            onClick={() => setTab(key)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
              const other = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length][0]
              setTab(other)
              document.getElementById(`tab-${other}`)?.focus()
            }}
          >
            {label}
            {key !== 'categories' && errorCount[key] > 0 && <span className={styles.tabDot} aria-label="has errors" />}
          </button>
        ))}
      </div>

      <div className={styles.panel} role="tabpanel" id="panel-details" aria-labelledby="tab-details" hidden={tab !== 'details'}>
        <section className={`${editor.form} ${styles.details}`} aria-label="Event details">
          <h2>{detailsNode.title}</h2>
          <fieldset className={editor.bare} disabled={!canManage}>
            {Object.entries(detailsNode.properties ?? {}).map(([k, node]) => (
              <Field key={k} node={node} path={[k]} value={details[k as keyof EventDetails]} errors={detailErrors} onChange={onDetail} uploads="none" />
            ))}
          </fieldset>
        </section>
      </div>
      <div className={styles.panel} role="tabpanel" id="panel-page" aria-labelledby="tab-page" hidden={tab !== 'page'}>
        <SectionEditor
          label="Event page sections"
          sections={sections}
          doc={content as unknown as Record<string, unknown>}
          active={active}
          onActive={setActive}
          errors={pageErrors}
          onChange={onPage}
          uploads="local"
          readOnly={!canManage}
        />
      </div>
      <div className={styles.panel} role="tabpanel" id="panel-categories" aria-labelledby="tab-categories" hidden={tab !== 'categories'}>
        <CategoriesPanel eventSlug={slug} categories={props.categories} timezone={props.timezone} canManage={canManage} sectionVisible={content.categories.visible} />
      </div>
    </div>
  )
}
