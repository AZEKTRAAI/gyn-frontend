import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <main id="main" style={{ paddingTop: 'calc(3.5rem + clamp(2rem, 5vw, 4.5rem))' }}>
      <section
        aria-labelledby="nf-title"
        style={{
          background: 'var(--blue-deep)',
          paddingBlock: 'var(--sp)',
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div className="wrap" style={{ textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'var(--fd)',
              fontSize: 'clamp(4rem, 15vw, 10rem)',
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
            <Link href="/sism-2026" className="btn btn-y">
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
    </main>
  )
}
