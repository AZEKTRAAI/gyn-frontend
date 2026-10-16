'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { accentRuns } from '@/features/home/schema'
import type { HomeContent } from '@/features/home/schema'

interface Props {
  closing: HomeContent['closing']
}

export function ClosingSection({ closing }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const video = videoRef.current
    if (!video || reduced) return

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!video.src && !video.currentSrc) {
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
            if (!isSafari) video.src = '/renders/r3/hands-wheel.webm'
            else video.src = '/renders/r3/hands-wheel.mp4'
          }
          if (e.isIntersecting) video.play().catch(() => {})
          else video.pause()
        })
      },
      { threshold: 0.2 },
    )
    obs.observe(video)
    return () => obs.disconnect()
  }, [])

  const parts = accentRuns(closing.headline)

  return (
    <section
      style={{ background: '#0E1530', color: '#fff', paddingTop: 'clamp(56px,7vw,112px)', paddingBottom: 'clamp(80px,9vw,144px)', overflow: 'hidden', textAlign: 'center' }}
      aria-labelledby="closing-hd"
    >
      {/* Hands video */}
      <div
        aria-hidden="true"
        style={{
          width: 'clamp(260px,55vw,760px)',
          margin: '0 auto clamp(28px,3vw,48px)',
          aspectRatio: '16/9',
        }}
      >
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          poster="/renders/r3/hands-wheel-poster.webp"
          aria-label="Four hands holding the SDG wheel"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            /* edge scrim as mask — arms fade into the dark background */
            maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 70%, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 70%, transparent)',
          }}
        />
      </div>

      {/* Poster headline */}
      <div className="wrap">
        <p
          id="closing-hd"
          style={{
            fontFamily: 'var(--font-host-grotesk, var(--fb))',
            fontSize: 'clamp(3.5rem,12vw,11rem)',
            whiteSpace: 'pre-line', // editors set line breaks in the admin
            lineHeight: 0.92,
            letterSpacing: '-0.03em',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '2.25rem',
            textAlign: 'center',
          }}
        >
          {parts.map((part, i) =>
            part.italic ? (
              <em
                key={i}
                style={{ fontFamily: 'var(--font-bodoni, Georgia, serif)', fontStyle: 'italic', fontWeight: 400 }}
              >
                {part.text}
              </em>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </p>
        <Link
          href={closing.cta.href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#FCC30B',
            color: '#0E1530',
            fontSize: '1rem',
            fontWeight: 600,
            padding: '0.875rem 1.75rem',
            borderRadius: '999px',
            transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)',
          }}
        >
          {closing.cta.label} <span aria-hidden="true">&#8594;</span>
        </Link>
      </div>
    </section>
  )
}
