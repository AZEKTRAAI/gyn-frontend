import type { Metadata } from 'next'
import { Anton, Newsreader } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { cms } from '@/lib/cms'

// Both are pure enhancement — split into async chunks so they don't block initial parse
const LenisScroll = dynamic(() =>
  import('@/components/LenisScroll').then((m) => ({ default: m.LenisScroll })),
)

// Anton: free condensed gothic standing in for Conthic, headings only (one weight).
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-heading', display: 'swap' })

// Newsreader: editorial serif for everything else; variable 200 to 800 with optical sizes, upright only.
const newsreader = Newsreader({ subsets: ['latin'], axes: ['opsz'], variable: '--font-text', display: 'swap' })

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
  const sitemap = await cms.getSitemap()

  return (
    <html lang="en" className={`${anton.variable} ${newsreader.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <LenisScroll />
        <a href="#main" className="sr-only focus:not-sr-only">
          Skip to main content
        </a>
        <SiteHeader nav={sitemap.nav} />
        {children}
        <SiteFooter footer={sitemap.footer} socials={sitemap.socials} />
      </body>
    </html>
  )
}
