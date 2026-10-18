'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
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

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z" fill="var(--ink)" />
    </svg>
  )
}

/** First sentence larger; rest in body size. */
function splitFirstSentence(text: string): [string, string] {
  const m = text.match(/^([^.!?]+[.!?]+\s*)(.*)$/s)
  if (!m) return [text, '']
  return [m[1].trim(), m[2].trim()]
}

export function Stories({ data }: { data: HomeContent['stories'] }) {
  const { ref, inView } = useWipeReveal()
  const [activeQ, setActiveQ] = useState(0)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const quotes = data.quotes
  const videos = data.videos

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (quotes.length <= 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timerRef.current = setInterval(() => setActiveQ((i) => (i + 1) % quotes.length), 6000)
  }

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes.length])

  function goTo(i: number) { setActiveQ(i); resetTimer() }

  function handleTouchStart(e: React.TouchEvent) { setDragStart(e.touches[0].clientX) }
  function handleTouchEnd(e: React.TouchEvent) {
    if (dragStart === null) return
    const dx = e.changedTouches[0].clientX - dragStart
    if (dx < -40) goTo((activeQ + 1) % quotes.length)
    else if (dx > 40) goTo((activeQ - 1 + quotes.length) % quotes.length)
    setDragStart(null)
  }

  const onlyVideos = quotes.length === 0

  return (
    <section
      id="stories"
      data-name="Delegates, in their own words"
      aria-labelledby="sto-hd"
      style={{ background: 'var(--field)', paddingBlock: 'clamp(72px,9vw,136px)' }}
    >
      <div className="wrap">
        {/* Header */}
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
            <p
              style={{
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--sdg4)',
              }}
            >
              {data.kicker}
            </p>
            <h2
              ref={ref}
              id="sto-hd"
              className={`d2 sto-wipe${inView ? ' sto-wipe-in' : ''}`}
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
          {data.intro && (
            <p
              style={{
                fontSize: 'clamp(1rem,1.4vw,1.125rem)',
                color: 'var(--n-600)',
                lineHeight: 1.65,
                maxWidth: '52ch',
              }}
            >
              {data.intro}
            </p>
          )}
        </div>

        <div className={`sto-body${onlyVideos ? ' sto-videos-only' : ''}`}>
          {/* Quote carousel */}
          {!onlyVideos && (
            <div
              className="sto-quotes"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              role="region"
              aria-label="Delegate quotes"
            >
              {quotes.map((q, i) => {
                const [first, rest] = splitFirstSentence(q.quote)
                return (
                  <div
                    key={q.name}
                    aria-hidden={i !== activeQ}
                    style={{
                      opacity: i === activeQ ? 1 : 0,
                      position: i === 0 ? 'relative' : 'absolute',
                      inset: i !== 0 ? 0 : undefined,
                      top: i !== 0 ? 0 : undefined,
                      transition: 'opacity 0.4s ease',
                      pointerEvents: i === activeQ ? 'auto' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                      <div
                        style={{
                          width: '64px', height: '64px', borderRadius: '14px',
                          overflow: 'hidden', flexShrink: 0, background: 'var(--n-100)',
                        }}
                      >
                        <Image
                          src={q.photo.src}
                          alt={q.photo.alt || q.name}
                          width={64}
                          height={64}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '18px', letterSpacing: '-0.01em', color: 'var(--ink)' }}>
                          {q.name}
                        </strong>
                        <span style={{ display: 'block', fontSize: '13px', color: 'var(--sdg4)', fontWeight: 600 }}>
                          {q.status}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--n-500)' }}>{q.country}</span>
                      </div>
                    </div>

                    {first && (
                      <p
                        style={{
                          fontSize: 'clamp(1rem,1.6vw,1.25rem)',
                          lineHeight: 1.45,
                          color: 'var(--ink)',
                          marginBottom: rest ? '10px' : 0,
                        }}
                      >
                        &ldquo;{first}
                      </p>
                    )}
                    {rest && (
                      <p style={{ fontSize: '15px', lineHeight: 1.55, color: 'var(--n-700)' }}>
                        {rest}&rdquo;
                      </p>
                    )}
                    {q.link && (
                      <a
                        href={q.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          marginTop: '14px',
                          fontSize: '14px',
                          color: 'var(--navy)',
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px',
                        }}
                      >
                        Read the post
                      </a>
                    )}
                  </div>
                )
              })}

              {quotes.length > 1 && (
                <div
                  role="tablist"
                  aria-label="Quote navigation"
                  style={{ display: 'flex', gap: '6px', marginTop: '18px' }}
                >
                  {quotes.map((q, i) => (
                    <button
                      key={q.name}
                      role="tab"
                      aria-selected={i === activeQ}
                      aria-label={`Quote by ${q.name}`}
                      onClick={() => goTo(i)}
                      className={`sto-dot${i === activeQ ? ' sto-dot-on' : ''}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Video posters: three tall 9:14 cards, slightly rotated */}
          {videos.length > 0 && (
            <div className="sto-vids" aria-label="Delegate video testimonials">
              {videos.map((v, i) => {
                const rotations = [-2, 0, 2]
                const rot = rotations[i % 3]
                return (
                  <a
                    key={v.url}
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sto-vid-link"
                    aria-label="Delegate testimonial on YouTube"
                    style={{
                      display: 'block',
                      position: 'relative',
                      aspectRatio: '9/14',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      background: 'var(--ink)',
                      transform: `rotate(${rot}deg)`,
                      marginTop: i === 1 ? '18px' : '0',
                    }}
                  >
                    <Image
                      src={v.poster.src}
                      alt={v.poster.alt || ''}
                      fill
                      sizes="(max-width: 860px) 28vw, 15vw"
                      style={{ objectFit: 'cover' }}
                      loading="lazy"
                    />
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: '50%', top: '50%',
                        transform: 'translate(-50%,-50%)',
                        width: '44px', height: '44px',
                        borderRadius: '50%',
                        background: 'var(--yellow)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <PlayIcon />
                    </span>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .sto-wipe {
          clip-path: inset(0 100% 0 0);
          transition: clip-path 1s cubic-bezier(.2,.8,.2,1);
        }
        .sto-wipe-in { clip-path: inset(0 0 0 0); }

        .sto-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(24px, 5vw, 64px);
          align-items: start;
        }
        .sto-body.sto-videos-only {
          grid-template-columns: 1fr;
          max-width: 600px;
          margin-inline: auto;
        }
        @media (max-width: 860px) {
          .sto-body { grid-template-columns: 1fr; }
        }

        .sto-quotes {
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          border: 1px solid var(--n-200);
          position: relative;
          min-height: 200px;
        }
        .sto-vids {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          align-items: start;
        }
        .sto-vid-link {
          transition: transform 0.4s cubic-bezier(.34,1.56,.64,1) !important;
        }
        .sto-vid-link:hover { transform: rotate(0deg) scale(1.04) !important; }

        .sto-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--n-300); border: none;
          cursor: pointer; padding: 0;
          transition: background 0.2s, transform 0.2s;
        }
        .sto-dot-on { background: var(--ink); transform: scale(1.3); }
      `}</style>
    </section>
  )
}
