'use client'

import { useState } from 'react'
import Image from 'next/image'

// Local prop type — not tied to HomeContent — so about-us/page.tsx can pass {name, role, bio, photo}
// while the home page Advisors.tsx uses HomeContent['advisors'] directly.
interface AdvisorsPerson {
  name: string
  /** about-us uses `role`; home schema uses `where` — accept either. */
  role?: string
  bio: string
  photo: { src: string; alt: string }
}

interface Props {
  advisors: {
    visible?: boolean
    heading: string
    people: AdvisorsPerson[]
  }
}

export function AdvisorsSection({ advisors }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)

  const active = advisors.people[activeIdx]

  function handleKeyDown(e: React.KeyboardEvent, i: number) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(i + 1, advisors.people.length - 1)
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
    <section
      style={{ background: '#fff', paddingBlock: 'clamp(80px,9vw,144px)' }}
      aria-labelledby="adv-hd"
    >
      <div className="wrap">
        <h2
          id="adv-hd"
          style={{
            fontFamily: 'var(--fd)',
            fontSize: 'clamp(1.875rem,3.5vw,3rem)',
            fontWeight: 600,
            letterSpacing: '-0.008em',
            lineHeight: 1.08,
            color: '#0E1530',
            marginBottom: 'clamp(32px,4vw,48px)',
          }}
        >
          {advisors.heading}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem', alignItems: 'start' }} className="adv-inner">
          {/* Name list */}
          <div role="list">
            {advisors.people.map((person, i) => (
              <div
                key={person.name}
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
                    fontSize: 'clamp(1.125rem,2vw,1.625rem)',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.1,
                    color: i === activeIdx ? '#C52035' : '#0E1530',
                    transition: 'color 200ms',
                  }}
                >
                  {person.name}
                </p>
                {i === activeIdx && (
                  <p style={{ fontSize: '0.75rem', color: '#202F60', opacity: 0.82, marginTop: '0.3125rem', lineHeight: 1.4 }}>
                    {person.role}
                  </p>
                )}
                {/* Mobile: show inline photo in row */}
                {i === activeIdx && (
                  <div className="adv-mobile-photo" style={{ display: 'none', marginTop: '0.75rem', borderRadius: '28px', overflow: 'hidden', maxWidth: '280px', aspectRatio: '3/4' }}>
                    <Image
                      src={person.photo.src}
                      alt={person.photo.alt || person.name}
                      width={280}
                      height={373}
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
            className="adv-photo-wrap"
            style={{ position: 'sticky', top: '6rem', aspectRatio: '3/4', borderRadius: '28px', overflow: 'hidden', background: '#EEF2F6' }}
            aria-hidden="true"
          >
            {advisors.people.map((person, i) => (
              <Image
                key={person.name}
                src={person.photo.src}
                alt=""
                fill
                sizes="(max-width: 767px) 0, 40vw"
                style={{
                  objectFit: 'cover',
                  clipPath: i === activeIdx ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
                  transition: 'clip-path 500ms cubic-bezier(0.16,1,0.3,1)',
                }}
                loading="lazy"
              />
            ))}
          </div>
        </div>

        {/* Bio for active advisor */}
        {active?.bio && (
          <p
            aria-live="polite"
            style={{ marginTop: '1.5rem', fontSize: '0.9375rem', color: '#202F60', maxWidth: '60ch', lineHeight: 1.65 }}
          >
            {active.bio}
          </p>
        )}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .adv-inner { grid-template-columns: 1fr !important; gap: 0 !important; }
          .adv-photo-wrap { display: none !important; }
          .adv-mobile-photo { display: block !important; }
        }
      `}</style>
    </section>
  )
}
