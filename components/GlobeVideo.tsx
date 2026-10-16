'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { useMediaQuery } from '@/components/premium/useMediaQuery'

/** Detect Safari: can't play webm transparency */
function detectSafari() {
  if (typeof navigator === 'undefined') return false
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

/** Detect reduced-motion preference */
function detectReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function GlobeVideo() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const isSafari = detectSafari()
  const reducedMotion = detectReducedMotion()
  // Below 768px: poster only, no video element, no download (brief task 1c)
  const isMobile = !useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    const video = videoRef.current
    const wrapper = wrapperRef.current
    if (!video || !wrapper) return

    // Set sources now so preload="none" was honoured before this point
    const webm = document.createElement('source')
    webm.src = '/renders/glass-globe.webm'
    webm.type = 'video/webm'
    const mp4 = document.createElement('source')
    mp4.src = '/renders/glass-globe.mp4'
    mp4.type = 'video/mp4'
    video.appendChild(webm)
    video.appendChild(mp4)

    // Observe the *visible wrapper*, not the video element (which starts display:none)
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
  }, [])

  // Poster only: Safari (no webm), reduced motion, mobile (< 768px), or server
  const posterOnly = isSafari || reducedMotion || isMobile

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: 'min(100%, 600px)', aspectRatio: '1' }}>
      {/* Real delegate photo behind / beside the globe (red team fix #4) */}
      {/* The poster image of the globe sits over the delegate photo */}
      <Image
        src="/renders/glass-globe-poster.webp"
        alt="A glass globe with 17 SDG-coloured planets in orbit"
        width={500}
        height={500}
        priority
        sizes="(max-width: 768px) 70vw, 500px"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
      {!posterOnly && (
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
      )}
      {/* On mobile below 768px: never download the video (poster is shown by default) */}
    </div>
  )
}
