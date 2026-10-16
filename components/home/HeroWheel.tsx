'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

const TOTAL_FRAMES = 72

/**
 * Scroll-scrubbed canvas animation for the hero SDG wheel.
 * Desktop ≥1024px only (parent passes isMobile=true to short-circuit on mobile).
 * Frames load after first paint so they do not block LCP.
 * Reduced motion: poster only, no animation.
 */
export function HeroWheel({ posterSrc = '/renders/r3/hero-wheel-poster.webp' }: { posterSrc?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const posterRef = useRef<HTMLImageElement>(null)
  const framesRef = useRef<HTMLImageElement[]>([])
  const loadedRef = useRef(0)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isDesktop = window.innerWidth >= 1024
    if (reduced || !isDesktop) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const poster = posterRef.current
    const wrap = wrapRef.current
    if (!canvas || !ctx || !wrap) return

    const drawFrame = (img: HTMLImageElement) => {
      if (!img.complete) return
      canvas.width = img.naturalWidth || 900
      canvas.height = img.naturalHeight || 900
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }

    // Load frames after first paint so they don't block LCP
    requestAnimationFrame(() => requestAnimationFrame(() => {
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new window.Image()
        const num = String(i).padStart(4, '0')
        img.src = `/renders/r3/hero-wheel-seq/${num}.webp`
        framesRef.current[i - 1] = img
        img.onload = () => {
          loadedRef.current++
          if (loadedRef.current === 1) {
            // First frame ready: show canvas, hide poster
            canvas.style.opacity = '1'
            if (poster) poster.style.opacity = '0'
            drawFrame(img)
          }
        }
      }
    }))

    // Scroll handler: scrub frames + lift wheel
    const heroEl = wrap.closest<HTMLElement>('.home-hero')
    const heroTextEl = heroEl?.querySelector<HTMLElement>('.home-hero-text')

    const onScroll = () => {
      if (!heroEl) return
      const heroRect = heroEl.getBoundingClientRect()
      const heroH = heroEl.offsetHeight

      // Pin zone: hero top scrolls to top, progress goes 0..1 over 2*heroH
      const scrolledPast = -heroRect.top
      if (scrolledPast < 0 || scrolledPast > heroH * 2) return

      const progress = Math.min(scrolledPast / (heroH * 2), 1)

      // Headline: fade up over first 38%
      if (heroTextEl) {
        const p = Math.min(progress / 0.38, 1)
        heroTextEl.style.opacity = String(Math.max(1 - p * 1.1, 0))
        heroTextEl.style.transform = `translateY(${-64 * p}px)`
      }

      // Wheel: rise to centre over first 50%
      const q = Math.min(progress / 0.5, 1)
      const wrapTop = wrap.offsetTop
      const wrapH = wrap.offsetHeight
      const lift = wrapTop - Math.max((window.innerHeight - wrapH) / 2, 72)
      wrap.style.transform = `translateY(${-lift * q}px)`

      // Canvas frame scrub
      const idx = Math.min(Math.floor(progress * (TOTAL_FRAMES - 1)), TOTAL_FRAMES - 1)
      const frame = framesRef.current[idx]
      if (frame?.complete) {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = requestAnimationFrame(() => drawFrame(frame))
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: 'relative',
        flexShrink: 0,
        width: 'clamp(380px, 54vw, 720px)',
        aspectRatio: '1/1',
        marginTop: 'calc(clamp(380px, 54vw, 720px) * -.1)',
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        width={900}
        height={900}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block', opacity: 0, transition: 'opacity 300ms' }}
      />
      <Image
        ref={posterRef}
        src={posterSrc}
        alt=""
        fill
        sizes="(max-width: 1023px) 88vw, 54vw"
        style={{ objectFit: 'contain', transition: 'opacity 500ms' }}
        priority
      />
    </div>
  )
}
