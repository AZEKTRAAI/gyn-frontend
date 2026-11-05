import path from 'node:path'
import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

// The admin is for staff only: no framing, no third-party scripts or images, never cached, never indexed.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  // Development only: Next's hot-reload websocket. Without it the page reloads in a loop.
  `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

const headers = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
  { key: 'Cache-Control', value: 'no-store' },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  // The standalone build must also trace the shared package and the hoisted node_modules at the repo root.
  outputFileTracingRoot: path.resolve(process.cwd(), '..'),
  transpilePackages: ['@gyn/core'],
  poweredByHeader: false,
  // Image uploads are capped at 4 MB; the rest is multipart overhead.
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
  async headers() {
    return [{ source: '/(.*)', headers }]
  },
}

export default nextConfig
