'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { accentRuns, SDG_COLOURS } from '@/features/home/schema'
import type { HomeContent } from '@/features/home/schema'

/** Clip-path wipe: threshold 0, rootMargin, so Chrome's clip-path zero-area rule doesn't skip it. */
function useWipeReveal() {
  const ref = useRef<HTMLHeadingElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true); return
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

export function Programme({ data }: { data: HomeContent['programme'] }) {
  const { ref, inView } = useWipeReveal()
  const rowRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLElement | null)[]>([])
  const [progress, setProgress] = useState(0)

  // 3D perspective: cards near the center face forward, neighbours tilt slightly away.
  // Driven by scroll position — no motion/react needed here.
  function update3D() {
    const row = rowRef.current
    if (!row || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rowRect = row.getBoundingClientRect()
    const rowCenter = rowRect.left + rowRect.width / 2
    const max = row.scrollWidth - row.clientWidth
    setProgress(max > 0 ? row.scrollLeft / max : 0)

    cardsRef.current.forEach((card) => {
      if (!card) return
      const r = card.getBoundingClientRect()
      const dist = ((r.left + r.width / 2) - rowCenter) / (rowRect.width / 2)
      const clamped = Math.max(-1, Math.min(1, dist))
      const ry = clamped * 6
      const scale = 1 - Math.abs(clamped) * 0.08
      card.style.transform = `perspective(1200px) rotateY(${ry}deg) scale(${scale})`
    })
  }

  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    row.addEventListener('scroll', update3D, { passive: true })
    // Run once on mount after paint
    const raf = requestAnimationFrame(update3D)
    return () => { row.removeEventListener('scroll', update3D); cancelAnimationFrame(raf) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function scrollBy(dir: -1 | 1) {
    const row = rowRef.current
    const card = cardsRef.current[0]
    if (!row || !card) return
    row.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: 'smooth' })
  }

  function handleRowKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollBy(-1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollBy(1) }
  }

  return (
    <section
      id="programme"
      data-name="Four days in Kuala Lumpur"
      aria-labelledby="prog-hd"
      style={{ background: '#fff', paddingBlock: 'clamp(72px,9vw,136px)' }}
    >
      <div className="wrap">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '16px 32px',
            marginBottom: 'clamp(28px,4vw,48px)',
          }}
        >
          <div>
            <p className="prog-kicker">{data.kicker}</p>
            <h2
              ref={ref}
              id="prog-hd"
              className={`d2 prog-wipe${inView ? ' prog-wipe-in' : ''}`}
              style={{ color: 'var(--ink)', marginTop: '10px' }}
            >
              {accentRuns(data.heading).map((seg, i) =>
                seg.italic ? (
                  <em key={i} className="accent">{seg.text}</em>
                ) : (
                  <span key={i}>{seg.text}</span>
                ),
              )}
            </h2>
          </div>

          {/* Prev / next controls */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="prog-ctrl"
              aria-label="Previous day"
              onClick={() => scrollBy(-1)}
            >
              &#8592;
            </button>
            <button
              className="prog-ctrl"
              aria-label="Next day"
              onClick={() => scrollBy(1)}
            >
              &#8594;
            </button>
          </div>
        </div>

        {/* Scroll-snap row; row is focusable so keyboard users can arrow-key through */}
        <div
          ref={rowRef}
          className="prog-row"
          tabIndex={0}
          aria-label="Programme by day"
          role="group"
          onKeyDown={handleRowKeyDown}
        >
          {data.days.map((day, i) => {
            const colours = SDG_COLOURS[day.sdg]
            return (
              <div key={day.date} className="prog-snap">
                <article
                  ref={(el: HTMLElement | null) => { cardsRef.current[i] = el }}
                  className="prog-day"
                  style={{
                    background: colours.bg,
                    color: colours.fg,
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '20px',
                    padding: '28px',
                    minHeight: '420px',
                    display: 'grid',
                    gridTemplateRows: 'auto 1fr auto',
                    gap: '18px',
                    transition: 'transform 0.4s cubic-bezier(.2,.8,.2,1)',
                    willChange: 'transform',
                  }}
                >
                  {/* Large faint day number as CSS ::before isn't available with inline styles; render as aria-hidden div */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: '20px',
                      top: '-12px',
                      fontSize: 'clamp(4rem,8vw,7rem)',
                      fontWeight: 800,
                      lineHeight: 0.8,
                      letterSpacing: '-0.05em',
                      opacity: 0.22,
                      pointerEvents: 'none',
                      userSelect: 'none',
                      color: 'currentColor',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <p
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        // no opacity: inherits card fg at full strength so contrast passes WCAG AA
                      }}
                    >
                      {day.date}
                    </p>
                    <h3
                      style={{
                        fontFamily: 'var(--fd)',
                        fontSize: 'clamp(1.5rem,2.4vw,2rem)',
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        lineHeight: 1.12,
                        marginTop: '4px',
                      }}
                    >
                      {day.title}
                    </h3>
                  </div>

                  <ul
                    style={{
                      listStyle: 'none',
                      display: 'grid',
                      gap: '7px',
                      fontSize: '15px',
                      maxWidth: '30ch',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {day.items.map((item) => (
                      <li key={item} className="prog-li">
                        {item}
                      </li>
                    ))}
                  </ul>

                  <p
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      // no opacity: full card fg colour keeps contrast ≥ 4.5:1 on all SDG backgrounds
                    }}
                  >
                    Day {i + 1} of {data.days.length}
                  </p>

                  {day.render && (
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        right: '-10%',
                        bottom: '-8%',
                        width: '62%',
                        pointerEvents: 'none',
                      }}
                    >
                      <Image
                        src={day.render}
                        alt=""
                        width={320}
                        height={320}
                        style={{ width: '100%', height: 'auto', opacity: 0.95 }}
                        loading="lazy"
                      />
                    </div>
                  )}
                </article>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div
          className="prog-bar-track"
          aria-hidden="true"
          style={{
            height: '4px',
            background: 'rgba(14,21,48,.12)',
            borderRadius: '2px',
            marginTop: '18px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: '25%',
              background: 'var(--ink)',
              borderRadius: '2px',
              transform: `translateX(${progress * 300}%)`,
              transition: 'transform 0.2s ease',
            }}
          />
        </div>

        {data.note && (
          <p
            style={{ marginTop: '14px', fontSize: '14px', color: 'var(--n-500)', lineHeight: 1.55 }}
          >
            {data.note}
          </p>
        )}
      </div>

      <style>{`
        .prog-kicker {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--sdg4);
        }
        .prog-wipe {
          clip-path: inset(0 100% 0 0);
          transition: clip-path 1s cubic-bezier(.2,.8,.2,1);
        }
        .prog-wipe-in { clip-path: inset(0 0 0 0); }

        .prog-ctrl {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--ink);
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 18px;
          border: none;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(.34,1.56,.64,1);
          font-family: inherit;
        }
        .prog-ctrl:hover { transform: scale(1.08); }

        .prog-row {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding-bottom: 10px;
          scrollbar-width: none;
          outline: none;
        }
        .prog-row::-webkit-scrollbar { display: none; }
        .prog-row:focus-visible { box-shadow: 0 0 0 3px var(--yellow); border-radius: 4px; }

        .prog-snap {
          flex: 0 0 min(86vw, 560px);
          scroll-snap-align: start;
          /* Inner card has the 3D transform; snap frame is untransformed so snap positions are stable */
        }
        .prog-day { width: 100%; }
        .prog-li {
          padding-left: 16px;
          position: relative;
        }
        .prog-li::before {
          content: '';
          position: absolute;
          left: 0;
          top: .6em;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.7;
        }
      `}</style>
    </section>
  )
}
