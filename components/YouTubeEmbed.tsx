'use client'

import { useRef, useState, useId, useEffect } from 'react'
import Image from 'next/image'

interface Props {
  videoUrl: string
  posterSrc: string
  posterAlt: string
  /** CSS class forwarded to the Next/Image element */
  imageClassName?: string
  /** CSS class for the play button overlay wrapper */
  overlayClassName?: string
  /** CSS class for the yellow play button circle */
  playBtnClassName?: string
  /** Called when the video starts playing (before the iframe mounts) */
  onPlay?: () => void
  /**
   * Stable ID shared with the caller for the yt:play broadcast.
   * Lets a parent component know whether this instance triggered the event.
   * If omitted, an internal useId() value is used.
   */
  instanceId?: string
}

/** Parse a YouTube video ID from youtu.be, watch?v=, /shorts/, or /embed/ URLs. */
export function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0] || null
    if (u.hostname.endsWith('youtube.com') || u.hostname.endsWith('youtube-nocookie.com')) {
      if (u.searchParams.has('v')) return u.searchParams.get('v')
      const m = u.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)
      if (m) return m[1]
    }
  } catch {
    // not a valid URL — fall through
  }
  return null
}

/** Shared style: fill the nearest positioned ancestor (the vidCard wrapper in PastSummit). */
const fillStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  display: 'block',
}

/**
 * Facade YouTube embed — renders inside a positioned container.
 * Shows a poster + play button; on click/Enter/Space swaps in a youtube-nocookie iframe
 * with no layout shift. Falls back to a plain link for non-YouTube URLs.
 *
 * Dispatches window event 'yt:play' (detail = instance id) when activated so only one
 * video plays at a time across the page. Other instances listen and reset themselves.
 */
export function YouTubeEmbed({
  videoUrl,
  posterSrc,
  posterAlt,
  imageClassName,
  overlayClassName,
  playBtnClassName,
  onPlay,
  instanceId,
}: Props) {
  const [playing, setPlaying] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const internalId = useId()
  const id = instanceId ?? internalId

  const ytId = parseYouTubeId(videoUrl)

  // Reset if another YouTubeEmbed on the page starts playing
  useEffect(() => {
    function handleOtherPlay(e: Event) {
      if ((e as CustomEvent<string>).detail !== id) setPlaying(false)
    }
    window.addEventListener('yt:play', handleOtherPlay)
    return () => window.removeEventListener('yt:play', handleOtherPlay)
  }, [id])

  function activate() {
    onPlay?.()
    setPlaying(true)
    window.dispatchEvent(new CustomEvent('yt:play', { detail: id }))
    requestAnimationFrame(() => iframeRef.current?.focus())
  }

  // Non-YouTube URL — keep current link-out behaviour
  if (!ytId) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={fillStyle}
        aria-label={`Watch ${posterAlt} (opens in new tab)`}
      >
        <Image
          src={posterSrc}
          alt={posterAlt}
          fill
          className={imageClassName}
          sizes="(max-width: 860px) 100vw, 50vw"
          style={{ objectFit: 'cover', opacity: 0.92 }}
        />
        <span className={overlayClassName} aria-hidden="true">
          <span className={playBtnClassName}>
            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M8 5v14l11-7z" fill="#0E1530" />
            </svg>
          </span>
        </span>
      </a>
    )
  }

  if (playing) {
    return (
      <iframe
        ref={iframeRef}
        style={{ ...fillStyle, border: 'none' }}
        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`}
        title={posterAlt}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        tabIndex={0}
      />
    )
  }

  return (
    <button
      type="button"
      style={{ ...fillStyle, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate() }
      }}
      aria-label={`Play video: ${posterAlt}`}
    >
      <Image
        src={posterSrc}
        alt={posterAlt}
        fill
        className={imageClassName}
        sizes="(max-width: 860px) 100vw, 50vw"
        style={{ objectFit: 'cover', opacity: 0.92 }}
      />
      <span className={overlayClassName} aria-hidden="true">
        <span className={playBtnClassName}>
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M8 5v14l11-7z" fill="#0E1530" />
          </svg>
        </span>
      </span>
    </button>
  )
}
