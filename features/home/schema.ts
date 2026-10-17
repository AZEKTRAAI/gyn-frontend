// Home page content contract (Direction J, "Echo stack"). One schema drives three things:
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

const optionalLink = linkSchema.meta({ title: 'Second button (leave text empty to hide)' })
const visible = z.boolean().meta({ title: 'Show this section' })
const kicker = str('Small label above the heading', 60)
const heading = str('Heading', 120, 'Wrap words in *stars* for the italic serif.')

export const SDG_GOALS = ['4', '5', '9', '13'] as const
const sdg = z.enum(SDG_GOALS).meta({ title: 'Colour (SDG goal)', description: '4 red, 5 orange-red, 9 orange, 13 green.' })
const lon = z.number().min(-180).max(180).meta({ title: 'Longitude' })
const lat = z.number().min(-90).max(90).meta({ title: 'Latitude' })

export const homeSchema = z
  .object({
    seo: z
      .object({ title: str('Browser tab title', 70), description: long('Search result description', 200) })
      .meta({ title: 'Search and sharing' }),

    hero: z
      .object({
        headline: long('Headline', 120, 'Wrap one word in *stars* for the italic serif, e.g. "global *stage*." Press Enter for a line break. Shown in capitals.'),
        lead: long('Lead paragraph', 400),
        facts: z
          .array(z.object({ label: str('Text', 40), hot: z.boolean().meta({ title: 'Yellow highlight' }) }).meta({ title: 'Fact chip' }))
          .max(6)
          .meta({ title: 'Fact chips' }),
        primaryCta: linkSchema.meta({ title: 'Main button' }),
        secondaryCta: optionalLink,
        film: z
          .array(z.object({ image: imageSchema, caption: str('Caption', 40) }).meta({ title: 'Photo' }))
          .max(12)
          .meta({ title: 'Film strip photos (scroll under the headline)' }),
      })
      .meta({ title: 'Top of the page' }),

    strip: z
      .object({
        label: str('Label', 40),
        eventName: str('Event name', 120),
        dateVenue: str('Dates and venue', 160),
        cohost: str('Extra line (co-host)', 120),
        link: linkSchema.meta({ title: 'Link on the right' }),
      })
      .meta({ title: 'Event strip under the top' }),

    benefits: z
      .object({
        visible,
        kicker,
        heading,
        intro: long('Intro', 400),
        photo: imageSchema.meta({ title: 'Big photo tile' }),
        photoBig: str('Big number on the photo', 20),
        photoText: str('Text on the photo', 160),
        tiles: z
          .array(
            z
              .object({
                big: str('Big text or number', 20, 'Numbers count up when the section appears.'),
                text: str('Text', 140),
                sdg,
                render: z
                  .union([z.literal(''), imageSrc])
                  .meta({ title: '3D object (optional)', description: 'A render whose background matches the colour, e.g. /renders/r3/sdg9-gears-poster.webp', widget: 'image' }),
              })
              .meta({ title: 'Tile' }),
          )
          .max(4)
          .meta({ title: 'Colour tiles (four)' }),
      })
      .meta({ title: 'What you leave with' }),

    network: z
      .object({
        visible,
        kicker,
        heading,
        intro: long('Intro', 400),
        hub: z.object({ label: str('Destination city', 60), lon, lat }).meta({ title: 'Where the routes go' }),
        people: z
          .array(
            z.object({ name: str('Name', 80), country: str('Country', 60), photo: imageSchema, lon, lat }).meta({ title: 'Ambassador' }),
          )
          .max(40)
          .meta({ title: 'Ambassadors (one pin each)' }),
        primaryCta: linkSchema.meta({ title: 'Main button' }),
        secondaryCta: optionalLink,
      })
      .meta({ title: 'Ambassadors map' }),

    past: z
      .object({
        visible,
        kicker,
        heading,
        editions: z
          .array(
            z
              .object({
                name: str('Summit name', 80),
                edition: str('Edition label', 40),
                stamp: str('Stamp text', 20),
                dates: str('Dates', 80),
                text: long('Text', 400),
                facts: z.array(z.object({ n: str('Number', 10), label: str('Label', 40) }).meta({ title: 'Fact' })).max(4).meta({ title: 'Facts on the ticket' }),
                videoUrl: href.meta({ title: 'Video link (YouTube)' }),
                videoPoster: imageSchema.meta({ title: 'Video poster' }),
              })
              .meta({ title: 'Edition' }),
          )
          .max(6)
          .meta({ title: 'Past summits (newest first)' }),
        note: str('Line under the ticket', 120),
      })
      .meta({ title: 'Previous summit' }),

    event: z
      .object({
        visible,
        kicker,
        heading,
        text: long('Text', 400),
        countdownTo: z
          .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)])
          .meta({ title: 'Countdown to (event local time)', description: 'Leave empty to hide the countdown. It also hides itself once the time has passed.', widget: 'datetime' }),
        utcOffset: z.string().regex(/^[+-]\d{2}:\d{2}$/, 'Use +08:00 style').meta({ title: 'Event time zone (UTC offset)' }),
        primaryCta: linkSchema.meta({ title: 'Main button' }),
        secondaryCta: optionalLink,
        note: long('Small print', 300),
        seats: z
          .object({
            total: z.number().int().min(1).max(400).meta({ title: 'Total seats' }),
            full: z.number().int().min(0).max(400).meta({ title: 'Fully funded' }),
            partial: z.number().int().min(0).max(400).meta({ title: 'Partially funded' }),
            fullLabel: str('Label, fully funded', 60),
            partialLabel: str('Label, partially funded', 60),
            restLabel: str('Label, the rest', 80),
          })
          .meta({ title: 'Seat grid' }),
      })
      .meta({ title: 'Next summit' }),

    speakers: z
      .object({
        visible,
        kicker,
        heading,
        intro: long('Intro', 400),
        people: z
          .array(
            z.object({ name: str('Name', 80), org: str('Organisation', 120), role: str('Role or place', 120), photo: imageSchema, sdg }).meta({ title: 'Speaker' }),
          )
          .max(24)
          .meta({ title: 'Speakers' }),
      })
      .meta({ title: 'Speakers' }),

    programme: z
      .object({
        visible,
        kicker,
        heading,
        days: z
          .array(
            z
              .object({
                date: str('Date line', 60),
                title: str('Title', 80),
                items: z.array(str('Item', 120)).max(10).meta({ title: 'Items' }),
                sdg,
                render: z.union([z.literal(''), imageSrc]).meta({ title: '3D object (optional)', widget: 'image' }),
              })
              .meta({ title: 'Day' }),
          )
          .max(7)
          .meta({ title: 'Days' }),
        note: str('Line under the days', 120),
      })
      .meta({ title: 'Programme' }),

    advisors: z
      .object({
        visible,
        kicker,
        heading,
        intro: long('Intro', 400),
        cta: optionalLink,
        people: z
          .array(z.object({ name: str('Name', 80), where: str('Country or role tag', 40), bio: long('Bio', 400), photo: imageSchema }).meta({ title: 'Advisor' }))
          .max(24)
          .meta({ title: 'Advisors' }),
      })
      .meta({ title: 'Advisory board' }),

    gallery: z
      .object({
        visible,
        kicker,
        heading,
        intro: str('Intro', 160),
        items: z
          .array(
            z
              .object({
                image: imageSchema,
                title: str('Title', 60),
                caption: str('Caption', 80),
                videoUrl: z.union([z.literal(''), href]).meta({ title: 'Video link (optional)' }),
              })
              .meta({ title: 'Photo or video' }),
          )
          .max(12)
          .meta({ title: 'Wall' }),
      })
      .meta({ title: 'The wall' }),

    stories: z
      .object({
        visible,
        kicker,
        heading,
        intro: long('Intro', 300),
        quotes: z
          .array(
            z
              .object({
                name: str('Name', 80),
                status: str('Edition and funding status', 80),
                country: str('Country', 60),
                quote: long('Quote', 600),
                photo: imageSchema,
                link: z.union([z.literal(''), href]).meta({ title: 'Link to the post (optional)' }),
              })
              .meta({ title: 'Quote' }),
          )
          .max(12)
          .meta({ title: 'Quotes' }),
        videos: z
          .array(z.object({ url: href.meta({ title: 'Video link' }), poster: imageSchema }).meta({ title: 'Video' }))
          .max(6)
          .meta({ title: 'Short videos' }),
      })
      .meta({ title: 'Stories' }),

    partners: z
      .object({
        visible,
        cohost: z.object({ name: str('Name', 120), logo: imageSchema, text: long('Text', 300), note: str('Second line', 200) }).meta({ title: 'Co-host' }),
        heading: str('Partners heading', 60),
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
      .meta({ title: 'Co-host and partners' }),

    closing: z
      .object({
        visible,
        headline: long('Headline', 80, 'Wrap words in *stars* for the italic serif. Press Enter for a line break.'),
        text: long('Text', 300, 'Wrap words in *stars* to highlight them in yellow.'),
        primaryCta: linkSchema.meta({ title: 'Main button' }),
        secondaryCta: optionalLink,
      })
      .meta({ title: 'Closing banner' }),
  })
  .meta({ title: 'Home page' })

export type HomeContent = z.infer<typeof homeSchema>
export type HomeSectionKey = keyof HomeContent
export const HOME_SECTIONS = Object.keys(homeSchema.shape) as HomeSectionKey[]

/** Splits "global *stage*." into plain and italic runs for rendering. */
export function accentRuns(text: string): { text: string; italic: boolean }[] {
  return text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((part) => (part.startsWith('*') && part.endsWith('*') ? { text: part.slice(1, -1), italic: true } : { text: part, italic: false }))
}

/** Countdown target as epoch ms, or null when empty or malformed. */
export function countdownTarget(ev: { countdownTo: string; utcOffset: string }): number | null {
  if (!ev.countdownTo) return null
  const t = Date.parse(`${ev.countdownTo}:00${ev.utcOffset}`)
  return Number.isNaN(t) ? null : t
}

export const SDG_COLOURS: Record<(typeof SDG_GOALS)[number], { bg: string; fg: string }> = {
  '4': { bg: '#C5192D', fg: '#FFFFFF' },
  '5': { bg: '#FF3A21', fg: '#0E1530' },
  '9': { bg: '#FD6925', fg: '#0E1530' },
  '13': { bg: '#3F7E44', fg: '#FFFFFF' },
}
