import Image from 'next/image'
import type { HomeContent } from '@/features/home/schema'

interface Props {
  ambassadors: HomeContent['ambassadors']
}

/**
 * Ambassador mosaic. Handles any count 0–40.
 * Layout: first item spans 2 cols + 2 rows, next 4 are tall (1×2), rest are square (1×1).
 * At ≤767px: first spans 2×1, rest are 1×1.
 */
export function AmbassadorsSection({ ambassadors }: Props) {
  const people = ambassadors.people
  if (people.length === 0) return null

  function mosaicClass(i: number): string {
    if (i === 0) return 'm-a'
    if (i >= 1 && i <= 4) return 'm-b'
    return 'm-d'
  }

  return (
    <section
      style={{ background: '#fff', paddingBlock: 'clamp(80px,9vw,144px)' }}
      aria-labelledby="amb-hd"
    >
      <div className="wrap">
        <h2
          id="amb-hd"
          style={{
            fontFamily: 'var(--font-host-grotesk, var(--fb))',
            fontSize: 'clamp(1.875rem,3.5vw,3rem)',
            fontWeight: 600,
            letterSpacing: '-0.008em',
            lineHeight: 1.08,
            color: '#0E1530',
            marginBottom: people.length > 0 ? 'clamp(28px,3vw,48px)' : 0,
          }}
        >
          {ambassadors.heading}
        </h2>
        {ambassadors.intro && (
          <p style={{ fontSize: 'clamp(1.0625rem,1.15vw,1.125rem)', color: '#202F60', lineHeight: 1.55, marginBottom: '2rem', maxWidth: '72ch' }}>
            {ambassadors.intro}
          </p>
        )}

        <div
          className="amb-mosaic"
          role="list"
          aria-label="GYN global ambassadors"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }}
        >
          {people.map((person, i) => {
            const cls = mosaicClass(i)
            const isDouble = cls === 'm-a'
            const isTall = cls === 'm-b'

            return (
              <div
                key={person.name}
                role="listitem"
                style={{
                  overflow: 'hidden',
                  borderRadius: '28px',
                  position: 'relative',
                  background: '#EEF2F6',
                  gridColumn: isDouble ? 'span 2' : undefined,
                  gridRow: (isDouble || isTall) ? 'span 2' : undefined,
                  aspectRatio: isDouble ? '1/1' : isTall ? undefined : '1/1',
                }}
              >
                <Image
                  src={person.photo.src}
                  alt={person.photo.alt || `${person.name}, GYN Ambassador`}
                  fill
                  sizes="(max-width: 767px) 46vw, 23vw"
                  style={{ objectFit: 'cover' }}
                  loading="lazy"
                />
                {/* Name + country chip */}
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(14,21,48,.72)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '3px 9px',
                    borderRadius: '999px',
                    pointerEvents: 'none',
                    lineHeight: 1.4,
                  }}
                >
                  {person.name}, {person.country}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .amb-mosaic {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .amb-mosaic > div[style*="span 2"] {
            grid-column: span 2 !important;
            grid-row: span 1 !important;
            aspect-ratio: 2/1 !important;
          }
          .amb-mosaic > div[style*="m-b"] {
            grid-row: span 1 !important;
            aspect-ratio: 1/1 !important;
          }
        }
      `}</style>
    </section>
  )
}
