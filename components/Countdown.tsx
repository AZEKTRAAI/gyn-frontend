'use client'

import { Fragment, useEffect, useState } from 'react'

interface Unit {
  value: string
  label: string
}

function compute(now: number, target: number): Unit[] {
  const diff = Math.max(0, target - now)
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
 *
 * `target` is the event start time as epoch ms. Pass null to hide the countdown entirely
 * (e.g. when no date is set or the date has passed).
 */
export function Countdown({ serverNow, target = null }: { serverNow: number; target?: number | null }) {
  const [units, setUnits] = useState<Unit[]>(() => target !== null ? compute(serverNow, target) : [])

  useEffect(() => {
    if (target === null) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUnits(compute(Date.now(), target))
    const id = setInterval(() => setUnits(compute(Date.now(), target)), 1000)
    return () => clearInterval(id)
  }, [target])

  // Hide when no target or already past (all units are "00")
  if (target === null || target <= serverNow) return null

  return (
    <div
      className="countdown"
      style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
      role="timer"
      aria-label={`Countdown to event`}
    >
      {units.map((u, i) => (
        <Fragment key={u.label}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-host-grotesk, var(--fb))',
                fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                lineHeight: 1,
                color: 'var(--ink, var(--navy-900))',
                fontWeight: 600,
                minWidth: '2ch',
                textAlign: 'center',
              }}
            >
              {u.value}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--navy, var(--navy-700))', letterSpacing: '0.03em' }}>
              {u.label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span
              aria-hidden="true"
              style={{
                fontSize: 'clamp(1.25rem, 3vw, 2rem)',
                color: 'rgba(14,21,48,.3)',
                alignSelf: 'flex-start',
                paddingTop: '0.1em',
                fontWeight: 300,
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
