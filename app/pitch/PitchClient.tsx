'use client'

/**
 * PitchClient — Sunday pitch demo page.
 * (a) Before/after comparison slider (keyboard-operable, role="slider")
 * (b) Metrics cards (Lighthouse from docs/lighthouse/*.report.json via props)
 * (c) Premium component showcase
 * (d) Live-site issues found in the 15 Oct 2026 crawl of thegyn.org
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { DeckSlider } from '@/components/premium/DeckSlider'
import { ADVISORY } from '@/features/media/media'
import styles from './pitch.module.css'

interface LhScores { perf: number; a11y: number; bp: number; seo: number; date: string }

interface Props {
  lhHomeMobile: LhScores
  lhHomeDesktop: LhScores
}

// ─── Before/After Slider ────────────────────────────────────────────────────

function BeforeAfterSlider() {
  const [position, setPosition] = useState(50) // 0–100 %
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const clamp = (v: number) => Math.max(5, Math.min(95, v))

  const startDrag = useCallback((e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragging.current = true
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPosition(clamp(((e.clientX - rect.left) / rect.width) * 100))
  }, [])

  function onDragMove(e: React.PointerEvent) {
    if (!dragging.current) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPosition(clamp(((e.clientX - rect.left) / rect.width) * 100))
  }

  function onDragEnd() { dragging.current = false }

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
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      style={{
        position: 'relative',
        userSelect: 'none',
        cursor: 'col-resize',
        overflow: 'hidden',
        aspectRatio: '1440/900',
        width: '100%',
        background: '#111',
        touchAction: 'none',
      }}
      aria-label="Before and after slider"
    >
      {/* After (new site) — full width, clipped on right */}
      <Image
        src="/pitch/after.webp"
        alt="New thegyn.org design"
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
          src="/pitch/before.webp"
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
          outline: '2px solid transparent',
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
      {count}
      {suffix}
    </span>
  )
}

// ─── Issues list (real live-site findings from crawl of thegyn.org, 15 Oct 2026) ──
// Sources: docs/live-site-findings.md. Each item maps to a numbered finding.

// Sources: docs/live-site-findings.md — Problem column verbatim, Evidence column as source.
const LIVE_ISSUES = [
  {
    sev: 'Accessibility',
    text: 'The brand yellow #FEFF00 on white is 1.08:1. WCAG AA needs 4.5:1 for text. It isn’t in the logo either.',
    source: 'design/palette.md (computed with design/contrast.py); logo pixel count in the same file',
  },
  {
    sev: 'Conversion',
    text: 'Both countdowns expired on 11 Oct and show 00:00:00:00, while the home "APPLY NOW" button still links to the summit page.',
    source: 'content/pages/home.md crawl note (line ~251), content/pages/sism-2026.md crawl note (line ~442)',
  },
  {
    sev: 'Trust',
    text: 'The SISM hero\'s "APPLY NOW" jumps to the scholarship section, where both cards now say "CLOSED NOW". Applicants follow the call to action into a dead end.',
    source: 'content/pages/sism-2026.md crawl notes (lines ~442–443)',
  },
  {
    sev: 'Revenue',
    text: 'Forum Access has three prices: $199 on the page, $249 sent to the Meta Pixel as the lead value, and $170 on an unlinked "discounted" form with no CAPTCHA. Self Funded is likewise $399 on the page and $449 in the pixel.',
    source: 'content/pages/sism-2026.md; live HTML of /sism-2026/ fbq(\'track\', \'Lead\', { value: 249 … }); content/pages/sism-2026-application-form.md notes (lines ~74, ~80)',
  },
  {
    sev: 'Content',
    text: 'The scholarship results date is 16 Oct in the FAQ and 15 Oct on the thank-you page.',
    source: 'content/pages/sism-2026.md line ~398; content/pages/thank-you-page.md lines 12 and 25',
  },
  {
    sev: 'Quality',
    text: 'Five benefit items link to a broken address (http://i%20class=fa-solid…), all four contact-page background images return 404, and two FMS speaker photos return 404.',
    source: 'content/pages/sism-2026.md note (line ~444); content/pages/contact-us.md note (line ~49); content/pages/fms-thailand.md note (line ~217)',
  },
  {
    sev: 'Media',
    text: 'Nine videos sit in default YouTube iframes with no filtering, deep links or shared player.',
    source: 'content/media.json (9 videos); crawl of /sism-2026/ and /fms-thailand/',
  },
  {
    sev: 'Copy',
    text: 'Typos on the pages that take money: "PARTIALLY SCHOLARSHIP", "Patronas Twin Tower", "Al" for AI, and a gender field listing sexual orientations, one misspelled ("Hetrosexual").',
    source: 'content/pages/sism-2026.md lines 88, 141, 340 and note (line ~449); content/pages/sism-forum-access.md lines 43–45',
  },
]

