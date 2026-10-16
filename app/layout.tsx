import type { Metadata } from 'next'
import { Krona_One, Schibsted_Grotesk } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { cms } from '@/lib/cms'

/*
  Krona One: wide, authoritative display face; no SaaS associations;
  pairs with the SDG wheel's bold geometry.
  Schibsted Grotesk: humanist grotesque from Schibsted Media Group;
  warm, legible; absent from every AI-default font list.
*/
const kronaOne = Krona_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-krona',
  display: 'swap',
})

const schibstedGrotesk = Schibsted_Grotesk({
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-schibsted',
  display: 'swap',
})

export const metadata: Metadata = {
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
    <html lang="en" className={`${kronaOne.variable} ${schibstedGrotesk.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
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
