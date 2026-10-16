'use client'

import { useEffect, useRef } from 'react'
import { useMediaQuery } from '@/components/premium/useMediaQuery'

/** Detect Safari: can't play webm transparency */
function detectSafari() {
  if (typeof navigator === 'undefined') return false
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

/**
 * GlobeVideo — client component for the animated globe video only.
 * The poster image is rendered server-side in page.tsx (priority Image)
 * so the LCP resource gets a fetchpriority=high preload hint.
 */
export function GlobeVideo() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  // Below 768px: poster only, no video element, no download (brief task 1c)
  const isMobile = !useMediaQuery('(min-width: 768px)')
  const posterOnly = reducedMotion || isMobile

  useEffect(() => {
    const video = videoRef.current
    const wrapper = wrapperRef.current
    if (!video || !wrapper || detectSafari()) return

    const webm = document.createElement('source')
    webm.src = '/renders/glass-globe.webm'
    webm.type = 'video/webm'
    const mp4 = document.createElement('source')
    mp4.src = '/renders/glass-globe.mp4'
    mp4.type = 'video/mp4'
    video.appendChild(webm)
    video.appendChild(mp4)

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.style.display = 'block'
          video.play().catch(() => {/* autoplay blocked, poster stays */})
        } else {
          video.pause()
          video.style.display = 'none'
        }
      },
      { threshold: 0.1 },
    )
    obs.observe(wrapper)
    return () => obs.disconnect()
  }, [posterOnly])

  if (posterOnly) return null

  return (
    <div ref={wrapperRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        poster="/renders/glass-globe-poster.webp"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'none',
        }}
      />
    </div>
  )
}
