'use client'

// The event's registration categories: the list (fee, approval, seats, open or closed, order) and the add/edit form.
// Each change is saved at once and does not wait for the page's Save button. Without events.manage it is read only.
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { APPROVAL_MODES, CURRENCIES, blankCategory, categoryFormSchema, type CategoryFormValues } from '@gyn/core/category-schema'
import type { CategoryPhase, CategoryRow } from '@gyn/core/category-store'
import { Field, setIn, type Errors, type JsonNode, type Path } from '@/components/SchemaForm'
import editor from '@/components/editor.module.css'
import { issuesToErrors, slugify } from '@/lib/event-form'
import { moveCategoryAction, removeCategoryAction, saveCategoryAction } from '../actions'
import styles from '../events.module.css'

const text = (title: string, extra: Partial<JsonNode> = {}): JsonNode => ({ type: 'string', title, ...extra })
const FIELDS: Record<keyof CategoryFormValues, JsonNode> = {
  name: text('Name', { maxLength: 80, description: 'Shown on the card, e.g. "Forum Access" or "Fully Funded Scholarship".' }),
  slug: text('Address', { maxLength: 60, description: 'Short lower-case name used in links, e.g. forum-access. It cannot be changed once someone has registered.' }),
  description: text('Description', { maxLength: 500, widget: 'textarea', description: 'Optional. A line or two shown on the card.' }),
  fee: text('Fee', { description: 'The amount to pay, e.g. 299 or 299.50. Enter 0 for free (or for a scholarship application with no fee).' }),
  currency: text('Currency', { enum: [...CURRENCIES] }),
  approvalMode: text('How applications are decided', {
    enum: [...APPROVAL_MODES],
    enumLabels: {
      AUTOMATIC: 'Automatic: accepted as soon as payment is verified',
      MANUAL_REVIEW: 'Manual review: the team accepts, waitlists or rejects each application',
    },
  }),
  seatLimit: text('Seats', { description: 'The most registrations this category takes. Leave empty for unlimited.' }),
  active: { type: 'boolean', title: 'Open for registration', description: 'Switch off to show the card as Closed without removing it.' },
  opensAt: text('First day to register', { widget: 'date', description: 'Optional. In the event\'s time zone. Empty means open from now.' }),
  closesAt: text('Last day to register', { widget: 'date', description: 'Optional. Registration stays open until the end of this day. Empty means no end date.' }),
}

const PHASE: Record<CategoryPhase, [string, string]> = {
  open: ['Open', styles.published],
  off: ['Closed (switched off)', styles.archived],
  'not-yet': ['Not open yet', styles.draft],
  ended: ['Closed (deadline passed)', styles.archived],
}

const fmtDay = (ymd: string) => new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const when = (v: CategoryFormValues) =>
  [v.opensAt && `from ${fmtDay(v.opensAt)}`, v.closesAt && `until ${fmtDay(v.closesAt)}`].filter(Boolean).join(' ')

const prefixed = (e: Errors): Errors => Object.fromEntries(Object.entries(e).map(([k, v]) => [`cat.${k}`, v]))

type Editing = { id: string | null; values: CategoryFormValues; slugLocked: boolean; slugTouched: boolean }

