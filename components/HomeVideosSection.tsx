'use client'

/**
 * HomeVideosSection — big hero-style inline video slider.
 * Active video fills ~76% content width on desktop (max 960px), full width on phones.
 * Neighbours peek at the sides. Click the thumbnail to play inline (no modal).
 * Slide change remounts YouTubeEmbed (via key) to stop any playing video.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'
import type { VideoItem } from '@/components/premium/CoverflowVideos'

interface Props {
  items: VideoItem[]
  heading?: string
  /** Text colour for the title and counter. Default: var(--white) for dark-bg sections. Pass var(--navy-900) for light sections. */
  textColor?: string
}

export function HomeVideosSection({ items, heading, textColor = 'var(--white)' }: Props) {
  const [active, setActive] = useState(0)
  // Bumping videoKey remounts YouTubeEmbed, which resets its playing state
  const [videoKey, setVideoKey] = useState(0)
  const regionRef = useRef<HTMLElement>(null)
  const dragStartX = useRef<number | null>(null)
  const total = items.length

  const go = useCallback(
    (dir: 1 | -1) => {
      setActive((i) => (i + dir + total) % total)
      setVideoKey((k) => k + 1)
    },
    [total],
  )

  // Arrow key nav when the carousel region is focused
  useEffect(() => {
    const el = regionRef.current
    if (!el) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
    }
    el.addEventListener('keydown', h)
    return () => el.removeEventListener('keydown', h)
  }, [go])

  // Pointer-drag swipe (phones + trackpads)
  function onPointerDown(e: React.PointerEvent) { dragStartX.current = e.clientX }
  function onPointerUp(e: React.PointerEvent) {
    if (dragStartX.current === null) return
    const delta = e.clientX - dragStartX.current
    dragStartX.current = null
    if (delta < -60) go(1)
    else if (delta > 60) go(-1)
  }
  function onPointerCancel() { dragStartX.current = null }

  const item = items[active]
  const prevItem = items[(active - 1 + total) % total]
  const nextItem = items[(active + 1) % total]

  return (
    <section
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={heading ?? 'Videos'}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {/* Screen-reader live region announces which slide is shown */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {item.title}, video {active + 1} of {total}
      </div>

      {/* Stage — peek cards are absolute children; active card sets the height */}
      <div
        className="hvs-stage"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {/* Left peek (prev thumbnail) — decorative, aria-hidden */}
        {total > 1 && (
          <button
            type="button"
            className="hvs-peek hvs-peek-l"
            onClick={() => go(-1)}
            aria-hidden="true"
            tabIndex={-1}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={prevItem.thumbnailSrc}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </button>
        )}

        {/* Active video card */}
        <div className="hvs-active">
          <YouTubeEmbed
            key={videoKey}
            videoUrl={`https://www.youtube-nocookie.com/embed/${item.id}`}
            posterSrc={item.thumbnailSrc}
            posterAlt={item.title}
            overlayClassName="hvs-overlay"
            playBtnClassName="hvs-play"
          />
        </div>

        {/* Right peek (next thumbnail) — decorative, aria-hidden */}
        {total > 1 && (
          <button
            type="button"
            className="hvs-peek hvs-peek-r"
            onClick={() => go(1)}
            aria-hidden="true"
            tabIndex={-1}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nextItem.thumbnailSrc}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </button>
        )}
      </div>

      {/* Title + controls */}
      <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
        <p
          style={{
            fontFamily: 'var(--fb)',
            fontSize: 'clamp(0.9375rem, 1.4vw, 1.125rem)',
            color: textColor,
            lineHeight: 1.4,
            marginBottom: '1.25rem',
            maxWidth: '60ch',
            marginInline: 'auto',
          }}
        >
          {item.title}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.25rem',
          }}
        >
          <button
            type="button"
            className="hvs-btn"
            onClick={() => go(-1)}
            aria-label="Previous video"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
              <path
                d="M11.5 3.5 6 9l5.5 5.5"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <span
            style={{
              fontFamily: 'var(--fd)',
              fontSize: '1rem',
              color: textColor,
              minWidth: '4ch',
              textAlign: 'center',
            }}
          >
            {active + 1} / {total}
          </span>

          <button
            type="button"
            className="hvs-btn"
            onClick={() => go(1)}
            aria-label="Next video"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
              <path
                d="M6.5 3.5 12 9l-5.5 5.5"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        /* play mark over the poster; YouTubeEmbed draws it only with these classes */
        .hvs-overlay { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
        .hvs-play { width: clamp(64px, 8vw, 88px); height: clamp(64px, 8vw, 88px); border-radius: 999px; background: var(--y); display: grid; place-items: center; box-shadow: 0 12px 30px rgba(0,0,0,.35); transition: transform .3s cubic-bezier(.34,1.56,.64,1); }
        .hvs-active button:hover .hvs-play, .hvs-active button:focus-visible .hvs-play { transform: scale(1.08); }

        .hvs-stage {
          position: relative;
          user-select: none;
          /* height is set by the in-flow hvs-active card */
        }
        .hvs-active {
          position: relative;
          width: min(76%, 960px);
          aspect-ratio: 16 / 9;
          margin-inline: auto;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.25);
        }
        /* Peek cards: absolute, vertically centred, partially visible at edges */
        .hvs-peek {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 10%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,.15);
          padding: 0;
          cursor: pointer;
          background: none;
          opacity: .3;
          transition: opacity 160ms ease;
        }
        .hvs-peek:hover { opacity: .55; }
        .hvs-peek-l { left: 1%; }
        .hvs-peek-r { right: 1%; }
        /* Round 44px prev/next buttons */
        .hvs-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--navy-900, #0E1530);
          color: var(--white, #fff);
          border: 1px solid rgba(255,255,255,.2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 160ms ease, color 160ms ease;
        }
        .hvs-btn:hover { background: var(--yellow, #FCC30B); color: var(--ink, #0E1530); }
        /* Mobile: active card fills most of the width; hide peeking neighbours */
        @media (max-width: 640px) {
          .hvs-active { width: calc(100% - 2rem); }
          .hvs-peek { display: none; }
        }
        /* Reduced motion: skip transitions, hide peek cards */
        @media (prefers-reduced-motion: reduce) {
          .hvs-peek { display: none; }
          .hvs-peek, .hvs-btn { transition: none; }
        }
      `}</style>
    </section>
  )
}
