'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import type { HomeContent } from '@/features/home/schema'
import { accentRuns, countdownTarget } from '@/features/home/schema'
import { Countdown } from '@/components/Countdown'
import s from './EventBand.module.css'

interface Props {
  data: HomeContent['event']
  serverNow: number
}

export function EventBand({ data, serverNow }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const cdRef = useRef<HTMLDivElement>(null)
  const btnsRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<HTMLParagraphElement>(null)
  const seatRef = useRef<HTMLDivElement>(null)

  // Reveal animations
  useEffect(() => {
    const targets = [
      { ref: headingRef, rootMargin: '0px 0px -12% 0px', threshold: 0 as number },
      { ref: textRef,    rootMargin: '0px 0px -8% 0px',  threshold: 0.1 as number },
      { ref: cdRef,      rootMargin: '0px 0px -8% 0px',  threshold: 0.1 as number },
      { ref: btnsRef,    rootMargin: '0px 0px -8% 0px',  threshold: 0.1 as number },
      { ref: noteRef,    rootMargin: '0px 0px -8% 0px',  threshold: 0.1 as number },
      { ref: seatRef,    rootMargin: '0px 0px -8% 0px',  threshold: 0.2 as number },
    ]
    const observers = targets.map(({ ref, rootMargin, threshold }) => {
      const el = ref.current
      if (!el) return null
      const obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) { el.classList.add(s.in); obs.unobserve(el) }
          }
        },
        { rootMargin, threshold },
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach((o) => o?.disconnect())
  }, [])

  const headingRuns = accentRuns(data.heading)
  const target = countdownTarget(data)
  const { seats } = data

  return (
    <section
      className={s.section}
      id="event"
      data-name="SISM 2026, Kuala Lumpur"
      aria-labelledby="event-h2"
    >
      <div className="wrap">
        <div className={s.inner}>
          <div>
            <p className={s.kicker}>{data.kicker}</p>
            <h2 id="event-h2" ref={headingRef} className={s.heading}>
              {headingRuns.map((r, i) =>
                r.italic ? (
                  <em key={i} className={s.accent}>{r.text}</em>
                ) : (
                  <span key={i}>{r.text}</span>
                ),
              )}
            </h2>

            <p ref={textRef} className={s.text}>{data.text}</p>

            {target !== null && (
              <div ref={cdRef} className={s.countdownWrap}>
                <Countdown target={target} serverNow={serverNow} />
              </div>
            )}

            <div ref={btnsRef} className={s.btns}>
              <Link href={data.primaryCta.href} className="btn btn-n">
                {data.primaryCta.label} <span aria-hidden="true">&#8594;</span>
              </Link>
              {data.secondaryCta.label && (
                <Link
                  href={data.secondaryCta.href}
                  className="btn btn-g"
                  style={{ borderColor: 'rgba(14,21,48,.4)', color: 'var(--ink)' }}
                >
                  {data.secondaryCta.label}
                </Link>
              )}
            </div>

            {data.note && (
              <p ref={noteRef} className={s.note}>{data.note}</p>
            )}
          </div>

          {/* Seat grid */}
          <div ref={seatRef} className={s.seatWrap}>
            <div
              className={s.seats}
              role="img"
              aria-label={`${seats.total} seats: ${seats.full} fully funded, ${seats.partial} partially funded, ${seats.total - seats.full - seats.partial} confirmed seats`}
            >
              {Array.from({ length: seats.total }, (_, i) => (
                <span
                  key={i}
                  className={`${s.dot} ${i < seats.full ? s.dotFull : i < seats.full + seats.partial ? s.dotPartial : ''}`}
                  style={{ transitionDelay: `${i * 18}ms` }}
                  aria-hidden="true"
                />
              ))}
            </div>

            <div className={s.legend} aria-hidden="true">
              <span>
                <i className={s.legendDot} style={{ background: 'var(--ink, #0E1530)' }} />
                {seats.fullLabel}
              </span>
              <span>
                <i className={s.legendDot} style={{ background: '#C5192D' }} />
                {seats.partialLabel}
              </span>
              <span>
                <i className={s.legendDot} style={{ background: 'rgba(14,21,48,.12)' }} />
                {seats.restLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
