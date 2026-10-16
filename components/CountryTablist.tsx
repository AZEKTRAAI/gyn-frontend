'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { MediaEntry } from '@/features/media/media'

interface Person {
  name: string
  role: string
  country: string
  image: MediaEntry
}

interface Tab {
  id: string
  label: string
  people: Person[]
}

interface Props {
  tabs: Tab[]
}

export function CountryTablist({ tabs }: Props) {
  const [activeId, setActiveId] = useState(tabs[0]?.id)
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]

  return (
    <div>
      {/* Tab buttons */}
      <div
        role="tablist"
        aria-label="View people by category"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeId}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveId(tab.id)}
            style={{
              background: tab.id === activeId ? 'var(--blue-deep)' : 'var(--white)',
              color: tab.id === activeId ? 'var(--white)' : 'var(--blue-deep)',
              border: '2px solid var(--blue-deep)',
              padding: '0.375rem 0.875rem',
              fontFamily: 'var(--fb)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 160ms ease, color 160ms ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== activeId}
          style={{
            display: tab.id === activeId ? 'flex' : 'none',
            flexWrap: 'wrap',
            gap: '1.5rem',
            alignContent: 'start',
          }}
        >
          {active?.people.map((p) => (
            <div
              key={p.name}
              style={{
                display: 'grid',
                gap: '0.625rem',
                width: '184px',
              }}
            >
              <Image
                src={p.image.src}
                alt={p.image.alt}
                width={184}
                height={184}
                style={{ objectFit: 'cover', width: '184px', height: '184px' }}
              />
              <span style={{ fontFamily: 'var(--fd)', fontSize: '0.875rem', color: 'var(--navy-900)' }}>
                {p.name}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--n-600)', lineHeight: 1.4 }}>
                {p.country}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
