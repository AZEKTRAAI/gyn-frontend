'use client'

// Kinetic headline: words land one per beat when the line scrolls into view, the *accent* words
// turn to the accent colour last, and the whole line settles back from a slight zoom (a small "pull-back").
// Works on any admin-edited text. Without JS or with reduced motion the text is simply shown, already coloured.
import { useEffect, useRef, useState } from 'react'
import { accentRuns } from '@/features/home/schema'
import styles from './WordBuild.module.css'

export function WordBuild({ text, accent, beatMs = 150 }: { text: string; accent: string; beatMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [phase, setPhase] = useState<'static' | 'armed' | 'play'>('static')

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hide words only once JS is running
    setPhase('armed')
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        setPhase('play')
        obs.disconnect()
      },
      { threshold: 0.4 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  let n = 0
  const words = accentRuns(text).flatMap((run, r) =>
    run.text.split(/(\s+)/).map((tok, t) =>
      tok.trim() === '' ? (
        tok
      ) : (
        <span
          key={`${r}-${t}`}
          className={run.italic ? `${styles.w} ${styles.accent}` : styles.w}
          style={{ ['--i' as string]: n++ }}
        >
          {run.italic ? <em className="accent">{tok}</em> : tok}
        </span>
      ),
    ),
  )

  return (
    <span
      ref={ref}
      className={`${styles.line} ${phase !== 'static' ? styles[phase] : ''}`}
      style={{ ['--accent' as string]: accent, ['--beat' as string]: `${beatMs}ms`, ['--n' as string]: n }}
    >
      {words}
    </span>
  )
}
