'use client'

import { useState, useId } from 'react'
import type { HomeContent } from '@/features/home/schema'

interface Props {
  about: HomeContent['about']
}

const DOT_COLORS = ['#C5192D', '#FF3A21', '#FD6925', '#3F7E44', '#C5192D', '#FF3A21']

/**
 * Rynzhuk-style type poster for the "What we do" section.
 * Services alternate roman and italic; coloured dots separate them.
 * Hover/focus reveals the description for the active item.
 * Keyboard: Tab to each item, Enter/Space to pin the description.
 */
export function AboutSection({ about }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const captionId = useId()

  const activeDesc = activeIdx !== null ? about.services[activeIdx]?.description : null

  return (
    <section
      style={{ background: '#EEF2F6', paddingBlock: 'clamp(80px,9vw,144px) 0' }}
      aria-labelledby="about-hd"
    >
      <div className="wrap">
        <h2
          id="about-hd"
          style={{
            fontFamily: 'var(--font-host-grotesk, var(--fb))',
            fontSize: 'clamp(1.875rem,3.5vw,3rem)',
            fontWeight: 600,
            letterSpacing: '-0.008em',
            lineHeight: 1.08,
            color: '#0E1530',
            marginBottom: '1.25rem',
          }}
        >
          {about.heading}
        </h2>
        <p
          style={{
            fontSize: 'clamp(1.0625rem,1.15vw,1.125rem)',
            color: '#202F60',
            lineHeight: 1.55,
            maxWidth: '72ch',
            marginBottom: 'clamp(28px,3vw,40px)',
          }}
        >
          {about.body}
        </p>

        {/* Type poster — services as one flowing block */}
        {about.services.length > 0 && (
          <div
            style={{
              fontSize: 'clamp(2.625rem,4.8vw,4rem)',
              fontWeight: 600,
              letterSpacing: '-0.015em',
              lineHeight: 1.28,
              color: '#0E1530',
            }}
            role="list"
            aria-label="What we do"
          >
            {about.services.map((svc, i) => (
              <span key={svc.name}>
                <span
                  role="listitem"
                  tabIndex={0}
                  aria-describedby={captionId}
                  style={{
                    display: 'inline',
                    cursor: 'pointer',
                    fontFamily: i % 2 === 0
                      ? 'var(--font-host-grotesk, var(--fb))'
                      : 'var(--font-bodoni, Georgia, serif)',
                    fontStyle: i % 2 === 0 ? 'normal' : 'italic',
                    color: activeIdx === i ? '#C52035' : 'inherit',
                    textDecorationLine: 'underline',
                    textDecorationThickness: activeIdx === i ? '2px' : '0px',
                    textDecorationColor: '#C52035',
                    textUnderlineOffset: '5px',
                    transition: 'color 240ms',
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                  onFocus={() => setActiveIdx(i)}
                  onBlur={() => setActiveIdx(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setActiveIdx(i === activeIdx ? null : i)
                    }
                  }}
                >
                  {svc.name}
                </span>
                {i < about.services.length - 1 && (
                  <span
                    aria-hidden="true"
                    style={{
                      fontStyle: 'normal',
                      fontWeight: 600,
                      margin: '0 0.22em',
                      display: 'inline-block',
                      fontSize: '0.55em',
                      verticalAlign: '0.25em',
                      lineHeight: 1,
                      color: DOT_COLORS[i % DOT_COLORS.length],
                    }}
                  >
                    &bull;
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Caption below poster */}
        <p
          id={captionId}
          aria-live="polite"
          style={{
            marginTop: '1.5rem',
            paddingBottom: 'clamp(80px,9vw,144px)',
            fontSize: 'clamp(1.1875rem,1.8vw,1.5rem)',
            color: '#202F60',
            minHeight: '3rem',
            lineHeight: 1.5,
            maxWidth: '68ch',
            opacity: activeDesc ? 1 : 0,
            transition: 'opacity 240ms',
          }}
        >
          {activeDesc ?? ' '}
        </p>
      </div>
    </section>
  )
}
