'use client'

/**
 * ShortsRow — horizontal row of 9:16 (portrait/Shorts) video cards.
 *
 * Desktop ≥641px: JS-paginated grid, 4 cards visible (240px × ~427px each).
 *   Non-current-page cards get display:none via .srow-off. Prev/next + counter.
 * Mobile ≤640px: CSS scroll-snap track, all cards at 75% width with next peeking.
 *   Counter tracks scroll position; buttons also scroll the track.
 *
 * All cards use YouTubeEmbed for inline play. stopAll() fires on every nav or
 * scroll-settle so hidden cards never keep playing. YouTubeEmbed's own yt:play
 * broadcast additionally stops any playing instance when a new one starts.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'
import type { VideoItem } from '@/components/premium/CoverflowVideos'

const GAP = 16 // px — must match .srow-track gap in CSS
const D_PER_PAGE = 4 // cards per desktop page

interface Props {
  items: VideoItem[]
  heading?: string
}

/** Stops all YouTubeEmbed instances on the page via the shared yt:play event. */
function stopAll() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yt:play', { detail: '__stop__' }))
  }
}

export function ShortsRow({ items, heading }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  /** Desktop: which page of D_PER_PAGE items to show. */
  const [dPage, setDPage] = useState(0)
  /** Mobile: index of the first visible card (derived from scroll). */
  const [mIdx, setMIdx] = useState(0)
  const total = items.length
  const totalDPages = Math.ceil(total / D_PER_PAGE)

  /** Debounced scroll handler: update mIdx + stop hidden videos on mobile. */
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let timer: ReturnType<typeof setTimeout>
    const onScroll = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const t = trackRef.current
        if (!t) return
        stopAll()
        const cardW = (t.firstElementChild as HTMLElement | null)?.offsetWidth ?? 1
        setMIdx(Math.round(t.scrollLeft / (cardW + GAP)))
      }, 200)
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      track.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [])

  /**
   * Advance by one page (desktop) and scroll one card (mobile).
   * On desktop overflow:hidden makes scrollBy a no-op, so only dPage changes.
   * On mobile dPage change has no visible effect (srow-off not active), so only scroll matters.
   */
  const go = useCallback(
    (dir: 1 | -1) => {
      stopAll()
      setDPage((p) => (p + dir + totalDPages) % totalDPages)
      const track = trackRef.current
      if (track) {
        const cardW = (track.firstElementChild as HTMLElement | null)?.offsetWidth ?? 1
        track.scrollBy({ left: dir * (cardW + GAP), behavior: 'smooth' })
      }
    },
    [totalDPages],
  )

  /** Arrow key navigation when the carousel is focused. */
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
    }
    el.addEventListener('keydown', h)
    return () => el.removeEventListener('keydown', h)
  }, [go])

  return (
    <section
      ref={sectionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={heading ?? 'Videos'}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {/* Screen-reader live region: mobile index used for all viewports */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {items[mIdx]?.title ?? ''}, video {mIdx + 1} of {total}
      </div>

      <div ref={trackRef} className="srow-track">
        {items.map((item, idx) => {
          // On desktop this card is hidden when not in the current page.
          // On mobile the class has no effect (not in the media query block).
          const offPage = idx < dPage * D_PER_PAGE || idx >= (dPage + 1) * D_PER_PAGE
          return (
            <div key={item.id} className={`srow-card${offPage ? ' srow-off' : ''}`}>
              <div className="srow-embed">
                <YouTubeEmbed
                  videoUrl={`https://www.youtube-nocookie.com/embed/${item.id}`}
                  posterSrc={item.thumbnailSrc}
                  posterAlt={item.title}
                  overlayClassName="srow-overlay"
                  playBtnClassName="srow-play"
                />
              </div>
              <p className="srow-title">{item.title}</p>
            </div>
          )
        })}
      </div>

      <div className="srow-controls">
        <button
          type="button"
          className="srow-btn"
          onClick={() => go(-1)}
          aria-label="Previous videos"
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

        {/* Desktop counter: shows range of visible items */}
        <span className="srow-counter srow-cnt-d">
          {dPage * D_PER_PAGE + 1}–{Math.min((dPage + 1) * D_PER_PAGE, total)} / {total}
        </span>
        {/* Mobile counter: shows first visible card */}
        <span className="srow-counter srow-cnt-m">
          {mIdx + 1} / {total}
        </span>

        <button
          type="button"
          className="srow-btn"
          onClick={() => go(1)}
          aria-label="Next videos"
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

      <style>{`
        /* ── Shared ── */
        .srow-track {
          display: flex;
          gap: ${GAP}px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          padding-bottom: 2px; /* prevent border clip */
        }
        .srow-track::-webkit-scrollbar { display: none; }

        /* Mobile default: 75% card + peek of next */
        .srow-card {
          flex-shrink: 0;
          width: 75%;
          scroll-snap-align: start;
        }

        /* 9:16 embed wrapper */
        .srow-embed {
          position: relative;
          aspect-ratio: 9 / 16;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(14, 21, 48, 0.12);
          background: #0e1530;
        }

        /* Card title — Newsreader, clamped to 2 lines */
        .srow-title {
          font-family: var(--fb);
          font-size: 0.875rem;
          line-height: 1.35;
          color: var(--navy-900, #0e1530);
          margin-top: 0.625rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Yellow play button via YouTubeEmbed class hooks */
        .srow-overlay {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
        }
        .srow-play {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--yellow, #fcc30b);
          display: grid;
          place-items: center;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .srow-embed button:hover .srow-play,
        .srow-embed button:focus-visible .srow-play { transform: scale(1.1); }

        /* Controls row */
        .srow-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          margin-top: 1.25rem;
        }

        /* 44px round prev/next buttons */
        .srow-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--navy-900, #0e1530);
          color: var(--white, #fff);
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 160ms ease, color 160ms ease;
        }
        .srow-btn:hover { background: var(--yellow, #fcc30b); color: var(--navy-900, #0e1530); }

        .srow-counter {
          font-family: var(--fd);
          font-size: 1rem;
          color: var(--navy-900, #0e1530);
          min-width: 6ch;
          text-align: center;
        }

        /* Show mobile counter by default, hide desktop counter */
        .srow-cnt-d { display: none; }
        .srow-cnt-m { display: inline; }

        /* ── Desktop ≥641px: JS-paginated, 4 fixed-width cards ── */
        @media (min-width: 641px) {
          /* Disable native horizontal scroll; JS pagination controls visibility */
          .srow-track { overflow-x: hidden; justify-content: center; }
          /* 240px each: 4 × 240 + 3 × 16 = 1008px (fits comfortably in wrap content ~1168px) */
          .srow-card { width: 240px; }
          /* Hide cards outside current desktop page */
          .srow-off { display: none; }
          /* Switch counters */
          .srow-cnt-d { display: inline; }
          .srow-cnt-m { display: none; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .srow-play { transition: none; }
          .srow-track { scroll-behavior: auto; }
        }
      `}</style>
    </section>
  )
}
