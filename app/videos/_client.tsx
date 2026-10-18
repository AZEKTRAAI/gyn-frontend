'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import Image from 'next/image'
import type { VideoEntry } from './page'

const CATEGORIES = ['all', 'highlights', 'speakers', 'testimonials'] as const
type Category = (typeof CATEGORIES)[number]

interface Props {
  videos: VideoEntry[]
}

export function VideosClient({ videos }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [openId, setOpenId] = useState<string | null>(searchParams.get('v'))
  const dlgRef = useRef<HTMLDialogElement>(null)

  // Sync dialog with openId
  useEffect(() => {
    const dlg = dlgRef.current
    if (!dlg) return
    if (openId) {
      if (!dlg.open) dlg.showModal()
      // Update URL without navigation
      const params = new URLSearchParams(searchParams.toString())
      params.set('v', openId)
      window.history.replaceState(null, '', `${pathname}?${params}`)
    } else {
      if (dlg.open) dlg.close()
      // Remove param
      window.history.replaceState(null, '', pathname)
    }
  }, [openId, pathname, searchParams])

  // Listen for dialog close (Esc key)
  useEffect(() => {
    const dlg = dlgRef.current
    if (!dlg) return
    const onClose = () => setOpenId(null)
    dlg.addEventListener('close', onClose)
    return () => dlg.removeEventListener('close', onClose)
  }, [])

  const filtered = activeCategory === 'all'
    ? videos
    : videos.filter((v) => v.category === activeCategory)

  const openVideo = videos.find((v) => v.youtubeId === openId)

  function onBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dlgRef.current) setOpenId(null)
  }

  return (
    <>
      {/* Filter chips */}
      <div
        role="group"
        aria-label="Filter videos by category"
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            aria-pressed={activeCategory === cat}
            className={activeCategory === cat ? 'btn btn-n' : 'btn btn-g'}
            style={{ minHeight: '36px', padding: '0.375rem 1rem', fontSize: '0.875rem' }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Video grid — rounded cards with yellow pill category label */}
      <div className="vid-grid">
        {filtered.map((v) => (
          <div key={v.youtubeId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => setOpenId(v.youtubeId)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'block',
                width: '100%',
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--field)' }}>
                <Image
                  src={v.thumbnail || `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 90vw, (max-width: 1280px) 33vw, 400px"
                  style={{ objectFit: 'cover' }}
                  loading="lazy"
                />
                {/* Play icon overlay */}
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(14,21,48,.18)', /* scrim */
                    transition: 'background 160ms ease',
                  }}
                  className="vid-play-overlay"
                >
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
                    <circle cx="22" cy="22" r="22" fill="rgba(255,255,255,.92)" />
                    <polygon points="18,14 34,22 18,30" fill="var(--ink)" />
                  </svg>
                </span>
              </div>
              <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
                {/* Yellow pill category label */}
                <span
                  style={{
                    display: 'inline-block',
                    background: 'var(--yellow)',
                    color: 'var(--ink)',
                    borderRadius: '999px',
                    padding: '0.2rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                  }}
                >
                  {v.category.charAt(0).toUpperCase() + v.category.slice(1)}
                </span>
                <span style={{ fontFamily: 'var(--fd)', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3, display: 'block' }}>
                  {v.title}
                </span>
              </div>
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: 'var(--navy)', fontSize: '0.9375rem', marginTop: '2rem', opacity: 0.65 }}>
          No videos in this category yet.
        </p>
      )}

      {/* Video modal */}
      <dialog
        ref={dlgRef}
        onClick={onBackdropClick}
        aria-label={openVideo ? `Playing: ${openVideo.title}` : 'Video player'}
        style={{
          background: 'var(--ink)',
          maxWidth: '800px',
          width: '100%',
          border: 'none',
          padding: 0,
          borderRadius: '20px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,.1)',
          }}
        >
          <span style={{ fontFamily: 'var(--fd)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--white)' }}>
            {openVideo?.title}
          </span>
          <button
            onClick={() => setOpenId(null)}
            aria-label="Close video"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,.65)',
              cursor: 'pointer',
              fontSize: '1.25rem',
              padding: '0.25rem',
              flexShrink: 0,
            }}
          >
            &#10005;
          </button>
        </div>
        {openId && (
          <div style={{ aspectRatio: '16/9', background: '#000' }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${openId}?autoplay=1&rel=0`}
              title={openVideo?.title ?? 'Video'}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        )}
      </dialog>

      <style>{`
        dialog::backdrop { background: rgba(14,21,48,.92); }
        .vid-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          dialog { max-width: 95vw; }
          .vid-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 1024px) and (min-width: 769px) {
          .vid-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .vid-play-overlay:hover { background: rgba(14,21,48,.32) !important; }
      `}</style>
    </>
  )
}
