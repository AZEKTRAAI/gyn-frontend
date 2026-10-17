'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { HomeContent } from '@/features/home/schema'
import { accentRuns } from '@/features/home/schema'
import s from './Hero.module.css'

interface Props {
  hero: HomeContent['hero']
}

// SDG 17-wedge wheel colours (official)
const SDG_WHEEL = [
  '#E5243B', '#DDA63A', '#4C9F38', '#C5192D', '#FF3A21',
  '#26BDE2', '#FCC30B', '#A21942', '#FD6925', '#DD1367',
  '#FD9D24', '#BF8B2E', '#3F7E44', '#0A97D9', '#56C02B',
  '#00689D', '#19486A',
]

function buildWheelPath(i: number): string {
  const C = 80, RI = 46, RO = 72, ST = 360 / 17, G = 2.4
  const m = -90 + i * ST
  const a0 = (m - ST / 2 + G / 2) * Math.PI / 180
  const a1 = (m + ST / 2 - G / 2) * Math.PI / 180
  const pt = (r: number, a: number) => `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`
  return `M${pt(RO, a0)} A${RO} ${RO} 0 0 1 ${pt(RO, a1)} L${pt(RI, a1)} A${RI} ${RI} 0 0 0 ${pt(RI, a0)}Z`
}

/** Quadratic bezier point at t */
function qbez(p0: number, p1: number, p2: number, t: number) {
  return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2
}

/** Lerp with easing */
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

/** Run a value from 0→1 over `ms` milliseconds, calling `fn(t)` each frame. Returns a cancel fn. */
function tween(ms: number, fn: (t: number) => void, easeIn = false): () => void {
  const t0 = performance.now()
  let raf = 0
  const tick = (now: number) => {
    const raw = Math.min(1, (now - t0) / ms)
    const t = easeIn ? raw * raw : raw
    fn(t)
    if (raw < 1) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}

function wait(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)) }

