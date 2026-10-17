'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import Link from 'next/link'
import { accentRuns } from '@/features/home/schema'
import type { HomeContent } from '@/features/home/schema'

function useWipeReveal() {
  const ref = useRef<HTMLHeadingElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true)
      return
    }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold: 0, rootMargin: '0px 0px -12% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

/** Normalise distance with wrap-around: -total/2 to +total/2. */
function normDist(i: number, active: number, total: number): number {
  let d = i - active
  if (d > total / 2) d -= total
  if (d < -total / 2) d += total
  return d
}

export function Advisors({ data }: { data: HomeContent['advisors'] }) {
  const { ref, inView } = useWipeReveal()
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = data.people.length

  const prev = () => setActiveIdx((i) => (i - 1 + total) % total)
  const next = () => setActiveIdx((i) => (i + 1) % total)

  // Autoplay every 4s — pause on hover/focus/reduced motion.
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(next, 4000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, activeIdx])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
    if (e.key === 'ArrowRight') { e.preventDefault(); next() }
  }

  return (
    <section
      id="advisors"
      data-name="The people behind it"
      aria-labelledby="adv-hd"
      style={{ background: 'var(--field)', paddingBlock: 'clamp(72px,9vw,136px)' }}
    >
      <div className="wrap adv-layout">
        {/* Text column */}
        <div className="adv-text">
          <p
            style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: 'var(--sdg4)',
              marginBottom: '10px',
            }}
          >
            {data.kicker}
          </p>
          <h2
            ref={ref}
            id="adv-hd"
            className={`d2 adv-wipe${inView ? ' adv-wipe-in' : ''}`}
            style={{ color: 'var(--ink)', marginBottom: '16px' }}
          >
            {accentRuns(data.heading).map((seg, i) =>
              seg.italic ? (
                <em key={i} className="accent">{seg.text}</em>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )}
          </h2>
          {data.intro && (
            <p
              style={{
                fontSize: 'clamp(1rem,1.4vw,1.125rem)',
                color: 'var(--n-600)',
                lineHeight: 1.65,
                maxWidth: '46ch',
                marginBottom: '22px',
              }}
            >
              {data.intro}
            </p>
          )}
          {data.cta.label && (
            <Link href={data.cta.href} className="btn btn-g">
              {data.cta.label} <span aria-hidden="true">&#8594;</span>
            </Link>
          )}
        </div>

        {/* 3D coverflow carousel */}
        <div
          className="adv-cf"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onKeyDown={handleKeyDown}
          role="region"
          aria-label="Advisory board carousel"
        >
          {/* Card stage with perspective */}
          <div className="adv-stage">
            {data.people.map((person, i) => {
              const d = normDist(i, activeIdx, total)
              const absD = Math.abs(d)
              if (absD > 2) return null
              return (
                <div
                  key={person.name}
                  className="adv-card-pos"
                  aria-hidden={d !== 0}
                  style={{
                    transform: `translateX(calc(-50% + ${d * 110}%)) rotateY(${-d * 35}deg) scale(${d === 0 ? 1 : 0.85})`,
                    opacity: d === 0 ? 1 : Math.max(0.38, 1 - absD * 0.3),
                    zIndex: 10 - absD,
                    pointerEvents: d === 0 ? 'auto' : 'none',
                  }}
                >
                  <div className="adv-card">
                    <div
                      style={{
                        position: 'relative',
                        aspectRatio: '4/5',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: 'var(--n-100)',
                      }}
                    >
                      <Image
                        src={person.photo.src}
                        alt={person.photo.alt || person.name}
                        fill
                        sizes="(max-width: 767px) 80vw, 22vw"
                        style={{ objectFit: 'cover', objectPosition: 'top' }}
                        loading="lazy"
                      />
                      {/* scrim so overlay text is readable */}
                      <div
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          /* scrim */
                          background: 'linear-gradient(to top, rgba(14,21,48,.75), transparent 55%)',
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '12px',
                          background: '#fff',
                          color: 'var(--ink)',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '999px',
                          padding: '4px 10px',
                          zIndex: 1,
                        }}
                      >
                        {person.where}
                      </span>
                      <strong
                        style={{
                          position: 'absolute',
                          left: '12px',
                          right: '12px',
                          bottom: '12px',
                          color: '#fff',
                          fontSize: '17px',
                          lineHeight: 1.15,
                          zIndex: 1,
                          letterSpacing: '-0.01em',
                          display: 'block',
                        }}
                      >
                        {person.name}
                      </strong>
                    </div>
                    {person.bio && (
                      <p
                        style={{
                          fontSize: '14px',
                          color: 'var(--n-600)',
                          lineHeight: 1.4,
                          marginTop: '10px',
                          padding: '0 2px',
                        }}
                      >
                        {person.bio}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Transparent drag overlay so motion detects swipe without fighting card transforms */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, { offset, velocity }) => {
                if (offset.x < -60 || velocity.x < -300) next()
                else if (offset.x > 60 || velocity.x > 300) prev()
              }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                touchAction: 'pan-y',
                cursor: 'grab',
                userSelect: 'none',
              }}
              whileDrag={{ cursor: 'grabbing' }}
              aria-hidden="true"
            />
          </div>

          {/* Arrows */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
            <button className="adv-ctrl" aria-label="Previous advisor" onClick={prev}>&#8592;</button>
            <button className="adv-ctrl" aria-label="Next advisor" onClick={next}>&#8594;</button>
          </div>

          {/* Dots */}
          <div
            role="tablist"
            aria-label="Advisory board"
            style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '12px' }}
          >
            {data.people.map((person, i) => (
              <button
                key={person.name}
                role="tab"
                aria-selected={i === activeIdx}
                aria-label={person.name}
                onClick={() => setActiveIdx(i)}
                className={`adv-dot${i === activeIdx ? ' adv-dot-on' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .adv-wipe {
          clip-path: inset(0 100% 0 0);
          transition: clip-path 1s cubic-bezier(.2,.8,.2,1);
        }
        .adv-wipe-in { clip-path: inset(0 0 0 0); }
        .adv-layout {
          display: grid;
          grid-template-columns: .7fr 1.3fr;
          gap: clamp(24px, 5vw, 64px);
          align-items: start;
        }
        @media (max-width: 860px) {
          .adv-layout { grid-template-columns: 1fr; }
        }
        .adv-cf { min-width: 0; }
        .adv-stage {
          position: relative;
          overflow: hidden;
          height: calc(clamp(220px, 22vw, 280px) * 1.25 + 80px);
          perspective: 1000px;
          transform-style: preserve-3d;
        }
        @media (max-width: 860px) {
          .adv-stage { height: calc(min(80vw, 280px) * 1.25 + 60px); }
        }
        .adv-card-pos {
          position: absolute;
          left: 50%;
          top: 0;
          width: clamp(180px, 22vw, 260px);
          transition: transform 0.45s cubic-bezier(.2,.8,.2,1), opacity 0.45s;
        }
        @media (max-width: 860px) {
          .adv-card-pos { width: min(76vw, 260px); }
        }
        .adv-card { width: 100%; }
        .adv-ctrl {
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--ink); color: #fff; border: none;
          cursor: pointer; font-size: 18px;
          display: grid; place-items: center;
          font-family: inherit;
          transition: transform 0.3s cubic-bezier(.34,1.56,.64,1);
        }
        .adv-ctrl:hover { transform: scale(1.08); }
        .adv-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--n-300); border: none;
          cursor: pointer; padding: 0;
          transition: background 0.2s, transform 0.2s;
        }
        .adv-dot-on { background: var(--ink); transform: scale(1.3); }
      `}</style>
    </section>
  )
}
