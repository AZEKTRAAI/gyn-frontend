import type { Metadata } from 'next'
import { Host_Grotesk, Bodoni_Moda } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { cms } from '@/lib/cms'

// Both are pure enhancement — split into async chunks so they don't block initial parse
const LenisScroll = dynamic(() =>
  import('@/components/LenisScroll').then((m) => ({ default: m.LenisScroll })),
)
const ViewTransitionStyles = dynamic(() =>
  import('@/components/premium/PageTransition').then((m) => ({ default: m.ViewTransitionStyles })),
)

/*
  Host Grotesk: contemporary variable grotesk; not on any AI-reflex list.
  Replaces Inter/Geist for the Direction I home page design.
*/
// No weight list: one variable file covers 300 to 800. Italics are Bodoni, so no Host italic file.
const hostGrotesk = Host_Grotesk({
  subsets: ['latin'],
  variable: '--font-host-grotesk',
  display: 'swap',
})

/*
  Bodoni Moda Italic: Didone serif for the Rynzhuk one-word italic accent per headline.
  Optical size range 6..96 ensures good rendering at poster scale.
*/
const bodoniModa = Bodoni_Moda({
  // Bodoni Moda is a variable font; specify weight: 'variable' to unlock the opsz axis
  weight: 'variable',
  style: ['italic'],
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-bodoni',
  display: 'swap',
})

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
    <html lang="en" className={`${hostGrotesk.variable} ${bodoniModa.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ViewTransitionStyles />
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