export function Hero({ hero }: Props) {
  const heroRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const periodRef = useRef<HTMLSpanElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const spotRef = useRef<HTMLDivElement>(null)
  const leadRef = useRef<HTMLParagraphElement>(null)
  const factsRef = useRef<HTMLDivElement>(null)
  const btnsRef = useRef<HTMLDivElement>(null)
  const [leadText, setLeadText] = useState('')
  const [showLead, setShowLead] = useState(false)
  const ranOnce = useRef(false)

  // Pointer-following spotlight
  useEffect(() => {
    const spot = spotRef.current
    const hero = heroRef.current
    if (!spot || !hero) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let auto = true, t = 0, rafId = 0
    const drift = () => {
      if (auto) {
        t += 0.004
        spot.style.setProperty('--mx', `${62 + 22 * Math.cos(t)}%`)
        spot.style.setProperty('--my', `${42 + 18 * Math.sin(t * 1.3)}%`)
      }
      rafId = requestAnimationFrame(drift)
    }
    drift()
    const onMove = (e: PointerEvent) => {
      auto = false
      const r = hero.getBoundingClientRect()
      spot.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
      spot.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
    }
    hero.addEventListener('pointermove', onMove)
    hero.addEventListener('pointerleave', () => { auto = true })
    return () => { cancelAnimationFrame(rafId); hero.removeEventListener('pointermove', onMove) }
  }, [])

  // Opening animation — runs once after fonts load
  const runAnimation = useCallback(async () => {
    if (ranOnce.current) return
    ranOnce.current = true

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const headline = headlineRef.current
    const period = periodRef.current
    const svg = svgRef.current

    if (!headline || !period || !svg) return

    if (reduced) {
      // Show everything immediately for reduced motion
      headline.classList.add(s.go)
      setShowLead(true); setLeadText(hero.lead)
      if (factsRef.current) factsRef.current.style.opacity = '1'
      if (btnsRef.current) btnsRef.current.style.opacity = '1'
      return
    }

    await document.fonts.ready

    const heroEl = heroRef.current!
    const W = heroEl.offsetWidth
    // H reserved for future use
    void heroEl.offsetHeight

    const getPeriodPos = () => {
      const pr = period.getBoundingClientRect()
      const hr = heroEl.getBoundingClientRect()
      return { x: pr.left - hr.left + pr.width / 2, y: pr.top - hr.top + pr.height / 2 }
    }

    const { x: finalX, y: finalY } = getPeriodPos()
    const rulerY = finalY + 6 // ruler line just below the headline baseline
    const startX = W * 0.08, startY = finalY * 0.15
    const cpFall = { x: startX + (finalX - startX) * 0.3, y: startY }
    const apexY = finalY * 0.3, apexX = finalX

    // Hide real period during ball phase
    period.style.opacity = '0'

    // ── Phase 1: ruler fades in (0–0.6s) ──
    const ns = 'http://www.w3.org/2000/svg'

    const ruler = document.createElementNS(ns, 'g') as SVGGElement
    const rulerLine = document.createElementNS(ns, 'line') as SVGLineElement
    rulerLine.setAttribute('x1', String(W * 0.05)); rulerLine.setAttribute('y1', String(rulerY))
    rulerLine.setAttribute('x2', String(W * 0.75)); rulerLine.setAttribute('y2', String(rulerY))
    rulerLine.setAttribute('stroke', 'rgba(255,255,255,0.45)'); rulerLine.setAttribute('stroke-width', '1')
    ruler.appendChild(rulerLine)
    for (let tx = W * 0.05; tx <= W * 0.75; tx += 40) {
      const tick = document.createElementNS(ns, 'line') as SVGLineElement
      tick.setAttribute('x1', String(tx)); tick.setAttribute('y1', String(rulerY - 4))
      tick.setAttribute('x2', String(tx)); tick.setAttribute('y2', String(rulerY + 4))
      tick.setAttribute('stroke', 'rgba(255,255,255,0.45)'); tick.setAttribute('stroke-width', '1')
      ruler.appendChild(tick)
    }
    ruler.setAttribute('opacity', '0')
    svg.appendChild(ruler)

    // SVG path (drawn via stroke-dashoffset)
    const reboundCpY = apexY + (rulerY - apexY) * 0.2
    const pathD = `M${startX},${startY} Q${cpFall.x},${cpFall.y} ${finalX},${rulerY} Q${finalX},${reboundCpY} ${apexX},${apexY}`
    const pathEl = document.createElementNS(ns, 'path') as SVGPathElement
    pathEl.setAttribute('d', pathD); pathEl.setAttribute('fill', 'none')
    pathEl.setAttribute('stroke', '#FCC30B'); pathEl.setAttribute('stroke-width', '2')
    pathEl.setAttribute('opacity', '0.8')
    svg.insertBefore(pathEl, ruler)
    const pathLen = pathEl.getTotalLength()
    pathEl.style.strokeDasharray = String(pathLen)
    pathEl.style.strokeDashoffset = String(pathLen)

    // Defs (glow filter for ball)
    const defs = document.createElementNS(ns, 'defs')
    defs.innerHTML = '<filter id="h-glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    svg.insertBefore(defs, svg.firstChild)

    // Ball
    const ball = document.createElementNS(ns, 'circle') as SVGCircleElement
    ball.setAttribute('cx', String(startX)); ball.setAttribute('cy', String(startY))
    ball.setAttribute('r', '7'); ball.setAttribute('fill', '#FCC30B')
    ball.setAttribute('filter', 'url(#h-glow)')
    svg.appendChild(ball)

    // Diamond at contact point
    const diamond = document.createElementNS(ns, 'rect') as SVGRectElement
    diamond.setAttribute('x', String(finalX - 5)); diamond.setAttribute('y', String(rulerY - 5))
    diamond.setAttribute('width', '10'); diamond.setAttribute('height', '10')
    diamond.setAttribute('fill', '#FCC30B')
    diamond.setAttribute('transform', `rotate(45 ${finalX} ${rulerY})`)
    diamond.setAttribute('opacity', '0')
    svg.appendChild(diamond)

    // Bezier tangent handles at apex
    const handles = document.createElementNS(ns, 'g') as SVGGElement
    handles.setAttribute('opacity', '0')
    const hLen = 40
    const handleLines = [
      { x1: apexX - hLen, y1: apexY, x2: apexX, y2: apexY },
      { x1: apexX, y1: apexY, x2: apexX + hLen, y2: apexY },
    ]
    handleLines.forEach(({ x1, y1, x2, y2 }) => {
      const l = document.createElementNS(ns, 'line') as SVGLineElement
      l.setAttribute('x1', String(x1)); l.setAttribute('y1', String(y1))
      l.setAttribute('x2', String(x2)); l.setAttribute('y2', String(y2))
      l.setAttribute('stroke', 'rgba(252,195,11,0.7)'); l.setAttribute('stroke-width', '1')
      handles.appendChild(l)
    })
    ;[apexX - hLen, apexX + hLen].forEach((dx) => {
      const d = document.createElementNS(ns, 'rect') as SVGRectElement
      d.setAttribute('x', String(dx - 4)); d.setAttribute('y', String(apexY - 4))
      d.setAttribute('width', '8'); d.setAttribute('height', '8')
      d.setAttribute('fill', 'none'); d.setAttribute('stroke', '#FCC30B')
      d.setAttribute('stroke-width', '1.5')
      d.setAttribute('transform', `rotate(45 ${dx} ${apexY})`)
      handles.appendChild(d)
    })
    svg.appendChild(handles)

    // Concentric rings (burst on landing)
    const rings = [0, 1, 2].map((i) => {
      const ring = document.createElementNS(ns, 'circle') as SVGCircleElement
      ring.setAttribute('cx', String(finalX)); ring.setAttribute('cy', String(finalY))
      ring.setAttribute('r', String(6 + i * 8)); ring.setAttribute('fill', 'none')
      ring.setAttribute('stroke', '#FCC30B'); ring.setAttribute('stroke-width', '1.5')
      ring.setAttribute('opacity', '0')
      svg.appendChild(ring)
      return ring
    })

    // ── Phase 1: ruler fades in (600ms) ──
    tween(400, (t) => ruler.setAttribute('opacity', String(t)))
    await wait(600)

    // ── Phase 2: ball falls + path draws (1000ms) ──
    const cancel2 = tween(1000, (t) => {
      const bx = qbez(startX, cpFall.x, finalX, t)
      const by = qbez(startY, cpFall.y, rulerY, t)
      ball.setAttribute('cx', String(bx)); ball.setAttribute('cy', String(by))
      // squash near end
      ball.setAttribute('ry', t > 0.9 ? String(7 * (1 - (t - 0.9) * 5)) : '7')
      pathEl.style.strokeDashoffset = String(pathLen * (1 - t * 0.6))
    }, true /* ease-in */)
    await wait(1000)
    cancel2()
    ball.setAttribute('ry', '7')
    diamond.setAttribute('opacity', '0.8')

    // ── Phase 3: ball rebounds (1100ms), handles snap in at 800ms ──
    const cancel3 = tween(1100, (t) => {
      const bx = qbez(finalX, apexX, apexX, t)
      const by = qbez(rulerY, reboundCpY, apexY, t)
      ball.setAttribute('cx', String(bx)); ball.setAttribute('cy', String(by))
      pathEl.style.strokeDashoffset = String(pathLen * (0.4 - t * 0.4))
    })
    await wait(800)
    cancel3()
    tween(250, (t) => handles.setAttribute('opacity', String(t * 0.8)))
    await wait(300)

    // ── Phase 4: drop to period, headline slams in (400ms) ──
    const { x: landX, y: landY } = getPeriodPos() // re-measure in case of resize
    tween(400, (t) => {
      const ease = t * t // ease-in
      ball.setAttribute('cx', String(lerp(apexX, landX, ease)))
      ball.setAttribute('cy', String(lerp(apexY, landY, ease)))
    }, true)

    // Words slam in staggered
    const words = headline.querySelectorAll<HTMLElement>(`.${s.word}`)
    words.forEach((w, i) => { w.style.transitionDelay = `${i * 80}ms` })
    headline.classList.add(s.go)

    await wait(350)

    // Ball IS the period — rings burst
    period.style.opacity = '0'
    rings.forEach((ring, i) => {
      const baseR = 6 + i * 8
      ring.setAttribute('opacity', '1')
      setTimeout(() => {
        tween(500, (t) => {
          ring.setAttribute('r', String(baseR + t * (28 + i * 14 - baseR)))
          ring.setAttribute('opacity', String(1 - t))
        })
      }, i * 60)
    })

    await wait(300)

    // ── Phase 5: fade overlay, reveal content (500ms) ──
    tween(300, (t) => {
      ruler.setAttribute('opacity', String(1 - t))
      handles.setAttribute('opacity', String((1 - t) * 0.8))
      pathEl.setAttribute('opacity', String((1 - t) * 0.8))
      ball.setAttribute('opacity', String(1 - t))
    })
    await wait(150)
    period.style.opacity = '1'

    // Lead types on (~12ms/char)
    setShowLead(true)
    const full = hero.lead
    for (let i = 0; i <= full.length; i++) {
      setLeadText(full.slice(0, i))
      if (i < full.length) await wait(12)
    }

    // Chips + buttons rise in
    if (factsRef.current) {
      factsRef.current.style.transition = 'opacity 0.4s, transform 0.4s'
      factsRef.current.style.transform = 'translateY(0)'
      factsRef.current.style.opacity = '1'
    }
    await wait(100)
    if (btnsRef.current) {
      btnsRef.current.style.transition = 'opacity 0.4s 0.1s, transform 0.4s 0.1s'
      btnsRef.current.style.transform = 'translateY(0)'
      btnsRef.current.style.opacity = '1'
    }
  }, [hero.lead])

  useEffect(() => {
    document.fonts.ready.then(runAnimation)
  }, [runAnimation])

  const lines = hero.headline.split('\n')

  const renderLine = (line: string, lineIndex: number) => {
    const words = line.split(' ')
    return words.map((word, wi) => {
      const runs = accentRuns(word)
      const isLast = lineIndex === lines.length - 1 && wi === words.length - 1
      return (
        <span key={`${lineIndex}-${wi}`} className={s.word} aria-hidden="true">
          {wi > 0 && ' '}
          {runs.map((run, ri) => {
            if (run.italic) {
              return <em key={ri} className={s.accent}>{run.text}</em>
            }
            if (isLast && ri === runs.length - 1 && run.text.endsWith('.')) {
              return (
                <span key={ri}>
                  {run.text.slice(0, -1)}
                  <span ref={periodRef} className={s.period}>.</span>
                </span>
              )
            }
            return <span key={ri}>{run.text}</span>
          })}
        </span>
      )
    })
  }

  return (
    <section
      ref={heroRef}
      className={s.hero}
      id="top"
      data-name="Your first global stage"
      aria-labelledby="hero-h1"
    >
      {/* SDG wheel */}
      <svg className={s.ring} viewBox="0 0 160 160" aria-hidden="true">
        {SDG_WHEEL.map((fill, i) => (
          <path key={i} d={buildWheelPath(i)} fill={fill} />
        ))}
      </svg>

      {/* Pointer spotlight scrim */}
      <div ref={spotRef} className={s.spot} aria-hidden="true" />

      {/* Animation overlay (ruler, ball, path, handles) */}
      <svg
        ref={svgRef}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
      />

      <div className={`wrap ${s.heroText}`}>
        {/* Headline — words in DOM from the start (opacity 0); LCP paint is not delayed */}
        <h1 id="hero-h1" ref={headlineRef} className={s.headline}>
          <span className="sr-only">{hero.headline.replace(/\*/g, '').replace(/\n/g, ' ')}</span>
          {lines.map((line, li) => (
            <span key={li} aria-hidden="true">
              {renderLine(line, li)}
              {li < lines.length - 1 && <br />}
            </span>
          ))}
        </h1>

        <p
          ref={leadRef}
          className={s.lead}
          style={{ opacity: showLead ? undefined : 0 }}
        >
          {leadText || ' '}
          <span className="sr-only">{hero.lead}</span>
        </p>

        <div
          ref={factsRef}
          className={s.factsRow}
          style={{ opacity: 0, transform: 'translateY(16px)' }}
        >
          {hero.facts.map((f, i) => (
            <span key={i} className={`${s.chip}${f.hot ? ` ${s.chipHot}` : ''}`}>
              {f.label}
            </span>
          ))}
        </div>

        <div
          ref={btnsRef}
          className={s.btns}
          style={{ opacity: 0, transform: 'translateY(12px)' }}
        >
          <Link href={hero.primaryCta.href} className="btn btn-y">
            {hero.primaryCta.label} <span aria-hidden="true">&#8594;</span>
          </Link>
          {hero.secondaryCta.label && (
            <Link href={hero.secondaryCta.href} className="btn btn-ow">
              {hero.secondaryCta.label}
            </Link>
          )}
        </div>
      </div>

      {/* Film strip */}
      <div
        className={s.film}
        aria-label="Delegates at the FutureMinds Summit, Bangkok, July 2026"
        role="img"
      >
        <div className={s.track}>
          {[...hero.film, ...hero.film].map((item, i) => (
            <figure key={i} className={s.filmFigure}>
              <Image
                src={item.image.src}
                alt={item.image.alt}
                fill
                sizes="(max-width: 860px) 200px, 320px"
                style={{ objectFit: 'cover' }}
                priority={i < 3}
              />
              <figcaption className={s.filmCaption}>{item.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
