import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { cms } from '@/lib/cms'
import { getHome } from '@gyn/core/home-store'
import { FloatingPill } from '@/components/home/FloatingPill'

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
  openGraph: {
    siteName: 'Global Youth Network',
    locale: 'en_US',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sitemap, home] = await Promise.all([cms.getSitemap(), getHome()])

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
        <SiteHeader nav={sitemap.nav} />
        {children}
        <FloatingPill apply={home.hero.primaryCta} />
        <SiteFooter footer={sitemap.footer} socials={sitemap.socials} />
      </body>
    </html>
  )
}
