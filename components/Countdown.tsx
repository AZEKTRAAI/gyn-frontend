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

export function Countdown() {
  // Server renders real digits (as of build time) so the full-size numbers are part of the first paint;
  // a "--" placeholder made the digits a late LCP candidate on mobile. The client corrects them on mount.
  const [units, setUnits] = useState<Unit[]>(compute)
  // suppressHydrationWarning keeps the build-time digits in the DOM; remounting once after hydration replaces them (RT-077)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUnits(compute())
    const id = setInterval(() => setUnits(compute()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      key={hydrated ? 'live' : 'build'}
      className="countdown"
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
                /* Krona One is very wide; floor raised to 1.75rem to prevent overflow at 360px */
                fontSize: 'clamp(1.75rem, 4.5vw, 3.75rem)',
                lineHeight: 1,
                color: 'var(--yellow)',
                minWidth: '2ch',
                textAlign: 'center',
              }}
            >
              {u.value}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--white)', letterSpacing: '0.03em' }}>
              {u.label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span
              aria-hidden="true"
              style={{
                fontFamily: 'var(--fd)',
                fontSize: 'clamp(1.25rem, 3vw, 2.75rem)',
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
