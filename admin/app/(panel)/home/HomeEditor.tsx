'use client'

// Form editor for the home page. The form is generated from the JSON Schema of features/home/schema.ts,
// so adding a field to the schema adds it here with no editor changes.
import Link from 'next/link'
import { useId, useMemo, useState, useTransition } from 'react'
import { homeSchema, type HomeContent } from '@gyn/core/home-schema'
import { SectionEditor, pathKey, setIn, useUnsavedWarning, type Errors, type JsonNode, type Path } from '@/components/SchemaForm'
import styles from '@/components/editor.module.css'
import { saveHomeAction } from './actions'

export function HomeEditor({
  initial,
  schema,
  storage,
  uploads,
}: {
  initial: HomeContent
  schema: JsonNode
  storage: 'database' | 'file' | 'none'
  uploads: 'cloudinary' | 'local' | 'none'
}) {
  const sections = useMemo(() => Object.entries(schema.properties ?? {}), [schema])
  const [doc, setDoc] = useState<HomeContent>(initial)
  const [saved, setSaved] = useState(() => JSON.stringify(initial))
  const [active, setActive] = useState(sections[0]?.[0] ?? 'hero')
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const statusId = useId()
  const dirty = JSON.stringify(doc) !== saved

  useUnsavedWarning(dirty)

  const onChange = (path: Path, value: unknown) => setDoc((d) => setIn(d, path, value) as HomeContent)

  function publish() {
    const local = homeSchema.safeParse(doc)
    if (!local.success) {
      const errs = Object.fromEntries(local.error.issues.map((i) => [pathKey(i.path as Path), i.message]))
      setErrors(errs)
      setActive(String(local.error.issues[0].path[0]))
      setStatus({ kind: 'error', text: `${local.error.issues.length} field${local.error.issues.length === 1 ? '' : 's'} need fixing. They are marked in red.` })
      return
    }
    startTransition(async () => {
      const res = await saveHomeAction(doc)
      if (res.ok) {
        setSaved(JSON.stringify(doc))
        setErrors({})
        setStatus({ kind: 'ok', text: `Published at ${new Date(res.savedAt).toLocaleTimeString()}. The home page now shows these changes.` })
      } else {
        setErrors(Object.fromEntries((res.issues ?? []).map((i) => [i.path, i.message])))
        setStatus({ kind: 'error', text: res.error })
      }
    })
  }

  return (
    <main id="main" className={styles.wrap}>
      <header className={styles.bar}>
        <div>
          <p className={styles.crumb}><Link href="/">Admin</Link> / Home page</p>
          <h1>Edit the home page</h1>
        </div>
        <div className={styles.barActions}>
          <span className={styles.muted} aria-live="polite">{dirty ? 'Unpublished changes' : 'Everything published'}</span>
          <a href="/" target="_blank" rel="noopener" className={styles.ghost}>View the site</a>
          <button type="button" className={styles.primary} onClick={publish} disabled={pending || !dirty || storage === 'none'} aria-describedby={statusId}>
            {pending ? 'Publishing…' : 'Publish changes'}
          </button>
        </div>
      </header>

      <div id={statusId} role="status" className={status ? (status.kind === 'ok' ? styles.ok : styles.bad) : styles.srOnly}>
        {status?.text}
      </div>
      {storage === 'none' && <p className={styles.bad}>Saving is off: this server has no database. Set DATABASE_URL to publish changes.</p>}
      {storage === 'file' && <p className={styles.note}>Development mode: changes are saved to content/home.json.</p>}

      <SectionEditor
        label="Home page sections"
        sections={sections}
        doc={doc as Record<string, unknown>}
        active={active}
        onActive={setActive}
        errors={errors}
        onChange={onChange}
        uploads={uploads}
      />
    </main>
  )
}
