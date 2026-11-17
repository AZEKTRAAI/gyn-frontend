import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development';

const csp = [
  "default-src 'self'",
  // unsafe-inline: required for Next.js inline styles and Turnstile widget.
  // unsafe-eval: required for Next.js dev HMR/React refresh; omitted in production.
  // Upgrade to nonce-based CSP via middleware before real-payment production launch.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  // next/font self-hosts Google Fonts at build time; no external font CDN needed at runtime.
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://i.ytimg.com https://thegyn.org https://img.youtube.com https://res.cloudinary.com",
  // Turnstile challenge iframe + YouTube nocookie embeds
  "frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com",
  // Stripe API calls are server-side only. Turnstile verify and Vercel analytics are client-initiated.
  "connect-src 'self' https://challenges.cloudflare.com https://va.vercel-scripts.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security",  value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy",     value: csp },
  { key: "X-Frame-Options",             value: "DENY" },
  { key: "X-Content-Type-Options",      value: "nosniff" },
  { key: "Referrer-Policy",             value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",          value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

// Old thegyn.org (WordPress) URLs that no longer have their own page. The old site used trailing slashes;
// Next already 308s /about-us/ to /about-us, so only renamed or removed pages need an entry here.
// The two SISM application pages are closed (scholarship applications ended 11 Oct); the event page lists the categories.
export const OLD_URL_REDIRECTS = [
  { source: '/home', destination: '/' },
  { source: '/fmst-2026', destination: '/fms-thailand' },
  { source: '/sism-2026-application-form', destination: '/sism-2026#categories' },
  { source: '/sism-fully-funded-scholarship', destination: '/sism-2026#categories' },
  // it confirmed a scholarship application, which is not a registration, so it must not land on /sism-2026/registered
  { source: '/thank-you-page', destination: '/sism-2026' },
]

// Staging and Vercel previews must not be indexed. Same rule as app/robots.ts.
const noindex = process.env.NOINDEX === '1' || process.env.VERCEL_ENV === 'preview'

const nextConfig: NextConfig = {
  // Self-hosting on the Netcup VPS: .next/standalone is a self-contained server (node server.js) for the Docker image.
  output: 'standalone',
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'thegyn.org' },
      // admin image uploads (features/home/upload.ts)
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // admin image uploads are capped at 4 MB; the rest is multipart overhead
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
  async redirects() {
    return OLD_URL_REDIRECTS.map((r) => ({ ...r, permanent: true }))
  },
  async headers() {
    const robots = noindex ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : [];
    return [{ source: "/(.*)", headers: [...securityHeaders, ...robots] }];
  },
}

export default nextConfig
