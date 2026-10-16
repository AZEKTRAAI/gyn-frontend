'use client'

import { Fragment, useEffect, useState } from 'react'

/** Target: 19 Nov 2026 09:00 MYT (UTC+8) = 01:00 UTC */
const TARGET = new Date('2026-11-19T01:00:00Z').getTime()

interface Unit {
  value: string
  label: string
}

function compute(): Unit[] {
  const diff = Math.max(0, TARGET - Date.now())
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  return [
    { value: String(d).padStart(2, '0'), label: 'days' },
    { value: String(h).padStart(2, '0'), label: 'hours' },
    { value: String(m).padStart(2, '0'), label: 'minutes' },
    { value: String(s).padStart(2, '0'), label: 'seconds' },
  ]
}

// Placeholder shown during SSR to avoid hydration mismatch
const PLACEHOLDER: Unit[] = [
  { value: '--', label: 'days' },
  { value: '--', label: 'hours' },
  { value: '--', label: 'minutes' },
  { value: '--', label: 'seconds' },
]

export function Countdown() {
  const [units, setUnits] = useState<Unit[]>(PLACEHOLDER)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // shortcut: SSR hydration guard — two batched state sets are fine in React 18+
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUnits(compute())
    const id = setInterval(() => setUnits(compute()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
      role="timer"
      aria-label="Time until summit opens on 19 November 2026"
      suppressHydrationWarning
    >
      {units.map((u, i) => (
        <Fragment key={u.label}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <span
              suppressHydrationWarning
              style={{
                fontFamily: 'var(--fd)',
                fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)',
                lineHeight: 1,
                color: 'var(--yellow)',
                minWidth: '2ch',
                textAlign: 'center',
              }}
            >
              {mounted ? u.value : '--'}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,.55)', letterSpacing: '0.03em' }}>
              {u.label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span
              aria-hidden="true"
              style={{
                fontFamily: 'var(--fd)',
                fontSize: 'clamp(1.5rem, 3vw, 2.75rem)',
                color: 'rgba(255,255,255,.25)',
                alignSelf: 'flex-start',
                paddingTop: '0.1em',
              }}
            >
              :
            </span>
          )}
        </Fragment>
      ))}
    </div>
  )
}
