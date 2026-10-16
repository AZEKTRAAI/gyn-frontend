'use client'

/**
 * LenisScroll — initialises Lenis smooth scroll in the root layout.
 * Skipped entirely under prefers-reduced-motion.
 * Destroyed on unmount so hot-reload works correctly.
 */
import { useEffect } from 'react'
import Lenis from 'lenis'

export function LenisScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true })
    return () => lenis.destroy()
  }, [])
  return null
}
