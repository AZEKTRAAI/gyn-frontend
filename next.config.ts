import type { NextConfig } from 'next'

const csp = [
  "default-src 'self'",
  // unsafe-inline: required for Next.js inline styles and Turnstile widget.
  // Upgrade to nonce-based CSP via middleware before real-payment production launch.
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  // next/font self-hosts Google Fonts at build time; no external font CDN needed at runtime.
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://i.ytimg.com https://thegyn.org https://img.youtube.com",
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

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'thegyn.org' },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
}

export default nextConfig