// Colors chosen to pass 4.5:1 on white (WCAG AA). Orange/amber fail on white,
// so Conversion/Revenue use crimson-600 and Content/Quality use n-700.
const SEV_COLOURS: Record<string, string> = {
  Accessibility: '#C52035',
  Conversion: '#C52035',
  Trust: '#C52035',
  Revenue: '#C52035',
  Content: '#3F3F3C',
  Quality: '#3F3F3C',
  Media: '#3A4C8C',
  Copy: '#48783F',
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PitchClient({ lhHomeMobile, lhHomeDesktop }: Props) {
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
            thegyn.org, rebuilt
          </h1>
          <p
            style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,.8)',
              lineHeight: 1.7,
              maxWidth: '60ch',
            }}
          >
            A full rebuild of thegyn.org: Next.js 16, React 19, Tailwind v4. Compare the live
            site and the new design, see what we fixed, and explore the premium components.
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
            Contrast proven by design/palette.md. Lighthouse scores from a production build
            ({lhHomeMobile.date}).
          </p>

          <div className={styles.metricsGrid}>
            {/* Proven: contrast — static value, not animated to avoid "1,283:1" bug (RT-047) */}
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
                12.83:1
              </span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--white)', lineHeight: 1.5 }}>
                Primary text contrast (navy on white). Live site yellow on white was 1.08:1.
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--white)', marginTop: '0.5rem' }}>
                Proven, design/palette.md
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
                <AnimatedCounter to={8} />
              </span>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,.85)', lineHeight: 1.5 }}>
                Issues found on the live site: accessibility, conversion, trust,
                revenue, content, quality, media and copy.
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--white)', marginTop: '0.5rem' }}>
                Proven, crawl of thegyn.org, 15 Oct 2026
              </p>
            </div>

            {/* Lighthouse Performance — from docs/lighthouse/home-mobile.report.json */}
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
              >
                <AnimatedCounter to={lhHomeMobile.perf} />
              </span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--white)', lineHeight: 1.5 }}>
                Lighthouse Performance (mobile). Desktop: <strong>{lhHomeDesktop.perf}</strong>.
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--white)', marginTop: '0.5rem' }}>
                Production build, {lhHomeMobile.date}
              </p>
            </div>

            {/* Lighthouse Accessibility — from docs/lighthouse/home-mobile.report.json */}
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
              >
                <AnimatedCounter to={lhHomeMobile.a11y} />
              </span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--white)', lineHeight: 1.5 }}>
                Lighthouse Accessibility (mobile). Desktop: <strong>{lhHomeDesktop.a11y}</strong>.
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--white)', marginTop: '0.5rem' }}>
                Production build, {lhHomeMobile.date}
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
              Swipe or use ArrowLeft/ArrowRight to browse advisory board members.
              Screen readers see a flat accessible list.
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
              Varied sizes and SDG colours.
            </p>
            <div
              className={styles.tilesGrid}
            >
              {[
                { bg: 'var(--blue-deep)', num: '100', label: 'seats', textCol: 'var(--white)', numCol: 'var(--yellow)' },
                { bg: 'var(--yellow)', num: '4', label: 'focus SDGs', textCol: 'var(--navy-900)', numCol: 'var(--navy-900)' },
                { bg: 'var(--blue-sky)', num: '11', label: 'countries (ambassadors)', textCol: 'var(--navy-900)', numCol: 'var(--navy-900)' },
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
            From a crawl of thegyn.org on 15 Oct 2026. All 8 are addressed in the new build.
          </p>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {LIVE_ISSUES.map((issue) => (
              <li
                key={issue.sev}
                style={{
                  padding: '0.875rem 1rem',
                  background: 'var(--white)',
                  display: 'grid',
                  gridTemplateColumns: '7rem 1fr',
                  gap: '0.75rem',
                  alignItems: 'start',
                }}
              >
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
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--n-700)', lineHeight: 1.55, marginBottom: '0.25rem' }}>
                    {issue.text}
                  </p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--n-700)' }}>{issue.source}</p>
                </div>
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
