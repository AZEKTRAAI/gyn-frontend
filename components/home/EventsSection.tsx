import Image from 'next/image'
import Link from 'next/link'
import type { HomeContent } from '@/features/home/schema'

interface Props {
  events: HomeContent['events']
}

export function EventsSection({ events }: Props) {
  const [first, ...rest] = events.items

  return (
    <section
      style={{ background: '#fff', paddingBlock: 'clamp(80px,9vw,144px)' }}
      aria-labelledby="evt-hd"
    >
      <div className="wrap">
        <h2
          id="evt-hd"
          style={{
            fontFamily: 'var(--font-host-grotesk, var(--fb))',
            fontSize: 'clamp(1.875rem,3.5vw,3rem)',
            fontWeight: 600,
            letterSpacing: '-0.008em',
            lineHeight: 1.08,
            color: '#0E1530',
            marginBottom: 'clamp(28px,3vw,48px)',
          }}
        >
          {events.heading}
        </h2>

        {/* Large first card */}
        {first && (
          <div
            style={{
              borderRadius: '28px',
              overflow: 'hidden',
              background: '#0E1530',
              position: 'relative',
              marginBottom: rest.length > 0 ? '1rem' : 0,
              minHeight: '360px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            <Image
              src={first.image.src}
              alt={first.image.alt}
              fill
              sizes="(max-width: 767px) 100vw, 90vw"
              style={{ objectFit: 'cover' }}
              loading="lazy"
            />
            {/* Scrim — keeps text readable over photo */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(14,21,48,.75) 0%, rgba(14,21,48,.08) 55%, transparent 100%)', /* scrim */
              }}
            />
            <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(20px,3vw,36px)' }}>
              {first.kicker && (
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FCC30B', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>
                  {first.kicker}
                </p>
              )}
              <h3
                style={{
                  fontFamily: 'var(--font-host-grotesk, var(--fb))',
                  fontSize: 'clamp(1.375rem,2.5vw,2rem)',
                  fontWeight: 600,
                  color: '#fff',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.15,
                  marginBottom: '0.5rem',
                }}
              >
                {first.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,.8)', marginBottom: '0.375rem' }}>
                {first.dates}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,.7)', marginBottom: '1.25rem' }}>
                {first.venue}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.55, marginBottom: '1.5rem', maxWidth: '72ch' }}>
                {first.description}
              </p>
              <Link
                href={first.cta.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#FCC30B',
                  color: '#0E1530',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  padding: '0.875rem 1.75rem',
                  borderRadius: '999px',
                  transition: 'transform 160ms',
                }}
              >
                {first.cta.label}
              </Link>
            </div>
          </div>
        )}

        {/* Smaller additional cards */}
        {rest.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {rest.map((item) => (
              <div
                key={item.title}
                style={{
                  borderRadius: '28px',
                  overflow: 'hidden',
                  border: '1px solid rgba(14,21,48,.1)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    fill
                    sizes="(max-width: 767px) 100vw, 45vw"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: '1.25rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {item.kicker && (
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#C52035', letterSpacing: '0.02em' }}>
                      {item.kicker}
                    </p>
                  )}
                  <h3 style={{ fontFamily: 'var(--font-host-grotesk, var(--fb))', fontSize: '1.0625rem', fontWeight: 600, color: '#0E1530', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#202F60' }}>{item.dates}, {item.venue}</p>
                  <Link
                    href={item.cta.href}
                    style={{ marginTop: 'auto', fontSize: '0.875rem', fontWeight: 600, color: '#0E1530', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {item.cta.label} &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
