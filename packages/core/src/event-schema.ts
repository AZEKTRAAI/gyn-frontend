// Event page content contract. One schema drives the public event page, server-side validation on save,
// and the admin editor (z.toJSONSchema), the same way home-schema.ts does for the home page.
// Every event (past or upcoming) uses this one schema; each section has `visible`, so a past event simply hides
// the sections it does not need (categories, faq) and an upcoming one hides the recap ones (gallery, stories).
import { z } from 'zod'
import { homeSchema, imageSchema, linkSchema } from './home-schema.ts'

const str = (title: string, max = 200, description?: string) => z.string().trim().max(max).meta({ title, description })
const long = (title: string, max = 1200, description?: string) =>
  z.string().trim().max(max).meta({ title, description, widget: 'textarea' })
const href = z
  .string()
  .trim()
  .max(500)
  .regex(/^(https?:\/\/|mailto:|tel:|\/(?![\/\\])|#)/, 'Links must start with https://, /, #, mailto: or tel:')

const visible = z.boolean().meta({ title: 'Show this section' })
const kicker = str('Small label above the heading', 60)
const heading = str('Heading', 120, 'Wrap words in *stars* to highlight them.')
const optionalLink = linkSchema.meta({ title: 'Second button (leave text empty to hide)' })

export const eventPageSchema = z
  .object({
    seo: z
      .object({ title: str('Browser tab title', 70), description: long('Search result description', 200) })
      .meta({ title: 'Search and sharing' }),

    hero: z
      .object({
        kicker,
        headline: long('Headline', 120, 'Wrap one word in *stars* to highlight it. Press Enter for a line break.'),
        lead: long('Lead paragraph', 400),
        chips: z.array(z.object({ label: str('Text', 50) }).meta({ title: 'Chip' })).max(5).meta({ title: 'Fact chips', description: 'e.g. dates, city, "70+ delegates".' }),
        photos: z.array(imageSchema).min(1).max(6).meta({ title: 'Photos', description: 'Real photos from this event. They are scattered around the headline with torn edges. The first one loads first.' }),
        primaryCta: linkSchema.meta({ title: 'Main button' }),
        secondaryCta: optionalLink,
      })
      .meta({ title: 'Top of the page' }),

    highlights: z
      .object({
        visible,
        items: z.array(z.object({ n: str('Number', 12), label: str('Label', 60) }).meta({ title: 'Number' })).max(4).meta({ title: 'Numbers (up to four)' }),
      })
      .meta({ title: 'Numbers' }),

    overview: z
      .object({ visible, kicker, heading, text: long('Text', 1500), image: imageSchema.meta({ title: 'Photo next to the text' }) })
      .meta({ title: 'About this event' }),

    categories: z
      .object({
        visible,
        kicker,
        heading,
        intro: long('Intro', 400),
        note: long('Small print under the cards', 300),
      })
      .meta({ title: 'Registration categories', description: 'The cards themselves (names, fees, open or closed) come from the event\'s registration categories.' }),

    steps: z
      .object({
        visible,
        kicker,
        heading,
        items: z.array(z.object({ title: str('Step', 80), text: long('What happens', 300) }).meta({ title: 'Step' })).max(8).meta({ title: 'Steps' }),
      })
      .meta({ title: 'How to apply' }),

    lists: z
      .object({
        visible,
        kicker,
        heading,
        intro: long('Intro', 400),
        groups: z
          .array(
            z
              .object({ title: str('Column title', 60), items: z.array(str('Point', 300)).max(10).meta({ title: 'Points' }) })
              .meta({ title: 'Column' }),
          )
          .max(4)
          .meta({ title: 'Columns (up to four)', description: 'Side by side, e.g. who can apply and the scholarship criteria.' }),
      })
      .meta({ title: 'Lists' }),

    ambassadors: homeSchema.shape.network.meta({ title: 'Ambassadors map' }),

    chapters: z
      .object({
        visible,
        kicker,
        heading,
        items: z
          .array(
            z
              .object({
                label: str('Label', 40),
                title: str('Title', 120),
                text: long('Text', 600),
                sessions: z.array(z.object({ type: str('Type', 30), title: str('Title', 160) }).meta({ title: 'Session' })).max(12).meta({ title: 'Sessions' }),
              })
              .meta({ title: 'Chapter' }),
          )
          .max(8)
          .meta({ title: 'Chapters' }),
      })
      .meta({ title: 'Programme chapters' }),

    schedule: z
      .object({
        visible,
        kicker,
        heading,
        days: z
          .array(
            z
              .object({
                label: str('Day', 40),
                date: str('Date', 40),
                items: z.array(z.object({ title: str('Title', 120), text: str('Text', 300) }).meta({ title: 'Item' })).max(12).meta({ title: 'Items' }),
              })
              .meta({ title: 'Day' }),
          )
          .max(7)
          .meta({ title: 'Days' }),
      })
      .meta({ title: 'Schedule' }),

    speakers: z
      .object({
        visible,
        kicker,
        heading,
        people: z.array(z.object({ name: str('Name', 80), role: str('Role and organisation', 160), photo: imageSchema }).meta({ title: 'Speaker' })).max(40).meta({ title: 'Speakers' }),
      })
      .meta({ title: 'Speakers' }),

    partners: z
      .object({
        visible,
        kicker,
        heading,
        items: z
          .array(
            z
              .object({
                name: str('Name', 120),
                role: str('Role', 60, 'e.g. Co-host, Institutional visit, Venue partner.'),
                text: long('About them', 600),
                logo: z.array(imageSchema).max(1).meta({ title: 'Logo (optional)', description: 'Add one image, or leave empty.' }),
                link: linkSchema.meta({ title: 'Link (leave text empty to hide)' }),
              })
              .meta({ title: 'Partner' }),
          )
          .max(8)
          .meta({ title: 'Partners' }),
      })
      .meta({ title: 'Partners and hosts' }),

    gallery: z
      .object({
        visible,
        kicker,
        heading,
        photos: z.array(z.object({ image: imageSchema, caption: str('Caption', 100) }).meta({ title: 'Photo' })).max(40).meta({ title: 'Photos' }),
      })
      .meta({ title: 'Gallery' }),

    videos: z
      .object({
        visible,
        kicker,
        heading,
        items: z.array(z.object({ url: href.meta({ title: 'YouTube link' }), title: str('Title', 120), poster: imageSchema }).meta({ title: 'Video' })).max(12).meta({ title: 'Videos' }),
      })
      .meta({ title: 'Videos' }),

    stories: z
      .object({
        visible,
        kicker,
        heading,
        quotes: z
          .array(z.object({ name: str('Name', 80), country: str('Country', 60), quote: long('Quote', 600), photo: imageSchema }).meta({ title: 'Quote' }))
          .max(12)
          .meta({ title: 'Quotes' }),
      })
      .meta({ title: 'Delegate stories' }),

    faq: z
      .object({
        visible,
        kicker,
        heading,
        items: z.array(z.object({ q: str('Question', 200), a: long('Answer', 1500) }).meta({ title: 'Question' })).max(30).meta({ title: 'Questions' }),
      })
      .meta({ title: 'Questions and answers' }),

    cta: z
      .object({
        visible,
        heading: long('Headline', 100, 'Wrap words in *stars* to highlight them.'),
        text: long('Text', 300),
        primaryCta: linkSchema.meta({ title: 'Main button' }),
        secondaryCta: optionalLink,
      })
      .meta({ title: 'Closing banner' }),
  })
  .meta({ title: 'Event page' })

export type EventPageContent = z.infer<typeof eventPageSchema>
export type EventSectionKey = keyof EventPageContent
export const EVENT_SECTIONS = Object.keys(eventPageSchema.shape) as EventSectionKey[]

export type EventTiming = 'upcoming' | 'past'

/** Upcoming until the end date passes; the admin can override for edge cases. */
export function eventTiming(e: { endsAt: Date; timingOverride?: 'UPCOMING' | 'PAST' | null }, now = new Date()): EventTiming {
  if (e.timingOverride === 'UPCOMING') return 'upcoming'
  if (e.timingOverride === 'PAST') return 'past'
  return e.endsAt.getTime() < now.getTime() ? 'past' : 'upcoming'
}

// Event pages live at the site root (/fms-thailand, /sism-2026), so a slug must not take a fixed page's address.
export const RESERVED_SLUGS = new Set([
  'about-us', 'contact-us', 'privacy-policy', 'refund-policy', 'terms-conditions', 'videos', 'pitch', 'api', 'media',
  'admin', 'sism-forum-access', 'sism-invitation-letter', 'sism-self-funded',
  // old WordPress addresses that redirect (OLD_URL_REDIRECTS in next.config.ts)
  'home', 'fmst-2026', 'thank-you-page', 'sism-2026-application-form', 'sism-fully-funded-scholarship',
])
export const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lower-case letters, numbers and single dashes, e.g. sis-dubai-2027')
  .refine((s) => !RESERVED_SLUGS.has(s), 'That address is used by another page')

/** Event details the admin edits (the Event row), apart from the page content. */
export const eventDetailsSchema = z.object({
  name: z.string().trim().min(3).max(120),
  shortName: z.string().trim().max(30),
  theme: z.string().trim().max(160),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  timezone: z.string().trim().min(1).max(60),
  venue: z.string().trim().max(160),
  city: z.string().trim().max(80),
  country: z.string().trim().max(80),
  navLabel: z.string().trim().max(40),
  timingOverride: z.enum(['', 'UPCOMING', 'PAST']),
}).refine((d) => d.endsAt >= d.startsAt, { message: 'The end date is before the start date', path: ['endsAt'] })
export type EventDetails = z.infer<typeof eventDetailsSchema>
