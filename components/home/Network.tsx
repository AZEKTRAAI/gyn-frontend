'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { HomeContent } from '@/features/home/schema'
import { accentRuns } from '@/features/home/schema'
import { MAP_DATA } from './map-data'
import s from './Network.module.css'

interface Props {
  data: HomeContent['network']
  /** dark: navy band (About page). light: white page with glass cards (home, event pages). */
  tone?: 'dark' | 'light'
}

// The map is cropped to where people live: the poles are empty and only shrink the continents.
const LAT_TOP = 78, LAT_BOT = -56
const W = 720, H = Math.round(((LAT_TOP - LAT_BOT) / 360) * W)
const CYCLE_MS = 2800

/** lon/lat → pixel on the W×H canvas */
function lonLatToPx(lon: number, lat: number): [number, number] {
  return [((lon + 180) / 360) * W, ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * H]
}
/** lon/lat → CSS % position over the canvas */
function pct(lon: number, lat: number) {
  return { left: `${((lon + 180) / 360) * 100}%`, top: `${((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * 100}%` }
}

/** Quadratic bezier control point: above the chord, so routes bow like flight paths */
function arcControl(x1: number, y1: number, x2: number, y2: number): [number, number] {
  return [(x1 + x2) / 2, Math.min(y1, y2) - Math.abs(x1 - x2) * 0.22 - 16]
}

