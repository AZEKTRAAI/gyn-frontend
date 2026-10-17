'use client'

// Muted decorative loop: shows the poster first, attaches the video source only when it nears the
// viewport, plays only while visible, and never plays with reduced motion (the poster stays).
import { useEffect, useRef } from 'react'

export function LoopVideo({ base, style, className }: { base: string; style?: React.CSSProperties; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!video.currentSrc && !video.src) {
          // WebM where it plays; Safari gets the H.264 copy
          video.src = video.canPlayType('video/webm; codecs="vp9"') ? `${base}.webm` : `${base}.mp4`
        }
        if (e.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.2, rootMargin: '200px 0px' },
    )
    obs.observe(video)
    return () => obs.disconnect()
  }, [base])

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      poster={`${base}-poster.webp`}
      aria-hidden="true"
      className={className}
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain', ...style }}
    />
  )
}
