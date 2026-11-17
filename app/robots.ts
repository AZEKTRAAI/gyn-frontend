import type { MetadataRoute } from 'next'

// Read per request so NOINDEX can be set on the server without a rebuild.
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const origin = (process.env.NEXT_PUBLIC_BASE_URL || 'https://thegyn.org').replace(/\/$/, '')
  // Same rule as the X-Robots-Tag header in next.config.ts.
  if (process.env.NOINDEX === '1' || process.env.VERCEL_ENV === 'preview') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/pitch', '/sism-2026/registered', '/sism-2026/registration-cancelled'],
    },
    sitemap: `${origin}/sitemap.xml`,
  }
}
