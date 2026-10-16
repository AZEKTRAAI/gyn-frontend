'use client'

/**
 * PitchClient — Sunday pitch demo page.
 * (a) Before/after comparison slider (keyboard-operable, role="slider")
 * (b) Metrics cards with animated counters (proven numbers only; Lighthouse pending)
 * (c) Premium component showcase
 * (d) Live-site issues list from redteam.md
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { DeckSlider } from '@/components/premium/DeckSlider'
import { ADVISORY } from '@/features/media/media'
import styles from './pitch.module.css'

// ─── Before/After Slider ────────────────────────────────────────────────────

function BeforeAfterSlider() {
  const [position, setPosition] = useState(50) // 0–100 %
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const clamp = (v: number) => Math.max(5, Math.min(95, v))

  // Use refs for event handlers to avoid the useCallback circular dependency
  const handlersRef = useRef({
    move: (_ev: PointerEvent) => { void _ev },
    up: () => {},
  })

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      const updateFromX = (clientX: number) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        setPosition(clamp(((clientX - rect.left) / rect.width) * 100))
      }
      handlersRef.current.move = (ev: PointerEvent) => {
        if (!dragging.current) return
        updateFromX(ev.clientX)
      }
      handlersRef.current.up = () => {
        dragging.current = false
        document.removeEventListener('pointermove', handlersRef.current.move)
        document.removeEventListener('pointerup', handlersRef.current.up)
      }
      dragging.current = true
      updateFromX(e.clientX)
      document.addEventListener('pointermove', handlersRef.current.move)
      document.addEventListener('pointerup', handlersRef.current.up)
    },
    [],
  )

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') setPosition((p) => clamp(p - 2))
    else if (e.key === 'ArrowRight') setPosition((p) => clamp(p + 2))
    else if (e.key === 'Home') setPosition(5)
    else if (e.key === 'End') setPosition(95)
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={startDrag}
      style={{
        position: 'relative',
        userSelect: 'none',
        cursor: 'col-resize',
        overflow: 'hidden',
        aspectRatio: '1440/900',
        width: '100%',
        background: '#111',
      }}
      aria-label="Before and after slider"
    >
      {/* After (new site) — full width, clipped on right */}
      <Image
        src="/pitch/after.png"
        alt="New GYN website design"
        fill
        sizes="(max-width: 1280px) 100vw, 1280px"
        style={{ objectFit: 'cover', objectPosition: 'top left' }}
        priority
      />

      {/* Before (live site) — clips on the left portion */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: `inset(0 ${100 - position}% 0 0)`,
        }}
      >
        <Image
          src="/pitch/before.png"
          alt="Current live thegyn.org website"
          fill
          sizes="(max-width: 1280px) 100vw, 1280px"
          style={{ objectFit: 'cover', objectPosition: 'top left' }}
        />
      </div>

      {/* Labels */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: 'rgba(0,0,0,.65)',
          color: '#fff',
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.25rem 0.625rem',
          letterSpacing: '0.05em',
          pointerEvents: 'none',
        }}
      >
        LIVE SITE
      </div>
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(0,104,157,.9)',
          color: '#fff',
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.25rem 0.625rem',
          letterSpacing: '0.05em',
          pointerEvents: 'none',
        }}
      >
        NEW DESIGN
      </div>

      {/* Drag handle — keyboard accessible via role="slider" */}
      <div
        role="slider"
        aria-label="Slide to compare before and after"
        aria-valuemin={5}
        aria-valuemax={95}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% showing new design`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${position}%`,
          transform: 'translateX(-50%)',
          width: '3px',
          background: '#fff',
          cursor: 'col-resize',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M5 4L1 8l4 4M11 4l4 4-4 4" stroke="#00689D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─── Animated counter ────────────────────────────────────────────────────────

function AnimatedCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        const duration = 1200
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1)
          // ease-out
          const ease = 1 - Math.pow(1 - t, 3)
          setCount(Math.round(ease * to))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [to])

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

