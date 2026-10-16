// Home page content contract. One schema drives three things:
// the public page's types, server-side validation on save, and the admin form (via z.toJSONSchema).
// Field metadata: title/description label the form; widget picks the input ('textarea' | 'image' | 'datetime').
import { z } from 'zod'

const str = (title: string, max = 200, description?: string) =>
  z.string().trim().max(max).meta({ title, description })
const long = (title: string, max = 1200, description?: string) =>
  z.string().trim().max(max).meta({ title, description, widget: 'textarea' })

// Local files ("/media/...") or uploads on Cloudinary; next/image only knows these origins.
const imageSrc = z
  .string()
  .trim()
  .max(500)
  .regex(/^(\/(?!\/)[^\s]*|https:\/\/res\.cloudinary\.com\/[^\s]+)$/, 'Use an uploaded image or a /media/... path')

export const imageSchema = z
  .object({
    src: imageSrc.meta({ title: 'Image', widget: 'image' }),
    alt: str('Alt text', 200, 'Describe the image for people who cannot see it. Leave empty only for decoration.'),
  })
  .meta({ title: 'Image' })

// Blocks javascript: and data: links.
const href = z
  .string()
  .trim()
  .max(500)
  .regex(/^(https?:\/\/|mailto:|tel:|\/|#)/, 'Links must start with https://, /, #, mailto: or tel:')

export const linkSchema = z
  .object({ label: str('Button text', 60), href: href.meta({ title: 'Link' }) })
  .meta({ title: 'Button' })

const visible = z.boolean().meta({ title: 'Show this section' })

export const SDG_GOALS = ['4', '5', '9', '13'] as const

export const homeSchema = z
  .object({
    seo: z
      .object({
        title: str('Browser tab title', 70),
        description: long('Search result description', 200),
      })
      .meta({ title: 'Search and sharing' }),

    hero: z
      .object({
        headline: long('Headline', 120, 'Wrap one word in *stars* to set it in the italic serif, e.g. "*Four* in our hands." Press Enter for a line break.'),
        eventName: str('Event name', 120),
        dateVenue: str('Dates and venue', 160),
        note: str('Extra line (optional)', 160),
        primaryCta: linkSchema.meta({ title: 'Main button' }),
        secondaryCta: linkSchema.meta({ title: 'Second button (leave text empty to hide)' }),
        countdownTo: z
          .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)])
          .meta({ title: 'Countdown to (event local time)', description: 'Leave empty to hide the countdown. It also hides itself once the time has passed.', widget: 'datetime' }),
        utcOffset: z
          .string()
          .regex(/^[+-]\d{2}:\d{2}$/, 'Use +08:00 style')
          .meta({ title: 'Event time zone (UTC offset)', description: 'Kuala Lumpur is +08:00, Bangkok +07:00.' }),
      })
      .meta({ title: 'Top of the page (current event)' }),

    about: z
      .object({
        visible,
        heading: str('Heading', 120),
        body: long('Text'),
        services: z
          .array(z.object({ name: str('Name', 60), description: long('Description', 400) }).meta({ title: 'Service' }))
          .max(12)
          .meta({ title: 'What we do' }),
      })
      .meta({ title: 'Who we are and what we do' }),

    focus: z
      .object({
        visible,
        heading: str('Heading', 120),
        quote: long('Intro quote', 600),
        goals: z
          .array(
            z
              .object({
                sdg: z.enum(SDG_GOALS).meta({ title: 'SDG number', description: 'Sets the colour and the 3D object.' }),
                label: str('Label', 80),
                claim: str('Big line', 80),
                text: str('Supporting line', 160),
              })
              .meta({ title: 'Goal' }),
          )
          .max(4)
          .meta({ title: 'Goals (one full-colour screen each)' }),
      })
      .meta({ title: 'Our focus areas' }),

    objectives: z
      .object({
        visible,
        heading: str('Heading', 120),
        items: z
          .array(z.object({ title: str('Title', 60), text: long('Text', 400) }).meta({ title: 'Objective' }))
          .max(12)
          .meta({ title: 'Objectives' }),
      })
      .meta({ title: 'Objectives' }),

    advisors: z
      .object({
        visible,
        heading: str('Heading', 120),
        people: z
          .array(
            z
              .object({ name: str('Name', 80), role: str('Role and country', 160), bio: long('Bio', 600), photo: imageSchema })
              .meta({ title: 'Advisor' }),
          )
          .max(24)
          .meta({ title: 'Advisors' }),
      })
      .meta({ title: 'Global advisory board' }),

    ambassadors: z
      .object({
        visible,
        heading: str('Heading', 120),
        intro: long('Intro (optional)', 400),
        people: z
          .array(z.object({ name: str('Name', 80), country: str('Country', 60), photo: imageSchema }).meta({ title: 'Ambassador' }))
          .max(40)
          .meta({ title: 'Ambassadors' }),
      })
      .meta({ title: 'Global ambassadors' }),

    events: z
      .object({
        visible,
        heading: str('Heading', 120),
        items: z
          .array(
            z
              .object({
                kicker: str('Small line above the title', 80),
                title: str('Event title', 120),
                dates: str('Dates', 80),
                venue: str('Venue', 120),
                description: long('Description', 800),
                image: imageSchema,
                cta: linkSchema,
              })
              .meta({ title: 'Event' }),
          )
          .max(6)
          .meta({ title: 'Events (the first one is shown largest)' }),
      })
      .meta({ title: 'Upcoming events' }),

    partners: z
      .object({
        visible,
        heading: str('Heading', 120),
        logos: z
          .array(
            z
              .object({
                name: str('Partner name', 80, 'Read out by screen readers. Leave empty if unknown.'),
                logo: imageSrc.meta({ title: 'Logo (white on transparent)', widget: 'image' }),
                href: z.union([z.literal(''), href]).meta({ title: 'Website (optional)' }),
              })
              .meta({ title: 'Partner' }),
          )
          .max(30)
          .meta({ title: 'Logos' }),
      })
      .meta({ title: 'Our partners' }),

    closing: z
      .object({
        visible,
        headline: long('Headline', 80, 'Wrap words in *stars* for the italic serif. Press Enter for a line break.'),
        cta: linkSchema,
      })
      .meta({ title: 'Closing banner' }),
  })
  .meta({ title: 'Home page' })

export type HomeContent = z.infer<typeof homeSchema>
export type HomeSectionKey = keyof HomeContent
export const HOME_SECTIONS = Object.keys(homeSchema.shape) as HomeSectionKey[]

/** Splits "*Four* in our hands." into plain and italic runs for rendering. */
export function accentRuns(text: string): { text: string; italic: boolean }[] {
  return text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((part) => (part.startsWith('*') && part.endsWith('*') ? { text: part.slice(1, -1), italic: true } : { text: part, italic: false }))
}

/** Countdown target as epoch ms, or null when empty or malformed. */
export function countdownTarget(hero: Pick<HomeContent['hero'], 'countdownTo' | 'utcOffset'>): number | null {
  if (!hero.countdownTo) return null
  const t = Date.parse(`${hero.countdownTo}:00${hero.utcOffset}`)
  return Number.isNaN(t) ? null : t
}
