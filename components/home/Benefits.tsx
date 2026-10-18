'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { HomeContent } from '@/features/home/schema'
import { accentRuns, SDG_COLOURS } from '@/features/home/schema'
import s from './Benefits.module.css'

interface Props {
  data: HomeContent['benefits']
}

/** Parses a mixed string like "$1,000" into { prefix: "$", n: 1000 } or null if no number. */
function parseCountable(big: string): { prefix: string; suffix: string; n: number } | null {
  const m = big.match(/^([^0-9]*)([0-9][0-9,.]*)([^0-9]*)$/)
  if (!m) return null
  const n = parseInt(m[2].replace(/[^0-9]/g, ''), 10)
  if (isNaN(n)) return null
  return { prefix: m[1], suffix: m[3], n }
}

function useCountUp(target: number, running: boolean, reduced: boolean) {
  const [val, setVal] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    if (!running) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (reduced) { setVal(target); return }
    const t0 = performance.now()
    const dur = 1400
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      const v = Math.round(target * (1 - Math.pow(1 - p, 3)))
      setVal(v)
      if (p < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, running, reduced])

  return val
}

interface TileNumberProps {
  big: string
  running: boolean
  reduced: boolean
}

function TileNumber({ big, running, reduced }: TileNumberProps) {
  const parsed = parseCountable(big)
  const count = useCountUp(parsed?.n ?? 0, running && !!parsed, reduced)

  if (!parsed) {
    return <span className={`${s.n} ${s.nWord}`}>{big}</span>
  }

  return (
    <span className={s.n}>
      {parsed.prefix}
      {count.toLocaleString('en-US')}
      {parsed.suffix}
    </span>
  )
}

export function Benefits({ data }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const introRef = useRef<HTMLParagraphElement>(null)
  const bentoRef = useRef<HTMLDivElement>(null)
  const [counting, setCounting] = useState(false)
  const [reduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  // Wipe-in heading: clip-path counts as zero area in Chrome, so use threshold 0 + rootMargin
  useEffect(() => {
    const heading = headingRef.current
    if (!heading) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { heading.classList.add(s.in); obs.unobserve(heading) }
        }
      },
      { threshold: 0, rootMargin: '0px 0px -12% 0px' },
    )
    obs.observe(heading)
    return () => obs.disconnect()
  }, [])

  // Intro rise-in
  useEffect(() => {
    const el = introRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { el.classList.add(s.in); obs.unobserve(el) }
        }
      },
      { threshold: 0.15 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Count-up trigger when bento is visible
  useEffect(() => {
    const bento = bentoRef.current
    if (!bento) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setCounting(true); obs.unobserve(bento) }
        }
      },
      { threshold: 0.3 },
    )
    obs.observe(bento)
    return () => obs.disconnect()
  }, [])

  // Pointer-tilt on tiles
  useEffect(() => {
    if (reduced) return
    const tiles = bentoRef.current?.querySelectorAll<HTMLElement>(`.${s.tile}`)
    if (!tiles) return
    const handlers: [HTMLElement, (e: PointerEvent) => void, () => void][] = []
    tiles.forEach((t) => {
      const onMove = (e: PointerEvent) => {
        const r = t.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        t.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(6px)`
      }
      const onLeave = () => { t.style.transform = '' }
      t.addEventListener('pointermove', onMove)
      t.addEventListener('pointerleave', onLeave)
      handlers.push([t, onMove, onLeave])
    })
    return () => {
      handlers.forEach(([t, onMove, onLeave]) => {
        t.removeEventListener('pointermove', onMove)
        t.removeEventListener('pointerleave', onLeave)
      })
    }
  }, [reduced])

  const headingRuns = accentRuns(data.heading)

  return (
    <section
      className={s.section}
      id="get"
      data-name={data.kicker}
      aria-labelledby="benefits-h2"
    >
      <div className="wrap">
        <div className={s.head}>
          <div>
            <p className={s.kicker}>{data.kicker}</p>
            <h2 id="benefits-h2" ref={headingRef} className={s.heading}>
              {headingRuns.map((r, i) =>
                r.italic ? (
                  <em key={i} className={s.accent}>{r.text}</em>
                ) : (
                  <span key={i}>{r.text}</span>
                ),
              )}
            </h2>
          </div>
          <p ref={introRef} className={s.intro}>
            {data.intro}
          </p>
        </div>

        <div ref={bentoRef} className={s.bento}>
          {/* Big photo tile */}
          <div className={`${s.tile} ${s.photoTile}`}>
            <Image
              src={data.photo.src}
              alt={data.photo.alt}
              fill
              sizes="(max-width: 760px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
            />
            <TileNumber big={data.photoBig} running={counting} reduced={reduced} />
            <p className={s.tileText}>{data.photoText}</p>
          </div>

          {/* Four SDG tiles */}
          {data.tiles.map((tile, i) => {
            const colours = SDG_COLOURS[tile.sdg]
            return (
              <div
                key={i}
                className={`${s.tile} ${colours.fg === '#0E1530' ? s.inkText : ''}${tile.render ? ` ${s.hasObj}` : ''}`}
                style={{ background: colours.bg }}
              >
                {tile.render && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tile.render} alt="" className={s.obj} aria-hidden="true" />
                )}
                <TileNumber big={tile.big} running={counting} reduced={reduced} />
                <p className={s.tileText}>{tile.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
