'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { HomeContent } from '@/features/home/schema'
import s from './FloatingPill.module.css'

interface Props {
  apply: HomeContent['hero']['primaryCta']
}

/**
 * Fixed "where you are" pill at bottom-centre.
 * Hidden until the user scrolls past the hero; springs in/out.
 * Tracks section[data-name] via IntersectionObserver (rootMargin -45%/-50%).
 * Squishes slightly on fast scroll. Respects reduced motion.
 */
export function FloatingPill({ apply }: Props) {
  const [visible, setVisible] = useState(false)
  const [sectionName, setSectionName] = useState('Your first global stage')
  const [squish, setSquish] = useState(false)
  const squishTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const lastY = useRef(0)

  // scroll: show once past hero, squish on fast scroll
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const onScroll = () => {
      const y = window.scrollY
      setVisible(y > 80)

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

    sections.forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [])

  const classes = [s.pill, !visible ? s.hidden : '', squish ? s.squish : ''].filter(Boolean).join(' ')

  return (
    <nav className={classes} aria-label="Section navigation">
      <span className={s.logo} aria-hidden="true">
        <Image
          src="/media/logos/gyn-logo.png"
          alt=""
          width={64}
          height={64}
          style={{ height: '26px', width: 'auto' }}
        />
      </span>
      <div className={s.where} aria-live="polite" aria-atomic="true">
        <small className={s.whereLabel}>You&apos;re at</small>
        <b className={s.whereName}>{sectionName}</b>
      </div>
      <Link href={apply.href} className={s.apply}>
        Apply<span className={s.applyLong}>{apply.label.replace(/^Apply\s*/i, ' ').trim() || ' now'}</span>
      </Link>
    </nav>
  )
}
