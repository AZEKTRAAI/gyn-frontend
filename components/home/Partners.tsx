// Server component: no interactivity needed, just rendering from HomeContent.
import Image from 'next/image'
import type { HomeContent } from '@/features/home/schema'

export function Partners({ data }: { data: HomeContent['partners'] }) {
  return (
    <section
      id="partners"
      aria-labelledby="par-hd"
      style={{ background: '#0E1530', color: '#fff', paddingBlock: 'clamp(72px,9vw,136px)' }}
    >
      <div className="wrap">
        {/* Co-host block */}
        <div
          className="par-cohost"
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '28px',
            alignItems: 'center',
            paddingBottom: '36px',
            borderBottom: '1px solid rgba(255,255,255,.14)',
            marginBottom: '36px',
          }}
        >
          {/* Logo on a white chip */}
          <div
            style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '12px 16px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <Image
              src={data.cohost.logo.src}
              alt={data.cohost.logo.alt}
              width={160}
              height={56}
              style={{ height: '56px', width: 'auto', display: 'block' }}
            />
          </div>
          <div>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--yellow)',
                marginBottom: '8px',
              }}
            >
              Co-host
            </p>
            <h3
              id="par-hd"
              style={{
                fontFamily: 'var(--fd)',
                fontSize: 'clamp(1.25rem,2.2vw,1.875rem)',
                fontWeight: 700,
                lineHeight: 1.12,
                letterSpacing: '-0.012em',
                color: '#fff',
                marginBottom: '8px',
              }}
            >
              {data.cohost.text}
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)', lineHeight: 1.55 }}>
              {data.cohost.note}
            </p>
          </div>
        </div>

        {/* Partner logos */}
        <p
          style={{
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: 'var(--yellow)',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          {data.heading}
        </p>
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 40px', alignItems: 'center', justifyContent: 'center' }}
          role="list"
        >
          {data.logos.map((logo) => {
            const img = (
              <Image
                src={logo.logo}
                alt={logo.name || 'Partner logo'}
                width={160}
                height={40}
                style={{
                  height: '34px',
                  width: 'auto',
                  filter: 'brightness(0) invert(1)',
                  opacity: 0.85,
                  display: 'block',
                }}
                loading="lazy"
              />
            )
            return (
              <div key={logo.logo} role="listitem">
                {logo.href ? (
                  <a href={logo.href} target="_blank" rel="noopener noreferrer">
                    {img}
                  </a>
                ) : (
                  img
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          #partners .par-cohost { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
