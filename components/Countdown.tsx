'use client'

import { Fragment, useEffect, useState } from 'react'

/** Target: 19 Nov 2026 09:00 MYT (UTC+8) = 01:00 UTC */
const TARGET = new Date('2026-11-19T01:00:00Z').getTime()

interface Unit {
  value: string
  label: string
}

function compute(now: number): Unit[] {
  const diff = Math.max(0, TARGET - now)
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

/**
 * `serverNow` is the server's render time (build time for static pages). The first client render uses it too,
 * so hydration matches the server HTML exactly; the effect then updates the same text nodes to the real time.
 * That keeps the digits in the first paint (mobile LCP) without stale values (RT-077) or a remount (a late LCP).
 */
export function Countdown({ serverNow }: { serverNow: number }) {
  const [units, setUnits] = useState<Unit[]>(() => compute(serverNow))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUnits(compute(Date.now()))
    const id = setInterval(() => setUnits(compute(Date.now())), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="countdown"
      style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
      role="timer"
      aria-label="Time until summit opens on 19 November 2026"
    >
      {units.map((u, i) => (
        <Fragment key={u.label}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <span
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
