'use client'

import { useState } from 'react'
import Image from 'next/image'

export interface SpeakerEntry {
  id: string
  name: string
  role: string
  imageSrc: string
  imageAlt: string
}

interface Props {
  speakers: SpeakerEntry[]
}

/**
 * Speakers list with sticky photo pattern (AdvisorsSection style).
 * Hover/focus reveals the photo in the right column on desktop;
 * active photo shows inline on mobile.
 */
export function FmstSpeakers({ speakers }: Props) {
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
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem', alignItems: 'start' }}
      className="spk-inner"
    >
      {/* Name list */}
      <div role="list">
        {speakers.map((s, i) => (
          <div
            key={s.id}
            role="listitem"
            tabIndex={0}
            aria-current={i === activeIdx ? 'true' : undefined}
            style={{
              padding: '1rem 0',
              borderBottom: '1px solid rgba(14,21,48,.09)',
              cursor: 'pointer',
              outline: 'none',
            }}
            onMouseEnter={() => setActiveIdx(i)}
            onFocus={() => setActiveIdx(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          >
            <p
              style={{
                fontFamily: 'var(--fd)',
                fontSize: 'clamp(1.0625rem,1.8vw,1.5rem)',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
                color: i === activeIdx ? 'var(--crimson-600)' : 'var(--ink)',
                transition: 'color 200ms',
              }}
            >
              {s.name}
            </p>
            {i === activeIdx && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--navy)', opacity: 0.82, marginTop: '0.3125rem', lineHeight: 1.4 }}>
                {s.role}
              </p>
            )}
            {/* Mobile: inline photo */}
            {i === activeIdx && (
              <div
                className="spk-mobile-photo"
                style={{ display: 'none', marginTop: '0.75rem', borderRadius: '20px', overflow: 'hidden', maxWidth: '260px', aspectRatio: '1/1' }}
              >
                <Image
                  src={s.imageSrc}
                  alt={s.imageAlt || s.name}
                  width={260}
                  height={260}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sticky photo — desktop only */}
      <div
        className="spk-photo-wrap"
        style={{ position: 'sticky', top: '6rem', aspectRatio: '1/1', borderRadius: '20px', overflow: 'hidden', background: 'var(--field)' }}
        aria-hidden="true"
      >
        {speakers.map((s, i) => (
          <Image
            key={s.id}
            src={s.imageSrc}
            alt=""
            fill
            sizes="(max-width: 767px) 0, 35vw"
            style={{
              objectFit: 'cover',
              clipPath: i === activeIdx ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
              transition: 'clip-path 500ms cubic-bezier(0.16,1,0.3,1)',
            }}
            loading="lazy"
          />
        ))}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .spk-inner { grid-template-columns: 1fr !important; gap: 0 !important; }
          .spk-photo-wrap { display: none !important; }
          .spk-mobile-photo { display: block !important; }
        }
      `}</style>
    </div>
  )
}
