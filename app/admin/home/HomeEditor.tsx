'use client'

// Form editor for the home page. The form is generated from the JSON Schema of features/home/schema.ts,
// so adding a field to the schema adds it here with no editor changes.
import { useEffect, useId, useMemo, useState, useTransition } from 'react'
import { homeSchema, type HomeContent } from '@/features/home/schema'
import { saveHomeAction, uploadImageAction } from './actions'
import styles from './editor.module.css'

export interface JsonNode {
  type?: string
  title?: string
  description?: string
  widget?: string
  properties?: Record<string, JsonNode>
  items?: JsonNode
  enum?: string[]
  anyOf?: JsonNode[]
  maxLength?: number
  maxItems?: number
}

type Path = (string | number)[]
type Errors = Record<string, string>

const pathKey = (p: Path) => p.join('.')

function setIn(obj: unknown, path: Path, value: unknown): unknown {
  if (!path.length) return value
  const [head, ...rest] = path
  if (Array.isArray(obj)) {
    const next = [...obj]
    next[head as number] = setIn(obj[head as number], rest, value)
    return next
  }
  const rec = obj as Record<string, unknown>
  return { ...rec, [head]: setIn(rec[head as string], rest, value) }
}

/** Empty value for a new list item. */
function blank(n: JsonNode): unknown {
  if (n.anyOf) return ''
  if (n.enum) return n.enum[0]
  if (n.type === 'object') return Object.fromEntries(Object.entries(n.properties ?? {}).map(([k, v]) => [k, blank(v)]))
  if (n.type === 'array') return []
  if (n.type === 'boolean') return true
  return ''
}

function itemLabel(item: unknown, fallback: string): string {
  const r = (item ?? {}) as Record<string, unknown>
  const v = [r.name, r.title, r.claim, r.label].find((x) => typeof x === 'string' && x.trim())
  return (v as string) || fallback
}

interface FieldProps {
  node: JsonNode
  path: Path
  value: unknown
  errors: Errors
  onChange: (path: Path, value: unknown) => void
  uploads: 'cloudinary' | 'local' | 'none'
}

function Field(props: FieldProps) {
  const { node, path, value, errors, onChange } = props
  const id = 'f-' + pathKey(path)
  const error = errors[pathKey(path)]
  const hintId = node.description ? id + '-hint' : undefined
  const errId = error ? id + '-err' : undefined
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined
  const label = node.title ?? String(path[path.length - 1])

  if (node.type === 'object' && node.properties) {
    return (
      <fieldset className={styles.group}>
        <legend>{label}</legend>
        {Object.entries(node.properties).map(([k, child]) => (
          <Field key={k} {...props} node={child} path={[...path, k]} value={(value as Record<string, unknown>)?.[k]} />
        ))}
      </fieldset>
    )
  }

  if (node.type === 'array' && node.items) {
    return <ListField {...props} label={label} />
  }

  const hint = node.description && <p id={hintId} className={styles.hint}>{node.description}</p>
  const err = error && <p id={errId} className={styles.error} role="alert">{error}</p>

  if (node.type === 'boolean') {
    return (
      <div className={styles.check}>
        <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(path, e.target.checked)} aria-describedby={describedBy} />
        <label htmlFor={id}>{label}</label>
        {hint}
        {err}
      </div>
    )
  }

  if (node.widget === 'image') return <ImageField {...props} id={id} label={label} hint={hint} err={err} describedBy={describedBy} />

  const str = typeof value === 'string' ? value : ''
  const common = {
    id,
    value: str,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    maxLength: node.maxLength,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(path, e.target.value),
  }
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {hint}
      {node.enum ? (
        <select {...common}>
          {node.enum.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : node.widget === 'textarea' ? (
        <textarea {...common} rows={Math.min(8, Math.max(3, Math.ceil(str.length / 70)))} />
      ) : node.widget === 'datetime' ? (
        <input {...common} type="datetime-local" />
      ) : (
        <input {...common} type="text" />
      )}
      {node.maxLength && node.maxLength >= 200 && <span className={styles.count}>{str.length} / {node.maxLength}</span>}
      {err}
    </div>
  )
}

