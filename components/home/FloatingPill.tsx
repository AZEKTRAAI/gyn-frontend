'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { HomeContent } from '@/features/home/schema'
import s from './FloatingPill.module.css'

interface Props {
  apply: HomeContent['hero']['primaryCta']
}

/**
 * Fixed "where you are" pill at bottom-centre.
 * Hidden until the user scrolls past the hero; springs in/out.
 * Tracks section[data-name] via IntersectionObserver (rootMargin -45%/-50%).
 * Shows a progress ring (SVG) indicating how far down the page the user is.
 * Squishes slightly on fast scroll. Respects reduced motion.
 */
export function FloatingPill({ apply }: Props) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [sectionName, setSectionName] = useState('Your first global stage')
  const [squish, setSquish] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const squishTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const lastY = useRef(0)

  // scroll: show once past hero, squish on fast scroll, track progress
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const onScroll = () => {
      const y = window.scrollY
      setVisible(y > 80)

      // progress 0-1 through the page
      const max = document.body.scrollHeight - window.innerHeight
      setScrollProgress(max > 0 ? Math.min(y / max, 1) : 0)

      if (!reduced) {
        const v = Math.abs(y - lastY.current)
        lastY.current = y
        if (v > 30) {
          setSquish(true)
          if (squishTimer.current) clearTimeout(squishTimer.current)
          squishTimer.current = setTimeout(() => setSquish(false), 180)
        }
      }
      lastY.current = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (squishTimer.current) clearTimeout(squishTimer.current)
    }
  }, [])

  // IntersectionObserver: track which section is centred in the viewport
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('section[data-name]')
    if (!sections.length) return

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const name = (e.target as HTMLElement).dataset.name
            if (name) setSectionName(name)
          }
        }
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )

    sections.forEach((sec) => obs.observe(sec))
    return () => obs.disconnect()
    // re-scan sections on every page change
  }, [pathname])

  // the admin, the pitch page and booking forms have their own calls to action
  if (/^\/(admin|pitch|sism-(forum-access|self-funded|invitation-letter))/.test(pathname)) return null

  const classes = [s.pill, !visible ? s.hidden : '', squish ? s.squish : ''].filter(Boolean).join(' ')

  // SVG progress ring: r=13, circumference = 2π×13 ≈ 81.68
  const r = 13
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - scrollProgress)

  // Fix for the label split: strip leading "Apply" and its trailing space, then prepend a space
  const applyRest = apply.label.replace(/^Apply\s*/i, '').trim()

  return (
    <nav className={classes} aria-label="Section navigation">
      {/* Progress ring replaces squashed logo; shows how far down the page you are */}
      <span className={s.ring} aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          {/* track */}
          <circle cx="18" cy="18" r={r} stroke="#D3DAE6" strokeWidth="2.5" fill="none" />
          {/* progress arc: starts from top (-90deg rotation) */}
          <circle
            cx="18"
            cy="18"
            r={r}
            stroke="var(--navy, #202F60)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className={s.ringArc}
            transform="rotate(-90 18 18)"
          />
          {/* GYN mark in the centre */}
          <text
            x="18"
            y="22"
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill="var(--navy, #202F60)"
            fontFamily="var(--fd, Impact, sans-serif)"
            letterSpacing="0.02em"
          >
            GYN
          </text>
        </svg>
      </span>

      <div className={s.where} aria-live="polite" aria-atomic="true">
        <small className={s.whereLabel}>You&apos;re at</small>
        {/* key triggers CSS fade-in when section changes */}
        <b className={s.whereName} key={sectionName}>{sectionName}</b>
      </div>

      <Link href={apply.href} className={s.apply}>
        Apply
        {/* clean split: no double/missing space */}
        <span className={s.applyLong}>{applyRest ? ' ' + applyRest : ''}</span>
        <svg className={s.applyArrow} aria-hidden="true" width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M2 6.5h9M7 2.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
    </nav>
  )
}
