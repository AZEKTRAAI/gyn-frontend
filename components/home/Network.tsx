'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { HomeContent } from '@/features/home/schema'
import { accentRuns } from '@/features/home/schema'
import { MAP_DATA } from './map-data'
import s from './Network.module.css'

interface Props {
  data: HomeContent['network']
}

const W = 720, H = 360

/** lon/lat → pixel on the 720×360 canvas */
function lonLatToPx(lon: number, lat: number): [number, number] {
  return [((lon + 180) / 360) * W, ((90 - lat) / 180) * H]
}

/** Quadratic bezier midpoint for arc control: above the chord */
function arcControl(x1: number, y1: number, x2: number, y2: number): [number, number] {
  const mx = (x1 + x2) / 2
  const my = Math.min(y1, y2) - Math.abs(x1 - x2) * 0.22 - 20
  return [mx, my]
}

export function Network({ data }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const introRef = useRef<HTMLParagraphElement>(null)
  const ambListRef = useRef<HTMLDivElement>(null)
  const btnsRef = useRef<HTMLDivElement>(null)
  const mapWrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [activePin, setActivePin] = useState(5) // Lim Pei En (KL) shown first
  const rafRef = useRef(0)
  const isVisibleRef = useRef(false)
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const reduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  const [hubX, hubY] = lonLatToPx(data.hub.lon, data.hub.lat)

  // Build the offscreen land-dot canvas once
  useEffect(() => {
    const base = document.createElement('canvas')
    base.width = W; base.height = H
    const bx = base.getContext('2d')!
    const { cols, rows, land } = MAP_DATA
    const bytes = Uint8Array.from(atob(land), (ch) => ch.charCodeAt(0))
    const cw = W / cols, ch = H / rows
    bx.fillStyle = 'rgba(255,255,255,.28)'
    for (let i = 0; i < cols * rows; i++) {
      if ((bytes[i >> 3] >> (7 - (i & 7))) & 1) {
        bx.beginPath()
        bx.arc((i % cols) * cw + cw / 2, Math.floor(i / cols) * ch + ch / 2, 1.6, 0, 7)
        bx.fill()
      }
    }
    baseCanvasRef.current = base
  }, [])

  // Draw arcs each frame (animated dashoffset)
  useEffect(() => {
    let off = 0
    const draw = () => {
      const canvas = canvasRef.current
      const base = baseCanvasRef.current
      if (!canvas || !base) return
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, W, H)
      ctx.drawImage(base, 0, 0)

      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 6])
      ctx.lineDashOffset = -off
      ctx.strokeStyle = 'rgba(252,195,11,.75)'

      data.people.forEach((p) => {
        if (p.lon === data.hub.lon && p.lat === data.hub.lat) return
        const [sx, sy] = lonLatToPx(p.lon, p.lat)
        const [cx, cy] = arcControl(sx, sy, hubX, hubY)
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.quadraticCurveTo(cx, cy, hubX, hubY)
        ctx.stroke()
      })
      ctx.setLineDash([])
    }

    draw()
    if (!reduced) {
      const loop = () => {
        if (isVisibleRef.current) { off += 0.35; draw() }
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    return () => cancelAnimationFrame(rafRef.current)
  }, [data.people, data.hub, hubX, hubY, reduced])

  // Stop rAF when off-screen
  useEffect(() => {
    const el = mapWrapRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => { isVisibleRef.current = entries[0].isIntersecting },
      { threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Reveal animations
  useEffect(() => {
    const targets: React.RefObject<Element | null>[] = [
      headingRef, introRef, ambListRef, btnsRef, mapWrapRef,
    ]
    const observers: IntersectionObserver[] = []

    targets.forEach((ref) => {
      const el = ref.current
      if (!el) return
      const obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) { el.classList.add(s.in); obs.unobserve(el) }
          }
        },
        { threshold: 0, rootMargin: '0px 0px -12% 0px' },
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  // Position popup based on active pin
  const positionPopup = (index: number) => {
    const popup = popupRef.current
    if (!popup) return
    const p = data.people[index]
    const left = ((p.lon + 180) / 360 * 100)
    const top = ((90 - p.lat) / 180 * 100)
    popup.style.left = `${left}%`
    popup.style.top = `${top}%`
    const flipX = p.lon > 110 ? '-88%' : p.lon < -60 ? '-12%' : '-50%'
    popup.style.transform = `translate(${flipX}, calc(-100% - 16px))`
  }

  const handlePinClick = (index: number) => {
    setActivePin(index)
    positionPopup(index)
  }

  useEffect(() => {
    positionPopup(activePin)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePin])

  const headingRuns = accentRuns(data.heading)
  const activeAmbassador = data.people[activePin]

  return (
    <section
      className={s.section}
      id="network"
      data-name="Ambassadors in 11 countries"
      aria-labelledby="network-h2"
    >
      <div className={`wrap ${s.grid}`}>
        <div>
          <p className={s.kicker}>{data.kicker}</p>
          <h2 id="network-h2" ref={headingRef} className={s.heading}>
            {headingRuns.map((r, i) =>
              r.italic ? (
                <em key={i} className={s.accent}>{r.text}</em>
              ) : (
                <span key={i}>{r.text}</span>
              ),
            )}
          </h2>
          <p ref={introRef} className={s.intro}>{data.intro}</p>

          <div ref={ambListRef} className={s.ambList} aria-label="Ambassadors">
            {data.people.map((p, i) => (
              <button
                key={i}
                className={`${s.ambChip} ${activePin === i ? s.on : ''}`}
                onClick={() => handlePinClick(i)}
                aria-pressed={activePin === i}
              >
                <Image
                  src={p.photo.src}
                  alt=""
                  width={26}
                  height={26}
                  style={{ borderRadius: '50%', objectFit: 'cover', width: 26, height: 26 }}
                />
                {p.name}, {p.country}
              </button>
            ))}
          </div>

          <div ref={btnsRef} className={s.btns}>
            <Link href={data.primaryCta.href} className="btn btn-y">
              {data.primaryCta.label} <span aria-hidden="true">&#8594;</span>
            </Link>
            {data.secondaryCta.label && (
              <Link href={data.secondaryCta.href} className="btn btn-ow">
                {data.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>

        <div ref={mapWrapRef} className={s.mapWrap}>
          <canvas
            ref={canvasRef}
            className={s.mapCanvas}
            width={W}
            height={H}
            aria-hidden="true"
          />

          {/* Pins overlaid via absolute % positions */}
          {data.people.map((p, i) => {
            const left = `${((p.lon + 180) / 360) * 100}%`
            const top = `${((90 - p.lat) / 180) * 100}%`
            const isHub = p.lon === data.hub.lon && p.lat === data.hub.lat
            return (
              <button
                key={i}
                className={`${s.pin} ${isHub ? s.pinHub : ''} ${activePin === i ? s.on : ''}`}
                style={{ left, top, ['--d' as string]: `${i * 0.2}s` }}
                aria-label={`${p.name}, ${p.country}`}
                onClick={() => handlePinClick(i)}
                onMouseEnter={() => handlePinClick(i)}
                onFocus={() => handlePinClick(i)}
              />
            )
          })}

          {/* Hub pin */}
          <button
            className={`${s.pin} ${s.pinHub}`}
            style={{ left: `${((data.hub.lon + 180) / 360) * 100}%`, top: `${((90 - data.hub.lat) / 180) * 100}%` }}
            aria-label={data.hub.label}
            onClick={() => {/* hub has no popup */}}
          />

          {/* Popup */}
          <div
            ref={popupRef}
            className={`${s.popup} ${activePin !== null ? s.on : s.hidden}`}
            role="status"
            aria-live="polite"
          >
            {activeAmbassador && (
              <>
                <Image
                  src={activeAmbassador.photo.src}
                  alt={activeAmbassador.photo.alt}
                  width={44}
                  height={44}
                  style={{ borderRadius: 10, objectFit: 'cover', width: 44, height: 44 }}
                />
                <span>
                  <b className={s.popupName}>{activeAmbassador.name}</b>
                  <small className={s.popupCountry}>{activeAmbassador.country}</small>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
