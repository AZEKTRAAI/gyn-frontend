'use client'

/**
 * Speakers name-list + sticky photo pattern — mirrors AdvisorsSection from the home page.
 * Desktop: name list on left, sticky photo panel on right (clip-path wipe on change).
 * Mobile: active row expands to show the photo inline below the name.
 */

import { useState } from 'react'
import Image from 'next/image'

export interface SpeakerItem {
  name: string
  role: string
  org: string
  imageSrc: string
  imageAlt: string
}

interface Props {
  speakers: SpeakerItem[]
}

export function SismSpeakers({ speakers }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)

  function handleKeyDown(e: React.KeyboardEvent, i: number) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(i + 1, speakers.length - 1)
      setActiveIdx(next)
      ;(e.currentTarget.parentElement?.children[next] as HTMLElement)?.focus()
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = Math.max(i - 1, 0)
      setActiveIdx(prev)
      ;(e.currentTarget.parentElement?.children[prev] as HTMLElement)?.focus()
    }
  }

  return (
    <>
      <div
        className="adv-inner"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem', alignItems: 'start' }}
      >
        {/* Name list */}
        <div role="list">
          {speakers.map((spk, i) => (
            <div
              key={spk.name}
              role="listitem"
              tabIndex={0}
              aria-current={i === activeIdx ? 'true' : undefined}
              style={{ padding: '1rem 0', borderBottom: '1px solid rgba(14,21,48,.09)', cursor: 'pointer', outline: 'none' }}
              onMouseEnter={() => setActiveIdx(i)}
              onFocus={() => setActiveIdx(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            >
              <p
                style={{
                  fontFamily: 'var(--fd)',
                  fontSize: 'clamp(1.125rem,2vw,1.625rem)',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.1,
                  color: i === activeIdx ? 'var(--crimson-600)' : 'var(--ink)',
                  transition: 'color 200ms',
                }}
              >
                {spk.name}
              </p>
              {i === activeIdx && (
                <p style={{ fontSize: '0.75rem', color: 'var(--navy)', opacity: 0.82, marginTop: '0.3125rem', lineHeight: 1.4 }}>
                  {spk.role}{spk.org && spk.org !== spk.role ? `, ${spk.org}` : ''}
                </p>
              )}
              {/* Mobile: inline photo in active row */}
              {i === activeIdx && (
                <div
                  className="adv-mobile-photo"
                  style={{ display: 'none', marginTop: '0.75rem', borderRadius: '28px', overflow: 'hidden', maxWidth: '280px', aspectRatio: '3/4' }}
                >
                  <Image
                    src={spk.imageSrc}
                    alt={spk.imageAlt}
                    width={280}
                    height={373}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sticky photo — desktop only */}
        <div
          className="adv-photo-wrap"
          style={{ position: 'sticky', top: '6rem', aspectRatio: '3/4', borderRadius: '28px', overflow: 'hidden', background: 'var(--field)' }}
          aria-hidden="true"
        >
          {speakers.map((spk, i) => (
            <Image
              key={spk.name}
              src={spk.imageSrc}
              alt=""
              fill
              sizes="(max-width: 767px) 0, 40vw"
              style={{
                objectFit: 'cover',
                objectPosition: 'center top',
                clipPath: i === activeIdx ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
                transition: 'clip-path 500ms cubic-bezier(0.16,1,0.3,1)',
              }}
              loading="lazy"
            />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .adv-inner { grid-template-columns: 1fr !important; gap: 0 !important; }
          .adv-photo-wrap { display: none !important; }
          .adv-mobile-photo { display: block !important; }
        }
      `}</style>
    </>
  )
}
