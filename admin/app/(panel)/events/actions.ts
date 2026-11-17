'use server'

import { headers } from 'next/headers'
import { categoryFormSchema } from '@gyn/core/category-schema'
import { createCategory, moveCategory, removeCategory, updateCategory } from '@gyn/core/category-store'
import { eventDetailsSchema, eventPageSchema, type EventDetails } from '@gyn/core/event-schema'
import { createEvent, EventStoreError, getEventForEdit, EventStoreUnavailable, saveEvent, setEventStatus, type EventStatus } from '@gyn/core/event-store'
import { PermissionError, requirePermission } from '@/lib/auth'
import { issuesToErrors, validateDetails, validateSlug } from '@/lib/event-form'
import { getClientIp } from '@/lib/ip'
import { revalidateWeb } from '@/lib/web'

export type Issue = { area: 'details' | 'page' | 'form'; path: string; message: string }
export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string; issues?: Issue[] }

const issuesOf = (area: Issue['area'], errors: Record<string, string>): Issue[] =>
  Object.entries(errors).map(([path, message]) => ({ area, path, message }))

async function actor() {
  const session = await requirePermission('events.manage')
  return { actor: session.user.email, userId: session.user.id, ip: getClientIp({ headers: await headers() }) }
}

const STALE_MESSAGE = 'Someone else saved this event after you opened it. Reload to see their changes; your edits are still on screen.'

/** Turns anything the store or the permission check throws into a message a person can act on. */
function failure(e: unknown, what: string): { ok: false; error: string; issues?: Issue[] } {
  if (e instanceof PermissionError || e instanceof EventStoreUnavailable) return { ok: false, error: e.message }
  if (e instanceof EventStoreError) {
    if (e.code === 'SLUG_TAKEN') return { ok: false, error: e.message, issues: [{ area: 'form', path: 'slug', message: e.message }] }
    if (e.code === 'STALE') return { ok: false, error: STALE_MESSAGE }
    if (e.code === 'NOT_FOUND') return { ok: false, error: 'This event no longer exists. It may have been removed. Go back to the list.' }
    return { ok: false, error: e.message }
  }
  console.error(`[admin] ${what} failed`, e)
  return { ok: false, error: `${what[0].toUpperCase()}${what.slice(1)} failed. Nothing was changed. Try again in a minute.` }
}

// A refresh that fails never loses the edit: it is saved, and the website refreshes by itself within 5 minutes.
const refreshWeb = (slug: string) => revalidateWeb([`/${slug}`, '/', '__layout'])

export async function createEventAction(input: { slug: string; kind: string; details: EventDetails }): Promise<ActionResult<{ slug: string }>> {
  try {
    const meta = await actor()
    const slugError = validateSlug(input?.slug)
    const errors = validateDetails(input?.details)
    if (input?.kind !== 'past' && input?.kind !== 'upcoming') return { ok: false, error: 'Choose whether the event is past or upcoming.', issues: [{ area: 'form', path: 'kind', message: 'Choose one.' }] }
    if (slugError || Object.keys(errors).length) {
      return { ok: false, error: 'Some fields need fixing.', issues: [...(slugError ? [{ area: 'form' as const, path: 'slug', message: slugError }] : []), ...issuesOf('details', errors)] }
    }
    const details = eventDetailsSchema.parse(input.details)
    const slug = input.slug.trim()
    await createEvent({ slug, kind: input.kind, details }, meta)
    // A new event is a draft, so the public site has nothing to refresh yet.
    return { ok: true, slug }
  } catch (e) {
    return failure(e, 'creating the event')
  }
}

export async function saveEventAction(slug: string, input: { details: unknown; content: unknown; expectedUpdatedAt: unknown }): Promise<ActionResult<{ savedAt: string; updatedAt: string }>> {
  try {
    const meta = await actor()
    const errors = validateDetails(input?.details)
    const page = eventPageSchema.safeParse(input?.content)
    if (Object.keys(errors).length || !page.success) {
      const pageIssues = page.success ? [] : issuesOf('page', issuesToErrors(page.error.issues.slice(0, 50)))
      return { ok: false, error: 'Some fields need fixing before this can be saved.', issues: [...issuesOf('details', errors), ...pageIssues] }
    }
    const updatedAt = await saveEvent(slug, { details: eventDetailsSchema.parse(input.details), content: page.data, expectedUpdatedAt: String(input?.expectedUpdatedAt ?? '') }, meta)
    await refreshWeb(slug)
    return { ok: true, savedAt: new Date().toISOString(), updatedAt }
  } catch (e) {
    return failure(e, 'saving the event')
  }
}

// Registration categories. Each change is saved at once (not with the page's Save button) and refreshes the event's public page.
const categoryFailure = (e: unknown, what: string) =>
  e instanceof EventStoreError && e.code === 'NOT_FOUND' ? { ok: false as const, error: e.message } : failure(e, what)

export async function saveCategoryAction(slug: string, id: string | null, values: unknown): Promise<ActionResult> {
  try {
    const meta = await actor()
    const parsed = categoryFormSchema.safeParse(values)
    if (!parsed.success) return { ok: false, error: 'Some fields need fixing.', issues: issuesOf('form', issuesToErrors(parsed.error.issues)) }
    await (id ? updateCategory(slug, id, values, meta) : createCategory(slug, values, meta))
    await revalidateWeb([`/${slug}`])
    return { ok: true }
  } catch (e) {
    const r = categoryFailure(e, 'saving the category')
    // The address is the only field whose errors come from the store (taken, or locked by registrations).
    return e instanceof EventStoreError && (e.code === 'SLUG_TAKEN' || /address/.test(e.message)) ? { ...r, issues: [{ area: 'form', path: 'slug', message: e.message }] } : r
  }
}

export async function moveCategoryAction(slug: string, id: string, direction: string): Promise<ActionResult> {
  try {
    const meta = await actor()
    if (direction !== 'up' && direction !== 'down') return { ok: false, error: 'Unknown direction.' }
    await moveCategory(slug, id, direction, meta)
    await revalidateWeb([`/${slug}`])
    return { ok: true }
  } catch (e) {
    return categoryFailure(e, 'moving the category')
  }
}

export async function removeCategoryAction(slug: string, id: string): Promise<ActionResult> {
  try {
    const meta = await actor()
    await removeCategory(slug, id, meta)
    await revalidateWeb([`/${slug}`])
    return { ok: true }
  } catch (e) {
    return categoryFailure(e, 'removing the category')
  }
}

export async function setEventStatusAction(slug: string, status: string): Promise<ActionResult<{ status: EventStatus; updatedAt: string }>> {
  try {
    const meta = await actor()
    if (status !== 'DRAFT' && status !== 'PUBLISHED' && status !== 'ARCHIVED') return { ok: false, error: 'Unknown status.' }
    await setEventStatus(slug, status, meta)
    await refreshWeb(slug)
    // A status change also moves the event's updatedAt, and the store does not return it. Without the new value the next save would be refused as stale.
    const updatedAt = (await getEventForEdit(slug))?.updatedAt.toISOString() ?? ''
    return { ok: true, status, updatedAt }
  } catch (e) {
    return failure(e, 'changing the status')
  }
}