export function CategoriesPanel(props: { eventSlug: string; categories: CategoryRow[]; timezone: string; canManage: boolean; sectionVisible: boolean }) {
  const { eventSlug, categories, canManage } = props
  const [editing, setEditing] = useState<Editing | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function done(text: string) {
    setMessage({ kind: 'ok', text })
    setEditing(null)
    setErrors({})
    router.refresh()
  }

  function submit() {
    if (!editing) return
    const parsed = categoryFormSchema.safeParse(editing.values)
    if (!parsed.success) {
      setErrors(prefixed(issuesToErrors(parsed.error.issues)))
      setMessage({ kind: 'error', text: 'Some fields need fixing. They are marked in red.' })
      return
    }
    startTransition(async () => {
      const res = await saveCategoryAction(eventSlug, editing.id, editing.values)
      if (res.ok) return done(`Saved "${editing.values.name}". The website shows it within a few minutes at most.`)
      setErrors(prefixed(Object.fromEntries((res.issues ?? []).map((i) => [i.path, i.message]))))
      setMessage({ kind: 'error', text: res.error })
    })
  }

  function run(action: () => ReturnType<typeof moveCategoryAction>, okText: string) {
    startTransition(async () => {
      const res = await action()
      if (res.ok) {
        setMessage({ kind: 'ok', text: okText })
        router.refresh()
      } else setMessage({ kind: 'error', text: res.error })
    })
  }

  function remove(c: CategoryRow) {
    const n = c.registrations
    const keeps = n ? `The ${n} existing registration${n === 1 ? '' : 's'} stay${n === 1 ? 's' : ''} in the system untouched.` : 'Nothing has been registered under it.'
    if (!window.confirm(`Remove "${c.values.name}"?\n\nIt is hidden from the event page and from the registration options. ${keeps}\nIts address "${c.values.slug}" stays reserved.`)) return
    run(() => removeCategoryAction(eventSlug, c.id), `Removed "${c.values.name}".`)
  }

  // Field ids come from the path; the Details tab already has name and city fields, so these live under "cat" to keep ids unique.
  function onField(path: Path, value: unknown) {
    const key = path[1]
    setEditing((e) => {
      if (!e) return e
      let values = setIn(e.values, [key], value) as CategoryFormValues
      let slugTouched = e.slugTouched
      if (key === 'slug') slugTouched = true
      // A new category's address follows its name until the person types their own.
      else if (key === 'name' && !e.id && !e.slugTouched) values = { ...values, slug: slugify(String(value)) }
      return { ...e, values, slugTouched }
    })
  }

  const open = (c: CategoryRow | null) => {
    setMessage(null)
    setErrors({})
    setEditing(c ? { id: c.id, values: c.values, slugLocked: c.registrations > 0, slugTouched: true } : { id: null, values: blankCategory, slugLocked: false, slugTouched: false })
  }

  return (
    <div>
      <section className={styles.catHead} aria-label="About registration categories">
        <p>
          Registration categories are the ways someone can join this event, for example Forum Access or a scholarship application. Each has a fee, a way
          applications are decided, and optionally a seat limit and a registration window.
        </p>
        <p className={styles.catNote}>
          <strong>Changing a fee does not change what existing registrants paid.</strong> Each registration keeps the amount it was made with. The new fee
          applies to registrations made from now on.
        </p>
        <p className={styles.catNote}>
          Each card&apos;s Register button goes to a fixed page chosen by its address (forum-access, self-funded and invitation-letter). Other categories show a
          &quot;Contact us&quot; button until the form builder arrives.
        </p>
        {!props.sectionVisible && (
          <p className={editor.note}>The &quot;Registration categories&quot; section of the Page tab is switched off, so these cards are not shown on the event page.</p>
        )}
      </section>

      <div role="status" className={message ? (message.kind === 'ok' ? editor.ok : editor.bad) : editor.srOnly}>{message?.text}</div>
      {!canManage && <p className={editor.note}>You can look at the categories but not change them. Editing needs the Events Manager role.</p>}

      <div className={styles.catBar}>
        <h2>Categories ({categories.length})</h2>
        {canManage && !editing && <button type="button" className={editor.primary} onClick={() => open(null)} disabled={pending}>Add a category</button>}
      </div>

      {editing && (
        <form
          className={`${editor.form} ${styles.catForm}`}
          aria-label={editing.id ? `Edit ${editing.values.name}` : 'New category'}
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <h2>{editing.id ? `Edit "${categories.find((c) => c.id === editing.id)?.values.name ?? ''}"` : 'New category'}</h2>
          <fieldset className={editor.bare} disabled={pending}>
            {(Object.keys(FIELDS) as (keyof CategoryFormValues)[]).map((k) => {
              const field = <Field key={k} node={FIELDS[k]} path={['cat', k]} value={editing.values[k]} errors={errors} onChange={onField} uploads="none" />
              return k === 'slug' && editing.slugLocked ? <fieldset key={k} className={editor.bare} disabled>{field}</fieldset> : field
            })}
          </fieldset>
          <p className={editor.hint}>Dates use the event&apos;s time zone ({props.timezone}).</p>
          <div className={styles.catActions}>
            <button type="submit" className={editor.primary} disabled={pending}>{pending ? 'Saving…' : editing.id ? 'Save category' : 'Add category'}</button>
            <button type="button" className={editor.ghost} disabled={pending} onClick={() => { setEditing(null); setErrors({}) }}>Cancel</button>
          </div>
        </form>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={editor.srOnly}>Registration categories in page order</caption>
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Category</th>
              <th scope="col">Fee</th>
              <th scope="col">Decided</th>
              <th scope="col">Seats</th>
              <th scope="col">Status</th>
              {canManage && <th scope="col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {categories.map((c, i) => {
              const [label, cls] = PHASE[c.phase]
              return (
                <tr key={c.id}>
                  <td className={styles.nowrap}>
                    {canManage ? (
                      <span className={styles.rowBtns}>
                        <button type="button" disabled={pending || i === 0} aria-label={`Move ${c.values.name} up`} onClick={() => run(() => moveCategoryAction(eventSlug, c.id, 'up'), `Moved "${c.values.name}" up.`)}>Up</button>
                        <button type="button" disabled={pending || i === categories.length - 1} aria-label={`Move ${c.values.name} down`} onClick={() => run(() => moveCategoryAction(eventSlug, c.id, 'down'), `Moved "${c.values.name}" down.`)}>Down</button>
                      </span>
                    ) : (
                      i + 1
                    )}
                  </td>
                  <td>
                    {c.values.name}
                    <span className={styles.sub}>/{c.values.slug}{c.registrations ? ` · ${c.registrations} registered` : ''}</span>
                  </td>
                  <td className={styles.nowrap}>{Number(c.values.fee) === 0 ? 'Free' : `${c.values.currency} ${c.values.fee}`}</td>
                  <td>{c.values.approvalMode === 'MANUAL_REVIEW' ? 'Manual review' : 'Automatic'}</td>
                  <td>{c.values.seatLimit || 'Unlimited'}</td>
                  <td>
                    <span className={`${styles.badge} ${cls}`}>{label}</span>
                    {when(c.values) && <span className={styles.sub}>{when(c.values)}</span>}
                  </td>
                  {canManage && (
                    <td className={styles.nowrap}>
                      <span className={styles.rowBtns}>
                        <button type="button" disabled={pending} onClick={() => open(c)} aria-label={`Edit ${c.values.name}`}>Edit</button>
                        <button type="button" className={styles.dangerBtn} disabled={pending} onClick={() => remove(c)} aria-label={`Remove ${c.values.name}`}>Remove</button>
                      </span>
                    </td>
                  )}
                </tr>
              )
            })}
            {!categories.length && (
              <tr>
                <td colSpan={canManage ? 7 : 6} className={styles.empty}>This event has no registration categories yet.{canManage ? ' Use "Add a category".' : ''}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