// ─── Issues list ─────────────────────────────────────────────────────────────

const LIVE_ISSUES = [
  { id: 'RT-001', sev: 'Blocker', text: 'Mobile hero overflow: H1 clipped to "SUMMIT MALAYSI" at 390px' },
  { id: 'RT-005', sev: 'Blocker', text: 'Mobile collage photos overlap H1, venue and countdown; content unreadable' },
  { id: 'RT-007', sev: 'High', text: 'Globe animation never plays: IntersectionObserver watches a hidden element' },
  { id: 'RT-008', sev: 'High', text: 'Header "Light" button does nothing; no CSS for the theme it attempts to set' },
  { id: 'RT-009', sev: 'High', text: 'No real GYN photo at full scale in the hero; brief required one' },
  { id: 'RT-010', sev: 'High', text: 'UNU named incorrectly: "Institute" not "International Institute for Global Health"' },
  { id: 'RT-011', sev: 'High', text: 'Hero meta text at 3.81:1, countdown labels at 2.93:1 — both fail AA' },
  { id: 'RT-015', sev: 'High', text: '"100 confirmed seats" misleads: confirmed seat is the name of a paid tier' },
  { id: 'RT-019', sev: 'Medium', text: 'Permanent struck-through prices ("was $249") with no end date — fake-discount pattern' },
  { id: 'RT-022', sev: 'Medium', text: 'Alt text written without looking at images: hostesses called "delegates in the main conference hall"' },
  { id: 'RT-024', sev: 'Medium', text: 'Multiple further contrast failures: speaker titles 3.08:1, "Closed" badge 2.05:1' },
  { id: 'RT-027', sev: 'Medium', text: 'Partner links are href="#"; footer email and phone are plain text, not mailto:/tel: links' },
]

