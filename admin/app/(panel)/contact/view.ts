import { CONTACT_TOPICS } from '@gyn/core/contact-topics'

// Labels and date format shared by the inbox list and the message page (a page file cannot export them).
export const STATUS_LABEL = { NEW: 'New', READ: 'Read', ARCHIVED: 'Archived' } as const
export const TOPIC_LABEL: Record<string, string> = Object.fromEntries(CONTACT_TOPICS.map((t) => [t.value, t.label]))
export const stamp = (d: Date) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(d) + ' UTC'
