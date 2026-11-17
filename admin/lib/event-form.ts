// Shared by the events screens (client forms and server actions): the field list of the details form, friendly validation
// messages, slug suggestion and time zone check. The page content form is generated from eventPageSchema instead.
import { eventDetailsSchema, slugSchema, type EventDetails } from '@gyn/core/event-schema'
import type { JsonNode } from '@/components/SchemaForm'

export type FieldIssues = Record<string, string>

interface IssueLike {
  code: string
  message: string
  path: PropertyKey[]
  origin?: string
  minimum?: unknown
  maximum?: unknown
}

/** zod's default texts read like code ("Too small: expected string to have >=3 characters"); the team sees these. */
function friendly(i: IssueLike): string {
  const noun = i.origin === 'array' ? 'items' : 'characters'
  if (i.code === 'too_small') {
    if (i.origin === 'array') return `Add at least ${i.minimum} ${i.minimum === 1 ? 'item' : 'items'}.`
    return Number(i.minimum) <= 1 ? 'This is required.' : `Use at least ${i.minimum} ${noun}.`
  }
  if (i.code === 'too_big') return `Use at most ${i.maximum} ${noun}.`
  if (i.code === 'invalid_type') return 'This is required.'
  return i.message
}

export function issuesToErrors(issues: IssueLike[]): FieldIssues {
  const out: FieldIssues = {}
  for (const i of issues) out[i.path.join('.')] ??= friendly(i)
  return out
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Errors by field name; empty when the details are fine. */
export function validateDetails(details: unknown): FieldIssues {
  const parsed = eventDetailsSchema.safeParse(details)
  const errors = parsed.success ? {} : issuesToErrors(parsed.error.issues)
  for (const k of ['startsAt', 'endsAt'] as const) {
    if (errors[k] && !(details as Record<string, unknown>)?.[k]) errors[k] = 'Pick a date.'
    else if (errors[k] === 'Use YYYY-MM-DD') errors[k] = 'Enter a real date like 2027-03-14.'
  }
  const tz = (details as { timezone?: unknown })?.timezone
  if (!errors.timezone && typeof tz === 'string' && !isValidTimeZone(tz.trim())) {
    errors.timezone = 'Unknown time zone. Use a name like Asia/Kuala_Lumpur or Asia/Bangkok.'
  }
  return errors
}

export function validateSlug(slug: unknown): string | null {
  const r = slugSchema.safeParse(slug)
  if (r.success) return null
  return friendly(r.error.issues[0])
}

export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
}

const text = (title: string, extra: Partial<JsonNode> = {}): JsonNode => ({ type: 'string', title, ...extra })

const DETAIL_FIELDS: Record<keyof EventDetails, JsonNode> = {
  name: text('Event name', { maxLength: 120, description: 'The full name shown as the page title, e.g. "Future Makers Summit Thailand 2026".' }),
  shortName: text('Short name', { maxLength: 30, description: 'Optional. A short label such as "FMS Thailand".' }),
  theme: text('Theme', { maxLength: 160, description: 'Optional. One line about the event, used as a starting text and for search results.' }),
  startsAt: text('First day', { widget: 'date' }),
  endsAt: text('Last day', { widget: 'date' }),
  timezone: text('Time zone', { maxLength: 60, description: 'Where the event happens, e.g. Asia/Kuala_Lumpur. The two days above are in this time zone.' }),
  venue: text('Venue', { maxLength: 160 }),
  city: text('City', { maxLength: 80 }),
  country: text('Country', { maxLength: 80 }),
  navLabel: text('Menu label', { maxLength: 40, description: 'Optional. The short name in the site menu. Empty uses the event name.' }),
  timingOverride: text('Upcoming or past', {
    enum: ['', 'UPCOMING', 'PAST'],
    enumLabels: { '': 'Automatic: past once the last day has gone by', UPCOMING: 'Always show as upcoming', PAST: 'Always show as past' },
    description: 'Leave on automatic unless the dates are not what decides it (for example an event that was postponed).',
  }),
}
export const detailsNode: JsonNode = { type: 'object', title: 'Event details', properties: DETAIL_FIELDS }

/** The "New event" form: the same fields minus the optional ones, plus the address and past/upcoming. */
export const newEventNode: JsonNode = {
  type: 'object',
  title: 'New event',
  properties: {
    name: DETAIL_FIELDS.name,
    slug: text('Page address', {
      maxLength: 60,
      description: 'The page will live at /this-address. It cannot be changed later. Lower-case letters, numbers and dashes, e.g. sis-dubai-2027.',
    }),
    kind: text('Kind', {
      enum: ['upcoming', 'past'],
      enumLabels: { upcoming: 'Upcoming: registration, schedule, speakers, questions', past: 'Past: highlights, gallery, ambassadors, stories' },
      description: 'Decides which sections start switched on. You can change every section afterwards.',
    }),
    startsAt: DETAIL_FIELDS.startsAt,
    endsAt: DETAIL_FIELDS.endsAt,
    timezone: DETAIL_FIELDS.timezone,
    venue: DETAIL_FIELDS.venue,
    city: DETAIL_FIELDS.city,
    country: DETAIL_FIELDS.country,
  },
}
