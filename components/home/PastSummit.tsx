'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { HomeContent } from '@/features/home/schema'
import { accentRuns } from '@/features/home/schema'
import s from './PastSummit.module.css'

interface Props {
  data: HomeContent['past']
}

export function PastSummit({ data }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const ticketRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<HTMLParagraphElement>(null)
  const vidRef = useRef<HTMLAnchorElement>(null)
  const [activeEdition, setActiveEdition] = useState(0)

  const ed = data.editions[activeEdition]

  // Reveal animations
  useEffect(() => {
    const targets = [
      { ref: headingRef, rootMargin: '0px 0px -12% 0px', threshold: 0 },
      { ref: ticketRef, rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
      { ref: noteRef, rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
      { ref: vidRef, rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
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

  if (!ed) return null

  const headingRuns = accentRuns(data.heading)

  return (
    <section
      className={s.section}
      id="past"
      data-name="Bangkok, July 2026"
      aria-labelledby="past-h2"
    >
      <div className="wrap">
        <p className={s.kicker}>{data.kicker}</p>
        <h2 id="past-h2" ref={headingRef} className={s.heading}>
          {headingRuns.map((r, i) =>
            r.italic ? (
              <em key={i} className={s.accent}>{r.text}</em>
            ) : (
              <span key={i}>{r.text}</span>
            ),
          )}
        </h2>

        <div className={s.inner}>
          <div>
            <div ref={ticketRef} className={s.ticket}>
              <span className={s.stamp}>{ed.stamp}</span>
              <div className={s.ticketTop}>
                <span>{ed.name}</span>
              </div>
              <h3 className={s.ticketTitle}>{ed.dates}</h3>
              <p className={s.ticketText}>{ed.text}</p>
              <div className={s.tear}>
                {ed.facts.map((f, i) => (
                  <span key={i}>
                    <b>{f.n}</b>
                    {f.label}
                  </span>
                ))}
              </div>
            </div>

            {data.note && (
              <p ref={noteRef} className={s.note}>{data.note}</p>
            )}

            {/* Tabs for additional editions */}
            {data.editions.length > 1 && (
              <div className={s.tabs} role="tablist" aria-label="Past editions">
                {data.editions.map((e, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={activeEdition === i}
                    className={`${s.tab} ${activeEdition === i ? s.active : ''}`}
                    onClick={() => setActiveEdition(i)}
                  >
                    {e.edition}
                  </button>
                ))}
              </div>
            )}
          </div>

          <a
            ref={vidRef}
            href={ed.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.vidCard}
            aria-label={`Watch ${ed.name} highlights on YouTube (opens in new tab)`}
          >
            <Image
              src={ed.videoPoster.src}
              alt={ed.videoPoster.alt}
              fill
              className={s.vidImage}
              sizes="(max-width: 860px) 100vw, 50vw"
              style={{ objectFit: 'cover', opacity: 0.92 }}
            />
            <span className={s.playOverlay} aria-hidden="true">
              <span className={s.playBtn}>
                <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M8 5v14l11-7z" fill="#0E1530" />
                </svg>
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
