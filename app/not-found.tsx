import type { Metadata } from 'next'
import Link from 'next/link'
import { SdgWheel } from '@/components/SdgWheel'

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <main id="main" style={{ paddingTop: 'calc(3.5rem + clamp(2rem, 5vw, 4.5rem))' }}>
      <section
        aria-labelledby="nf-title"
        data-name="Not found"
        style={{
          background: 'var(--navy)',
          paddingBlock: 'var(--sp)',
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative SDG wheel, partially off-screen like the page heroes */}
        <div
          aria-hidden="true"
          className="nf-ring"
        >
          <SdgWheel className="nf-wheel" />
        </div>

        <div className="wrap" style={{ position: 'relative', textAlign: 'center' }}>
          <p className="kick kick-y" style={{ marginBottom: '0.5rem' }}>Error</p>
          <p
            style={{
              fontFamily: 'var(--fd)',
              fontSize: 'clamp(6rem, 20vw, 14rem)',
              lineHeight: 1,
              color: 'var(--yellow)',
              marginBottom: '1rem',
            }}
            aria-hidden="true"
          >
            404
          </p>
          <h1
            id="nf-title"
            className="d2"
            style={{ color: 'var(--white)', marginBottom: '1rem' }}
          >
            Page not found
          </h1>
          <p
            style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,.8)',
              lineHeight: 1.65,
              marginBottom: '2.5rem',
              maxWidth: '50ch',
              marginInline: 'auto',
            }}
          >
            The page you are looking for has moved, been removed, or never
            existed. Here are a few places to go instead.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link href="/" className="btn btn-y">
              Go home
            </Link>
            <Link href="/sism-2026" className="btn btn-ow">
              SISM 2026
            </Link>
            <Link href="/videos" className="btn btn-ow">
              Watch videos
            </Link>
            <Link href="/contact-us" className="btn btn-ow">
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes nf-spin { to { transform: rotate(360deg); } }
        .nf-ring {
          position: absolute;
          right: -10%;
          top: -14%;
          width: min(44vw, 520px);
          opacity: 0.9;
          animation: nf-spin 120s linear infinite;
          pointer-events: none;
          filter: drop-shadow(0 30px 50px rgba(0,0,0,.35));
        }
        .nf-wheel { display: block; width: 100%; height: auto; }
        @media (max-width: 900px) {
          .nf-ring { width: 70vw; right: -32%; top: -6%; opacity: 0.55; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nf-ring { animation: none; }
        }
      `}</style>
    </main>
  )
}
