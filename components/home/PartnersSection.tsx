import Image from 'next/image'
import type { HomeContent } from '@/features/home/schema'

interface Props {
  partners: HomeContent['partners']
}

export function PartnersSection({ partners }: Props) {
  return (
    <section
      style={{ background: '#0E1530', paddingBlock: 'clamp(56px,7vw,112px)' }}
      aria-labelledby="par-hd"
    >
      <div className="wrap">
        <h2
          id="par-hd"
          style={{
            fontFamily: 'var(--font-host-grotesk, var(--fb))',
            fontSize: 'clamp(1.125rem,1.8vw,1.375rem)',
            fontWeight: 600,
            color: 'rgba(255,255,255,.55)',
            marginBottom: 'clamp(24px,3vw,40px)',
            letterSpacing: '0',
          }}
        >
          {partners.heading}
        </h2>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2.5rem',
            alignItems: 'center',
          }}
          role="list"
        >
          {partners.logos.map((logo, i) => {
            const alt = logo.name || 'Partner logo'
            const img = (
              <Image
                src={logo.logo}
                alt={alt}
                width={160}
                height={56}
                style={{ height: '2.5rem', width: 'auto', opacity: 0.8, filter: 'brightness(0) invert(1)' }}
                loading="lazy"
              />
            )
            return (
              <div key={`${logo.logo}-${i}`} role="listitem">
                {logo.href ? (
                  <a
                    href={logo.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={logo.name || 'Partner website'}
                    style={{ display: 'block', transition: 'opacity 150ms' }}
                  >
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
    </section>
  )
}
