'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import type { HomeContent } from '@/features/home/schema'

interface Props {
  focus: HomeContent['focus']
}

const SDG_PALETTE: Record<string, { bg: string; text: string }> = {
  '4':  { bg: '#C5192D', text: '#fff' },
  '5':  { bg: '#FF3A21', text: '#0E1530' },
  '9':  { bg: '#FD6925', text: '#0E1530' },
  '13': { bg: '#3F7E44', text: '#fff' },
}

const SDG_RENDERS: Record<string, { poster: string; webm: string; mp4: string; label: string }> = {
  '4':  { poster: '/renders/r3/sdg4-books-poster.webp',   webm: '/renders/r3/sdg4-books.webm',   mp4: '/renders/r3/sdg4-books.mp4',   label: 'Books opening into stairs, representing quality education' },
  '5':  { poster: '/renders/r3/sdg5-balance-poster.webp', webm: '/renders/r3/sdg5-balance.webm', mp4: '/renders/r3/sdg5-balance.mp4', label: 'Scales in balance, representing gender equality' },
  '9':  { poster: '/renders/r3/sdg9-gears-poster.webp',   webm: '/renders/r3/sdg9-gears.webm',   mp4: '/renders/r3/sdg9-gears.mp4',   label: 'Meshing gears representing innovation and infrastructure' },
  '13': { poster: '/renders/r3/sdg13-leaf-poster.webp',   webm: '/renders/r3/sdg13-leaf.webm',   mp4: '/renders/r3/sdg13-leaf.mp4',   label: 'Leaf on globe representing climate action' },
}

function SdgVideo({ sdg }: { sdg: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const video = videoRef.current
    if (!video || reduced) return

    const render = SDG_RENDERS[sdg]
    if (!render) return

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!video.src && !video.currentSrc) {
            // Lazy-set src on first intersection
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
            if (!isSafari && render.webm) video.src = render.webm
            else video.src = render.mp4
          }
          if (e.isIntersecting) video.play().catch(() => {})
          else video.pause()
        })
      },
      { threshold: 0.3 },
    )
    obs.observe(video)
    return () => obs.disconnect()
  }, [sdg])

  const render = SDG_RENDERS[sdg]
  if (!render) return null

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      preload="none"
      poster={render.poster}
      aria-label={render.label}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        scale: '1.22',
        /* edge scrim as a mask to hide codec colour shift at the cove edge */
        maskImage: 'radial-gradient(closest-side, #000 72%, transparent)',
        WebkitMaskImage: 'radial-gradient(closest-side, #000 72%, transparent)',
        display: 'block',
      }}
    >
      <Image src={render.poster} alt="" fill style={{ objectFit: 'contain' }} />
    </video>
  )
}

export function FocusSection({ focus }: Props) {
  return (
    <>
      {/* Intro line */}
      <div style={{ background: '#EEF2F6', paddingBlock: 'clamp(56px,7vw,112px) 0' }}>
        <div className="wrap">
          <p style={{ fontSize: 'clamp(1.1875rem,1.8vw,1.5rem)', color: '#202F60', maxWidth: '72ch' }}>
            {focus.quote}
          </p>
        </div>
      </div>

      {/* SDG chapter wrapper — sticky stacking on desktop */}
      <div style={{ position: 'relative' }} aria-label={focus.heading}>
        {focus.goals.map((goal) => {
          const palette = SDG_PALETTE[goal.sdg] ?? { bg: '#0E1530', text: '#fff' }
          return (
            <section
              key={goal.sdg}
              id={`sdg${goal.sdg}`}
              aria-labelledby={`sdg${goal.sdg}-hd`}
              style={{
                background: palette.bg,
                color: palette.text,
                position: 'sticky',
                top: 0,
                minHeight: '100svh',
                display: 'grid',
                gridTemplateColumns: '40% 60%',
                alignItems: 'center',
              }}
              // mobile: unstick
              className="sdg-chapter"
            >
              {/* Text side */}
              <div style={{ padding: 'clamp(40px,6vw,80px) clamp(24px,4vw,64px)', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.02em' }}>
                  {goal.label}
                </p>
                <h2
                  id={`sdg${goal.sdg}-hd`}
                  style={{
                    fontFamily: 'var(--font-host-grotesk, var(--fb))',
                    fontSize: 'clamp(2.25rem,5vw,4.5rem)',
                    fontWeight: 600,
                    letterSpacing: '-0.012em',
                    lineHeight: 1.06,
                  }}
                >
                  {goal.claim}
                </h2>
                <p style={{ fontSize: 'clamp(1.1875rem,1.8vw,1.5rem)', fontWeight: 400, lineHeight: 1.38 }}>
                  {goal.text}
                </p>
              </div>

              {/* Media side */}
              <div
                aria-hidden="true"
                style={{ position: 'relative', height: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
              >
                <SdgVideo sdg={goal.sdg} />
              </div>
            </section>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .sdg-chapter {
            position: static !important;
            grid-template-columns: 1fr !important;
            min-height: auto !important;
          }
          .sdg-chapter > div:last-child {
            height: auto !important;
            padding-bottom: 20px;
          }
        }
        @media (max-width: 767px) {
          .sdg-chapter > div:first-child {
            padding-bottom: 0 !important;
          }
        }
      `}</style>
    </>
  )
}