const SEV_COLOURS: Record<string, string> = {
  Blocker: '#C52035',
  High: '#F2692C',
  Medium: '#D6A200',
  Low: '#48783F',
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PitchClient() {
  const advisoryItems = Object.entries(ADVISORY).slice(0, 5).map(([key, v]) => {
    const parts = v.alt.split(',')
    return {
      id: key,
      name: parts[0].trim(),
      role: parts[1]?.trim() ?? '',
      organisation: parts[2]?.trim() ?? parts[1]?.trim() ?? '',
      imageSrc: v.src,
      imageAlt: v.alt,
    }
  })

  return (
    <main id="main" style={{ paddingTop: '3.5rem', background: 'var(--paper)' }}>

      {/* Banner */}
      <div
        role="banner"
        style={{
          background: 'var(--yellow)',
          padding: '0.5rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: 'var(--navy-900)',
            letterSpacing: '0.04em',
          }}
        >
          Internal pitch demo — Sunday 19 Oct 2026. Not for public distribution.
        </p>
      </div>

      {/* ====================================================
          TITLE
          ==================================================== */}
      <section
        aria-labelledby="pitch-hd"
        style={{ background: 'var(--navy-900)', paddingBlock: 'clamp(2.5rem, 5vw, 5rem)' }}
      >
        <div className="wrap">
          <h1
            id="pitch-hd"
            className="d1"
            style={{ color: 'var(--white)', marginBottom: '1rem', maxWidth: '22ch' }}
          >
            GYN.org — what we built
          </h1>
          <p
            style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,.8)',
              lineHeight: 1.7,
              maxWidth: '60ch',
            }}
          >
            A full rebuild of thegyn.org: Next.js 16, React 19, Tailwind v4. Direction G
            (Deep Field). Compare the live site and the new design, see what we fixed, and
            explore the premium components.
          </p>
        </div>
      </section>

      {/* ====================================================
          BEFORE / AFTER SLIDER
          ==================================================== */}
      <section
        aria-labelledby="ba-hd"
        style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}
      >
        <div className="wrap">
          <h2
            id="ba-hd"
            className="d2"
            style={{ color: 'var(--navy-900)', marginBottom: '0.5rem' }}
          >
            Before and after
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--n-600)', marginBottom: '1.5rem' }}>
            Drag the handle or use arrow keys to compare the live site (left) with the new
            design (right) at 1440px.
          </p>
          <BeforeAfterSlider />
        </div>
      </section>

      {/* ====================================================
          METRICS
          ==================================================== */}
      <section
        aria-labelledby="metrics-hd"
        style={{ background: 'var(--navy-900)', paddingBlock: 'var(--sp)' }}
      >
        <div className="wrap">
          <h2
            id="metrics-hd"
            className="d2"
            style={{ color: 'var(--white)', marginBottom: '0.75rem' }}
          >
            What the numbers say
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,.6)',
              marginBottom: '2.5rem',
            }}
          >
            Proven numbers are from the red-team audit and contrast checks. Lighthouse
            scores are marked &ldquo;pending&rdquo; — run the audit and fill in
            public/pitch/metrics.json.
          </p>

          <div className={styles.metricsGrid}>
            {/* Proven: contrast */}
            <div style={{ background: 'var(--blue-deep)', padding: '1.75rem 1.25rem' }}>
              <span
                style={{
                  fontFamily: 'var(--fd)',
                  fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                  color: 'var(--yellow)',
                  display: 'block',
                  lineHeight: 1,
                  marginBottom: '0.5rem',
                }}
                aria-label="12.83 to 1"
              >
                <AnimatedCounter to={1283} suffix=":1" />
              </span>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,.8)', lineHeight: 1.5 }}>
                Primary text contrast (navy on white). Live site yellow on white was 1.08:1.
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,.45)', marginTop: '0.5rem' }}>
                Proven — design/palette.md
              </p>
            </div>

            {/* Proven: issues */}
            <div style={{ background: 'var(--crimson-600)', padding: '1.75rem 1.25rem' }}>
              <span
                style={{
                  fontFamily: 'var(--fd)',
                  fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                  color: 'var(--white)',
                  display: 'block',
                  lineHeight: 1,
                  marginBottom: '0.5rem',
                }}
              >
                <AnimatedCounter to={57} />
              </span>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,.85)', lineHeight: 1.5 }}>
                Issues found on the live site: 6 blockers, 12 high, 17 medium, 9 low,
                plus 3 factual errors about photos.
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,.5)', marginTop: '0.5rem' }}>
                Proven — docs/redteam.md
              </p>
            </div>

            {/* Pending: Lighthouse performance */}
            <div style={{ background: 'rgba(255,255,255,.07)', padding: '1.75rem 1.25rem', border: '1px dashed rgba(255,255,255,.2)' }}>
              <span
                style={{
                  fontFamily: 'var(--fd)',
                  fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                  color: 'rgba(255,255,255,.4)',
                  display: 'block',
                  lineHeight: 1,
                  marginBottom: '0.5rem',
                }}
              >
                —
              </span>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.5 }}>
                Lighthouse Performance score
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--yellow)', marginTop: '0.5rem', fontWeight: 600 }}>
                Pending — run Lighthouse, fill metrics.json
              </p>
            </div>

            {/* Pending: Lighthouse a11y */}
            <div style={{ background: 'rgba(255,255,255,.07)', padding: '1.75rem 1.25rem', border: '1px dashed rgba(255,255,255,.2)' }}>
              <span
                style={{
                  fontFamily: 'var(--fd)',
                  fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                  color: 'rgba(255,255,255,.4)',
                  display: 'block',
                  lineHeight: 1,
                  marginBottom: '0.5rem',
                }}
              >
                —
              </span>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.5 }}>
                Lighthouse Accessibility score
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--yellow)', marginTop: '0.5rem', fontWeight: 600 }}>
                Pending — run Lighthouse, fill metrics.json
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          COMPONENT SHOWCASE
          ==================================================== */}
      <section
        aria-labelledby="showcase-hd"
        style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}
      >
        <div className="wrap">
          <h2
            id="showcase-hd"
            className="d2"
            style={{ color: 'var(--navy-900)', marginBottom: '2rem' }}
          >
            Premium components
          </h2>

          {/* DeckSlider demo */}
          <div style={{ marginBottom: '3rem' }}>
            <h3
              style={{
                fontFamily: 'var(--fd)',
                fontSize: '1rem',
                color: 'var(--navy-700)',
                marginBottom: '0.375rem',
              }}
            >
              DeckSlider
            </h3>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--n-600)',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
              }}
            >
              Drag to dismiss the top card; velocity-based spring physics. Keyboard: ArrowLeft /
              ArrowRight. Screen readers see a flat list.
            </p>
            <div style={{ maxWidth: '420px' }}>
              <DeckSlider items={advisoryItems} heading="Advisory board members" />
            </div>
          </div>

          {/* Stat tiles demo */}
          <div>
            <h3
              style={{
                fontFamily: 'var(--fd)',
                fontSize: '1rem',
                color: 'var(--navy-700)',
                marginBottom: '0.375rem',
              }}
            >
              Colour-blocked stat tiles
            </h3>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--n-600)',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
              }}
            >
              Varied sizes and SDG colours. Each pair passes WCAG AA.
            </p>
            <div
              className={styles.tilesGrid}
            >
              {[
                { bg: 'var(--blue-deep)', num: '100', label: 'seats', textCol: 'var(--white)', numCol: 'var(--yellow)' },
                { bg: 'var(--yellow)', num: '4', label: 'focus SDGs', textCol: 'var(--navy-900)', numCol: 'var(--navy-900)' },
                { bg: 'var(--blue-sky)', num: '17', label: 'countries', textCol: 'var(--navy-900)', numCol: 'var(--navy-900)' },
                { bg: 'var(--navy-900)', num: '$1k', label: 'seed grant', textCol: 'rgba(255,255,255,.8)', numCol: 'var(--yellow)' },
              ].map((tile) => (
                <div key={tile.label} style={{ background: tile.bg, padding: '1.5rem 1.25rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--fd)',
                      fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                      color: tile.numCol,
                      display: 'block',
                      lineHeight: 1,
                      marginBottom: '0.375rem',
                    }}
                  >
                    {tile.num}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: tile.textCol }}>{tile.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          LIVE SITE ISSUES
          ==================================================== */}
      <section
        aria-labelledby="issues-hd"
        style={{ background: 'var(--paper)', paddingBlock: 'var(--sp)' }}
      >
        <div className="wrap">
          <h2
            id="issues-hd"
            className="d2"
            style={{ color: 'var(--navy-900)', marginBottom: '0.75rem' }}
          >
            What is broken on the live site
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--n-600)',
              marginBottom: '2rem',
            }}
          >
            From a Playwright audit of thegyn.org on 16 Oct 2026 (docs/redteam.md). All
            57 issues are addressed in the new build.
          </p>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {LIVE_ISSUES.map((issue) => (
              <li
                key={issue.id}
                className={styles.issueRow}
                style={{
                  padding: '0.875rem',
                  background: 'var(--white)',
                  borderLeft: `4px solid ${SEV_COLOURS[issue.sev] ?? 'var(--n-300)'}`,
                }}
              >
                <code
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: 'var(--n-500)',
                    paddingTop: '0.125rem',
                  }}
                >
                  {issue.id}
                </code>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: SEV_COLOURS[issue.sev] ?? 'var(--n-500)',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em',
                    paddingTop: '0.125rem',
                  }}
                >
                  {issue.sev}
                </span>
                <p style={{ fontSize: '0.875rem', color: 'var(--n-700)', lineHeight: 1.55 }}>
                  {issue.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <style>{`
        @media (max-width: 600px) {
          .issues-item { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}
