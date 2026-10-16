# Security Review -- thegyn.org Redesign

**Commit reviewed:** d4ae6c4 feat(pages-b): SISM 2026 event page, registration forms and post-payment pages
**Date:** 2026-10-16
**Reviewer:** cyber-analyst (Claude Sonnet 4.6)
**Scope:** app/api/**, lib/server/**, lib/db.ts, features/registration/**, features/contact/**, features/payments/**, prisma/schema.prisma, next.config.ts, .env.example, .gitignore, package.json, client localStorage code, lib/md-render.ts, app/admin, app/pitch

---

## Findings Table

| ID | Severity | Location | Finding | Evidence | Fix |
|---|---|---|---|---|---|
| SEC-001 | Critical | next.config.ts | No security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) | curl http://localhost:3000/ response contains zero security headers. XSS, clickjacking, and data-leakage vectors are all open. | Add headers() to next.config.ts; see proposed block below. |
| SEC-002 | Critical | app/api/registrations/route.ts:13-19 / app/api/contact/route.ts:11-17 | Rate limit bypass via X-Forwarded-For IP spoofing | Confirmed by live curl test: first 5 requests from X-Forwarded-For: 10.0.1.1 exhaust the window; switching to 10.0.2.1 immediately succeeds. Attacker rotates IPs for unlimited registrations. | On Vercel use only req.headers.get("x-real-ip") which the Vercel edge sets and clients cannot spoof. Never trust the leftmost X-Forwarded-For without a trusted-proxy allowlist. |
| SEC-003 | High | app/admin/page.tsx | Admin dashboard publicly accessible with no authentication | curl http://localhost:3000/admin returns HTTP 200. robots: noindex is security-by-obscurity only. | Add middleware or route-level auth guard. HTTP Basic Auth behind env var for demo; JWT/session auth before production. |
| SEC-004 | High | lib/md-render.ts:46-47 | javascript: URLs not blocked in Markdown link hrefs -- XSS via policy pages | inline() calls escape(s) then applies link regex. [text](javascript:alert(1)) produces an anchor with javascript: href. Output injected via dangerouslySetInnerHTML on all three policy pages. | In link replacement validate scheme: only allow https://, http://, /, or # prefixes. Drop any other scheme silently. |
| SEC-005 | High | lib/server/turnstile.ts:9-11 | Turnstile CAPTCHA silently bypassed when TURNSTILE_SECRET_KEY absent | verifyTurnstile() emits console.warn then returns without checking when key not set. Any bot payload passes. Misconfigured production = no CAPTCHA ever. | Throw TurnstileError (not warn+return) when key absent and NODE_ENV === production. |
| SEC-006 | High | lib/server/email.ts:18-44 | Confirmation email HTML built from template literals with unescaped user values | recipientName, ticketName, reference interpolated raw into HTML in confirmationHtml(). User name containing HTML tags injects into every email client rendering the message. | Add esc() helper and wrap every interpolated value before inserting into HTML string. |
| SEC-007 | High | lib/server/rate-limit.ts:57-60 | Rate limiter fails open when Upstash Redis unreachable | On fetch error checkUpstash() returns {allowed: true}. Redis outage disables all rate limiting entirely. | On Upstash error fall back to checkInMemory(key) as degraded mode instead of allowing all requests. |
| SEC-008 | Medium | features/registration/ui/RegistrationForm.tsx:203-205 | Open redirect: checkoutUrl from API used directly in window.location.href without origin validation | No origin check before redirect. API response tampering sends browser to arbitrary URL. | Validate URL before assigning: must start with https://checkout.stripe.com/ or window.location.origin. |
| SEC-009 | Medium | .gitignore | Plain .env file not covered by .gitignore | .gitignore covers .env.local and .env.*.local but not a plain .env. Credentials committed if developer uses .env. | Add .env to .gitignore. |
| SEC-010 | Medium | features/registration/server/register.ts:106-109 | HTML/script tags storable in attendeeData JSON blob without sanitisation | fullName=<script>alert(1)</script> (26 chars) passes Zod (max 120). Confirmed by curl: returns reference SISM-3H72G. Stored in JSON; any non-React render path is stored XSS. | Add angle-bracket rejection to name fields: .regex(/^[^<>]*$/, "Name must not contain < or >") |
| SEC-011 | Medium | app/api/webhooks/stripe/route.ts:133-151 | Confirmation email sends to hardcoded unknown@example.com | Stub confirmed in source at line 143. Paying delegates receive no confirmation email in production. | Implement DB lookup for attendee email/name from registrationId before enabling live payments. |
| SEC-012 | Medium | lib/server/rate-limit.ts:1-6 | In-memory rate limiter not shared across serverless instances | Documented shortcut. Vercel cold-starts each function instance with empty Map. Attacker gets Nx5 requests per window across N active instances. | Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in Vercel deployment before launch. |
| SEC-013 | Low | features/payments/stripe.ts:125-133 | createStripeProvider() requires STRIPE_WEBHOOK_SECRET even for checkout-only use | Minor operational friction; not a security vulnerability. | Make webhookSecret optional; require it only inside parseWebhook(). |
| SEC-014 | Low | package.json | gray-matter -> js-yaml -> sprintf-js DoS (GHSA-hp3w-g68c-fv3c, moderate) | npm audit --omit=dev: 4 moderate vulns. gray-matter parses only dev-controlled .md files at build time; no user input reaches this parser. Near-zero exploitability. | Accepted risk. Do not npm audit fix --force (breaks gray-matter API). |
| SEC-015 | Low | prisma/schema.prisma:168 | Attendee.email not unique; no per-event deduplication | By design. Double-booking by same email is possible. No direct security impact today. | Add email-per-event uniqueness check at application layer if desired. |
| SEC-016 | Low | app/pitch/page.tsx | Pitch page publicly accessible with no authentication | robots: noindex set. No confidential data served currently. | HTTP Basic Auth behind env var for safe presentations. Acceptable risk for Sunday demo. |

---

## Proposed Security Headers Block (next.config.ts)

```typescript
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
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "thegyn.org" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
```

**Notes:**
- Remove `https://va.vercel-scripts.com` from `script-src` and `connect-src` if Vercel Analytics is not installed.
- If registration forms need to be iframe-embedded on partner sites, change `frame-ancestors 'none'` to `frame-ancestors 'self' https://thegyn.org`.
- Stripe Checkout is a full-page redirect to stripe.com; no Stripe origin is needed in the client CSP.
- `next/font/google` downloads and self-hosts fonts at build time; `fonts.googleapis.com` is NOT needed in the CSP at runtime.

---

## Passport Number Handling Assessment

| Stage | Handling | Status |
|---|---|---|
| Form localStorage | lsSave() explicitly deletes passportNumber before write | CORRECT |
| Network | Sent in POST body; encrypted by HTTPS in production | ACCEPTABLE |
| Server validation | Zod validates format; register.ts:107 skips passportNumber in attendeeData loop | CORRECT |
| Database | Attendee model has no passportNumber column | CORRECT |
| Logs | Error paths log only reference/error; raw body never logged | CORRECT |
| Emails | Not present in any current email template | CORRECT |
| Remaining risk | Passport number lives in request-handler memory. Ensure APM tools (Sentry, Datadog) are configured to scrub request bodies from breadcrumbs and traces. | ACTION NEEDED |

---

## Summary

| Severity | Count |
|---|---|
| Critical | 2 |
| High | 5 |
| Medium | 5 |
| Low | 4 |
| **Total** | **16** |

**Top priority fix:** SEC-001 -- add security headers to `next.config.ts`. Zero new code, blocks the entire XSS/clickjacking attack surface, required for PCI SAQ A.

---

## Safe to Demo on Sunday?

**Yes, with one action.** All displayed data is fabricated sample data. No real PII or live Stripe credentials are active.

Required before Sunday demo: apply the security headers block (SEC-001). Without it, any reviewer who opens DevTools will immediately flag the missing headers. Also configure `TURNSTILE_SECRET_KEY` (SEC-005) to prevent registration form spam during a live demo.

---

## Must Fix Before Real Payments

Before setting `STRIPE_SECRET_KEY=sk_live_...` in any production environment:

1. **SEC-001** -- Security headers (CSP, HSTS, X-Frame-Options). Required for PCI SAQ A.
2. **SEC-002** -- Fix X-Forwarded-For IP spoofing in rate limiter + deploy Upstash Redis (SEC-012 paired fix).
3. **SEC-003** -- Admin route must require authentication. Real registration data must not be publicly readable.
4. **SEC-005** -- `TURNSTILE_SECRET_KEY` must be set in production; fail-closed when absent.
5. **SEC-006** -- Escape all user-supplied values in `confirmationHtml()` before email delivery.
6. **SEC-007** -- Rate limiter must degrade to in-memory (not allow-all) on Redis error.
7. **SEC-011** -- Implement real attendee DB lookup in `sendConfirmation()` so paying delegates receive their confirmation email.