export function Network({ data, tone = 'dark' }: Props) {
  const light = tone === 'light'
  const headingRef = useRef<HTMLHeadingElement>(null)
  const introRef = useRef<HTMLParagraphElement>(null)
  const btnsRef = useRef<HTMLDivElement>(null)
  const mapWrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const firstAway = data.people.findIndex((p) => p.lon !== data.hub.lon || p.lat !== data.hub.lat)
  const [activePin, setActivePin] = useState(Math.max(firstAway, 0))
  const activeRef = useRef(activePin)
  const pausedRef = useRef(false)
  const rafRef = useRef(0)
  const isVisibleRef = useRef(false)
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const [hubX, hubY] = lonLatToPx(data.hub.lon, data.hub.lat)
  const routes = useMemo(
    () => data.people.map((p, i) => ({ i, p })).filter(({ p }) => p.lon !== data.hub.lon || p.lat !== data.hub.lat),
    [data.people, data.hub.lon, data.hub.lat],
  )

  // Land dots, drawn once at screen resolution so they stay crisp on phones and retina screens
  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const base = document.createElement('canvas')
    base.width = W * dpr; base.height = H * dpr
    const bx = base.getContext('2d')!
    bx.scale(dpr, dpr)
    const { cols, rows, land } = MAP_DATA
    const bytes = Uint8Array.from(atob(land), (ch) => ch.charCodeAt(0))
    const cw = W / cols
    const degPerRow = 180 / rows
    bx.fillStyle = light ? 'rgba(45,63,224,.30)' : 'rgba(255,255,255,.30)'
    for (let i = 0; i < cols * rows; i++) {
      if (!((bytes[i >> 3] >> (7 - (i & 7))) & 1)) continue
      const lat = 90 - (Math.floor(i / cols) + 0.5) * degPerRow
      if (lat > LAT_TOP || lat < LAT_BOT) continue
      const y = ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * H
      bx.beginPath()
      bx.arc((i % cols) * cw + cw / 2, y, 1.45, 0, 7)
      bx.fill()
    }
    baseCanvasRef.current = base
    const canvas = canvasRef.current
    if (canvas) { canvas.width = W * dpr; canvas.height = H * dpr }
  }, [light])

  // Routes to the hub, each with a glowing dot travelling toward it; the selected ambassador's route is highlighted
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ink = light ? '45,63,224' : '255,255,255'
    let t0 = performance.now()
    const draw = (now: number) => {
      const canvas = canvasRef.current
      const base = baseCanvasRef.current
      if (!canvas || !base) return
      const ctx = canvas.getContext('2d')!
      const dpr = canvas.width / W
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(base, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      routes.forEach(({ i, p }, n) => {
        const [sx, sy] = lonLatToPx(p.lon, p.lat)
        const [cx, cy] = arcControl(sx, sy, hubX, hubY)
        const on = i === activeRef.current
        const g = ctx.createLinearGradient(sx, sy, hubX, hubY)
        g.addColorStop(0, `rgba(${ink},${on ? 0.25 : 0.06})`)
        g.addColorStop(1, `rgba(${ink},${on ? 0.95 : 0.38})`)
        ctx.strokeStyle = g
        ctx.lineWidth = on ? 2 : 1.2
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.quadraticCurveTo(cx, cy, hubX, hubY)
        ctx.stroke()

        if (reduced) return
        // travelling dot: staggered per route, eased so it slows as it lands
        const t = (((now - t0) / 2600 + n * 0.37) % 1)
        const e = 1 - (1 - t) * (1 - t)
        const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * hubX
        const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * hubY
        ctx.save()
        ctx.globalAlpha = Math.sin(Math.PI * t)
        ctx.shadowColor = 'rgba(198,244,50,.9)'
        ctx.shadowBlur = 8
        ctx.fillStyle = on ? '#C6F432' : light ? 'rgba(45,63,224,.9)' : '#C6F432'
        ctx.beginPath()
        ctx.arc(x, y, on ? 2.6 : 1.9, 0, 7)
        ctx.fill()
        ctx.restore()
      })
    }

    const loop = (now: number) => {
      if (isVisibleRef.current || reduced) draw(now)
      if (!reduced) rafRef.current = requestAnimationFrame(loop)
    }
    t0 = performance.now()
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [routes, hubX, hubY, light])

  // Stop drawing when off-screen
  useEffect(() => {
    const el = mapWrapRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => { isVisibleRef.current = entries[0].isIntersecting }, { threshold: 0 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Walk through the ambassadors on its own; hovering or focusing the map pauses it
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || routes.length < 2) return
    const id = setInterval(() => {
      if (pausedRef.current || !isVisibleRef.current) return
      const at = routes.findIndex((r) => r.i === activeRef.current)
      setActivePin(routes[(at + 1) % routes.length].i)
    }, CYCLE_MS)
    return () => clearInterval(id)
  }, [routes])

  // Reveal animations
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    for (const ref of [headingRef, introRef, btnsRef, mapWrapRef]) {
      const el = ref.current
      if (!el) continue
      const obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) { el.classList.add(s.in); obs.unobserve(el) }
        },
        { threshold: 0, rootMargin: '0px 0px -12% 0px' },
      )
      obs.observe(el)
      observers.push(obs)
    }
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  // Position the popup over the active pin, clamped inside the map
  useEffect(() => {
    activeRef.current = activePin
    const popup = popupRef.current
    const wrap = mapWrapRef.current
    const p = data.people[activePin]
    if (!popup || !wrap || !p) return
    // computed from the target spot (not the popup's current, still-moving box) so it always lands inside the map
    const place = () => {
      const mw = wrap.clientWidth, mh = wrap.clientHeight
      const pw = popup.offsetWidth, ph = popup.offsetHeight
      const [px, py] = lonLatToPx(p.lon, p.lat).map((v, k) => v * (k ? mh / H : mw / W))
      const x = Math.min(Math.max(px - pw / 2, 4), mw - pw - 4)
      const above = py - ph - 14
      popup.style.left = `${x}px`
      popup.style.top = `${above >= 4 ? above : Math.min(py + 14, mh - ph - 4)}px`
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [activePin, data.people])

  const headingRuns = accentRuns(data.heading)
  const activeAmbassador = data.people[activePin]
  const pause = () => { pausedRef.current = true }
  const resume = () => { pausedRef.current = false }

  return (
    <section className={`${s.section} ${light ? s.light : ''}`} id="network" data-name="Ambassadors in 11 countries" aria-labelledby="network-h2">
      <div className={`wrap ${s.grid}`}>
        <div>
          <h2 id="network-h2" ref={headingRef} className={s.heading}>
            {headingRuns.map((r, i) =>
              r.italic ? <em key={i} className={light ? 'hl' : s.accent}>{r.text}</em> : <span key={i}>{r.text}</span>,
            )}
          </h2>
          <p ref={introRef} className={s.intro}>{data.intro}</p>
          <div ref={btnsRef} className={s.btns}>
            <Link href={data.primaryCta.href} className="btn btn-y">
              {data.primaryCta.label} <span aria-hidden="true">&#8594;</span>
            </Link>
          </div>
        </div>

        <div className={s.mapGlass}>
          <div ref={mapWrapRef} className={s.mapWrap} onMouseEnter={pause} onMouseLeave={resume} onFocus={pause} onBlur={resume}>
            <canvas ref={canvasRef} className={s.mapCanvas} width={W} height={H} style={{ aspectRatio: `${W} / ${H}` }} aria-hidden="true" />

            {data.people.map((p, i) => {
              const isHub = p.lon === data.hub.lon && p.lat === data.hub.lat
              if (isHub) return null
              return (
                <button
                  key={i}
                  type="button"
                  className={`${s.pin} ${activePin === i ? s.on : ''}`}
                  style={pct(p.lon, p.lat)}
                  aria-label={`${p.name}, ${p.country}`}
                  aria-pressed={activePin === i}
                  onClick={() => setActivePin(i)}
                  onMouseEnter={() => setActivePin(i)}
                  onFocus={() => setActivePin(i)}
                />
              )
            })}

            {/* Destination: the summit city, always labelled */}
            <span className={s.hub} style={pct(data.hub.lon, data.hub.lat)} aria-hidden="true">
              <span className={s.hubDot} />
              <span className={s.hubLabel}>{data.hub.label}</span>
            </span>

            {/* visual only: it changes by itself every few seconds, and each pin already carries the name for screen readers */}
            <div ref={popupRef} className={`${s.popup} ${light ? 'glass' : ''}`} aria-hidden="true">
              {activeAmbassador && (
                <>
                  <Image
                    key={activeAmbassador.photo.src}
                    src={activeAmbassador.photo.src}
                    alt={activeAmbassador.photo.alt}
                    width={44}
                    height={44}
                    className={s.popupImg}
                  />
                  <span className={s.popupText} key={activeAmbassador.name}>
                    <b className={s.popupName}>{activeAmbassador.name}</b>
                    <small className={s.popupCountry}>{activeAmbassador.country}</small>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
