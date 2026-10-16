'use client'

import Image from 'next/image'
import { useState } from 'react'

interface Summit {
  id: string
  name: string
  dates: string
  status: 'past' | 'open'
  photo: string
  photoAlt: string
  description: string
  ctaLabel?: string
  ctaHref?: string
}

interface Props {
  summits: Summit[]
}

export function SummitsSwapper({ summits }: Props) {
  const [activeId, setActiveId] = useState(summits[0]?.id)
  const active = summits.find((s) => s.id === activeId) ?? summits[0]

  return (
    <div
      className="summits-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.7fr',
        gap: '2rem',
        alignItems: 'start',
      }}
    >
      {/* List */}
      <ul style={{ listStyle: 'none' }}>
        {summits.map((s) => (
          <li key={s.id} style={{ marginBottom: '0.5rem' }}>
            <button
              onClick={() => setActiveId(s.id)}
              aria-pressed={s.id === activeId}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.25rem',
                padding: '1.25rem 1.25rem 1.25rem 1.5rem',
                background:
                  s.id === activeId ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.06)',
                border: 'none',
                boxShadow:
                  s.id === activeId
                    ? 'inset 3px 0 0 var(--yellow)'
                    : 'inset 3px 0 0 transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 200ms ease, box-shadow 200ms ease',
                fontFamily: 'var(--fb)',
              }}
            >
              <span
                style={{ fontFamily: 'var(--fd)', fontSize: '1rem', color: 'var(--white)' }}
              >
                {s.name}
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,.6)' }}>
                {s.dates}
              </span>
              {s.status === 'open' && (
                <span style={{ fontSize: '0.75rem', color: 'var(--yellow)', fontWeight: 600 }}>
                  Registration open
                </span>
              )}
              {s.status === 'past' && (
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.45)' }}>
                  Past event
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* Display */}
      {active && (
        <div>
          <div
            style={{
              position: 'relative',
              aspectRatio: '16/10',
              background: 'rgba(0,0,0,.2)',
              overflow: 'hidden',
            }}
          >
            <Image
              src={active.photo}
              alt={active.photoAlt}
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,.09)' }}>
            <p
              style={{
                fontFamily: 'var(--fd)',
                fontSize: '0.9375rem',
                color: 'var(--white)',
                marginBottom: '0.5rem',
              }}
            >
              {active.name}
            </p>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'rgba(255,255,255,.72)',
                lineHeight: 1.65,
                marginBottom: active.ctaLabel ? '1rem' : 0,
              }}
            >
              {active.description}
            </p>
            {active.ctaLabel && active.ctaHref && (
              <a href={active.ctaHref} className="btn btn-y">
                {active.ctaLabel}
              </a>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          /* SummitsSwapper collapses to single column */
        }
      `}</style>
    </div>
  )
}