function ListField(props: FieldProps & { label: string }) {
  const { node, path, value, onChange, label } = props
  const items = Array.isArray(value) ? value : []
  const itemNode = node.items!
  const itemTitle = itemNode.title ?? 'item'
  const full = node.maxItems !== undefined && items.length >= node.maxItems
  const move = (from: number, to: number) => {
    const next = [...items]
    const [it] = next.splice(from, 1)
    next.splice(to, 0, it)
    onChange(path, next)
  }
  return (
    <fieldset className={styles.group}>
      <legend>{label} <span className={styles.muted}>({items.length}{node.maxItems ? ` of max ${node.maxItems}` : ''})</span></legend>
      {node.description && <p className={styles.hint}>{node.description}</p>}
      <ol className={styles.list}>
        {items.map((item, i) => {
          const name = itemLabel(item, `${itemTitle} ${i + 1}`)
          return (
            <li key={i} className={styles.item}>
              <details>
                <summary>{name}</summary>
                <div className={styles.itemBody}>
                  <Field {...props} node={itemNode} path={[...path, i]} value={item} />
                </div>
              </details>
              <div className={styles.itemActions}>
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${name} up`}>Up</button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label={`Move ${name} down`}>Down</button>
                <button
                  type="button"
                  className={styles.danger}
                  onClick={() => window.confirm(`Remove "${name}"?`) && onChange(path, items.filter((_, j) => j !== i))}
                  aria-label={`Remove ${name}`}
                >
                  Remove
                </button>
              </div>
            </li>
          )
        })}
      </ol>
      <button type="button" className={styles.add} disabled={full} onClick={() => onChange(path, [...items, blank(itemNode)])}>
        Add {itemTitle.toLowerCase()}
      </button>
    </fieldset>
  )
}

function ImageField(props: FieldProps & { id: string; label: string; hint: React.ReactNode; err: React.ReactNode; describedBy?: string }) {
  const { id, label, hint, err, describedBy, value, path, onChange, uploads } = props
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const src = typeof value === 'string' ? value : ''
  async function upload(file: File) {
    setBusy(true)
    setMsg('')
    const fd = new FormData()
    fd.set('file', file)
    const res = await uploadImageAction(fd)
    setBusy(false)
    if (res.ok) onChange(path, res.src)
    else setMsg(res.error)
  }
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {hint}
      <div className={styles.image}>
        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary uploads */}
        {src ? <img src={src} alt="" /> : <span className={styles.noImg}>No image</span>}
        <div>
          <input id={id} type="text" value={src} onChange={(e) => onChange(path, e.target.value)} aria-describedby={describedBy} />
          {uploads !== 'none' && (
            <label className={styles.upload}>
              {busy ? 'Uploading…' : 'Upload a new image'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void upload(f)
                  e.target.value = ''
                }}
              />
            </label>
          )}
          {msg && <p className={styles.error} role="alert">{msg}</p>}
        </div>
      </div>
      {err}
    </div>
  )
}

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

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

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

  const errorSections = new Set(Object.keys(errors).map((k) => k.split('.')[0]))
  const activeNode = sections.find(([k]) => k === active)?.[1]
  const sectionValue = (doc as Record<string, unknown>)[active] as Record<string, unknown>

  return (
    <main id="main" className={styles.wrap}>
      <header className={styles.bar}>
        <div>
          <p className={styles.crumb}><a href="/admin">Admin</a> / Home page</p>
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

      <div className={styles.layout}>
        <nav aria-label="Home page sections" className={styles.nav}>
          <ul>
            {sections.map(([key, node]) => {
              const v = (doc as Record<string, unknown>)[key] as { visible?: boolean }
              return (
                <li key={key}>
                  <button type="button" aria-current={active === key ? 'true' : undefined} onClick={() => setActive(key)}>
                    {node.title ?? key}
                    {v?.visible === false && <span className={styles.muted}> (hidden)</span>}
                    {errorSections.has(key) && <span className={styles.dot} aria-label="has errors" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <section className={styles.form} aria-labelledby="section-title">
          <h2 id="section-title">{activeNode?.title ?? active}</h2>
          {activeNode?.properties &&
            Object.entries(activeNode.properties).map(([k, child]) => (
              <Field key={active + k} node={child} path={[active, k]} value={sectionValue?.[k]} errors={errors} onChange={onChange} uploads={uploads} />
            ))}
        </section>
      </div>
    </main>
  )
}
