// Labels and date format shared by the inbox list and the message page (a page file cannot export them).
export const STATUS_LABEL = { NEW: 'New', READ: 'Read', ARCHIVED: 'Archived' } as const
export const TOPIC_LABEL: Record<string, string> = { general: 'General enquiry', partnership: 'Partnership', 'group-booking': 'Group booking', media: 'Media' }
export const stamp = (d: Date) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(d) + ' UTC'
