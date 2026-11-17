import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { cms } from '@/lib/cms'
import { getHome } from '@gyn/core/home-store'
import { getPublicEvent, listPublicEvents } from '@gyn/core/event-store'
import { money } from '@/components/event/money'
import type { NavItem } from '@/lib/cms/types'
import { FloatingPill } from '@/components/home/FloatingPill'

// The navbar (past/upcoming groups, the Book pill) is built here from the events, so every page, including the fully
// static ones, must refresh it: without this an event would only move to Past at the next deploy.
export const revalidate = 300

// The site's only two fonts (docs/frontend-design-plan.md): Plus Jakarta Sans for headings, Inter for text.
// latin-ext covers the accented letters in delegates' names.
const heading = Plus_Jakarta_Sans({ subsets: ['latin', 'latin-ext'], weight: ['600', '700', '800'], variable: '--font-heading', display: 'swap' })
const text = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-text', display: 'swap' })

export const metadata: Metadata = {
  // absolute URLs for OG/Twitter images
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://thegyn.org'),
  title: {
    template: '%s | Global Youth Network',
    default: 'Global Youth Network – GYN',
  },
  description:
    'GYN hosts international conferences, forums and summits to promote dialogue on the UN Sustainable Development Goals. Next: SDG Innovation Summit Malaysia 2026, 19–22 November, Kuala Lumpur.',
  // './' resolves against each page's own URL, so every page gets its own canonical
  alternates: { canonical: './' },
  openGraph: {
    siteName: 'Global Youth Network',
    locale: 'en_US',
  },
}

// The old sitemap links are absolute (https://thegyn.org/about-us/); the site links to itself, without the trailing slash.
const local = (href: string) => href.replace(/^https:\/\/thegyn\.org/, '').replace(/(.)\/$/, '$1') || '/'

/** The two event dropdowns come from the published events (so a new event appears by itself); an empty group is left out. */
function buildNav(nav: NavItem[], events: Awaited<ReturnType<typeof listPublicEvents>>): NavItem[] {
  // The last child of each group is the listing page; a group with no events still has no dropdown.
  const group = (timing: 'past' | 'upcoming') => {
    const items = events.filter((e) => e.timing === timing).map((e) => ({ label: e.navLabel || e.name, href: `/${e.slug}` }))
    return items.length ? [...items, { label: `All ${timing} events`, href: `/${timing === 'past' ? 'past' : 'upcoming'}-events` }] : items
  }
  return nav
    .map((item): NavItem => {
      const children = item.label === 'Past Events' ? group('past') : item.label === 'Upcoming Events' ? group('upcoming') : item.children?.map((c) => ({ ...c, href: local(c.href) }))
      return { ...item, href: local(item.href), ...(children && { children }) }
    })
    .filter((item) => !item.children || item.children.length > 0)
}

/** The navbar's Book pill: the next upcoming event's open forum-access category, or null (the pill is hidden). One extra read, for that event only. */
async function bookPill(events: Awaited<ReturnType<typeof listPublicEvents>>) {
  const next = events.find((e) => e.timing === 'upcoming')
  const ev = next && (await getPublicEvent(next.slug))
  const cat = ev?.categories.find((c) => c.slug === 'forum-access' && c.open)
  if (!ev || !cat) return null
  // shortcut: SISM 2026 has the only registration page; other events send people to their categories until phase 5 forms exist.
  return { fee: money(cat.feeCents, cat.currency), href: ev.slug === 'sism-2026' ? '/sism-forum-access' : `/${ev.slug}#categories` }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sitemap, home, events] = await Promise.all([cms.getSitemap(), getHome(), listPublicEvents()])
  const book = await bookPill(events)

  return (
    <html lang="en" className={`${heading.variable} ${text.variable}`} data-scroll-behavior="smooth">
      <head>
        {/* Prevent browser scroll restoration on reload — page always starts at the top.
            Must run synchronously before the browser attempts to restore position.
            Back/forward scroll is managed by Next.js App Router's own router state. */}
        <script dangerouslySetInnerHTML={{ __html: "history.scrollRestoration='manual'" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      {/* browser extensions (e.g. Grammarly) add attributes to <body> before React loads; ignore those attribute
          differences here only. Children are still checked. */}
      <body suppressHydrationWarning>
        <a href="#main" className="sr-only focus:not-sr-only">
          Skip to main content
        </a>
        <SiteHeader nav={buildNav(sitemap.nav, events)} book={book} />
        {children}
        <FloatingPill apply={home.hero.primaryCta} />
        <SiteFooter footer={sitemap.footer} socials={sitemap.socials} />
      </body>
    </html>
  )
}
