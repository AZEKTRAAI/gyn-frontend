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
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            aria-pressed={activeCategory === cat}
            style={{
              padding: '0.4375rem 1rem',
              fontFamily: 'var(--fb)',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: '2px solid',
              cursor: 'pointer',
              transition: 'background-color 140ms ease, color 140ms ease',
              background: activeCategory === cat ? 'var(--yellow)' : 'transparent',
              color: activeCategory === cat ? 'var(--navy-900)' : 'rgba(255,255,255,.7)',
              borderColor: activeCategory === cat ? 'var(--yellow)' : 'rgba(255,255,255,.25)',
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Video grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.25rem',
        }}
        className="vid-grid"
      >
        {filtered.map((v) => (
          <button
            key={v.youtubeId}
            onClick={() => setOpenId(v.youtubeId)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'block',
              position: 'relative',
              background: 'rgba(255,255,255,.04)',
            }}
          >
            <div style={{ position: 'relative', aspectRatio: '16/9', background: 'rgba(0,0,0,.4)' }}>
              <Image
                src={v.thumbnail || `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`}
                alt=""
                fill
                sizes="(max-width: 768px) 90vw, (max-width: 1280px) 33vw, 400px"
                style={{ objectFit: 'cover', opacity: 0.82 }}
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
                }}
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="24" fill="rgba(0,0,0,.55)" />
                  <polygon points="20,16 36,24 20,32" fill="white" />
                </svg>
              </span>
            </div>
            <div style={{ padding: '0.75rem' }}>
              <span
                style={{
                  fontFamily: 'var(--fd)',
                  fontSize: '0.625rem',
                  color: 'var(--yellow)',
                  letterSpacing: '0.06em',
                  display: 'block',
                  marginBottom: '0.25rem',
                }}
              >
                {v.category.toUpperCase()}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,.9)', lineHeight: 1.45, display: 'block' }}>
                {v.title}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '0.9375rem', marginTop: '2rem' }}>
          No videos in this category yet.
        </p>
      )}

      {/* Video modal */}
      <dialog
        ref={dlgRef}
        onClick={onBackdropClick}
        aria-label={openVideo ? `Playing: ${openVideo.title}` : 'Video player'}
        style={{
          background: 'var(--navy-800)',
          maxWidth: '800px',
          width: '100%',
          border: 'none',
          padding: 0,
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
          <span style={{ fontFamily: 'var(--fd)', fontSize: '0.9375rem', color: 'var(--white)' }}>
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
        @media (max-width: 768px) {
          dialog { max-width: 95vw; }
          .vid-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 1024px) and (min-width: 769px) {
          .vid-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </>
  )
}
