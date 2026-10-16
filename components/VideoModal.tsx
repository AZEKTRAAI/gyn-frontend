'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

interface Video {
  youtubeId: string
  title: string
  thumbnail: string
}

interface Props {
  featured: Video
  rail: Video[]
}

export function VideoModal({ featured, rail }: Props) {
  const [active, setActive] = useState<Video | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  function open(v: Video) {
    setActive(v)
    dialogRef.current?.showModal()
  }

  function close() {
    dialogRef.current?.close()
    setActive(null)
  }

  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    const onClose = () => setActive(null)
    dlg.addEventListener('close', onClose)
    return () => dlg.removeEventListener('close', onClose)
  }, [])

  // Close on Escape (native dialog handles it) and on backdrop click
  function onDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) close()
  }

  return (
    <>
      <div
        className="vid-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.65fr 1fr',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* Featured */}
        <div>
          <button
            onClick={() => open(featured)}
            style={{
              display: 'block',
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              background: '#000',
              border: 'none',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
            aria-label={`Play: ${featured.title}`}
          >
            <Image
              src={featured.thumbnail}
              alt={featured.title}
              fill
              style={{ objectFit: 'cover', transition: 'transform 280ms ease' }}
            />
            <PlayIcon />
          </button>
          <p style={{ marginTop: '0.75rem', fontSize: '0.9375rem', color: 'var(--white)', fontWeight: 500 }}>
            {featured.title}
          </p>
        </div>

        {/* Rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rail.map((v) => (
            <button
              key={v.youtubeId}
              onClick={() => open(v)}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                background: 'rgba(255,255,255,.06)',
                border: 'none',
                cursor: 'pointer',
                padding: '0.75rem',
                width: '100%',
                textAlign: 'left',
                transition: 'background-color 160ms ease',
              }}
              aria-label={`Play: ${v.title}`}
            >
              <div style={{ position: 'relative', width: '80px', height: '52px', flexShrink: 0 }}>
                <Image src={v.thumbnail} alt={v.title} fill style={{ objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.8)', lineHeight: 1.45 }}>
                {v.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal using native <dialog> */}
      <dialog
        ref={dialogRef}
        onClick={onDialogClick}
        style={{
          background: 'var(--navy-800)',
          maxWidth: '720px',
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
          <span style={{ fontFamily: 'var(--fd)', fontSize: '1rem', color: 'var(--white)' }}>
            {active?.title}
          </span>
          <button
            onClick={close}
            aria-label="Close video"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,.65)',
              cursor: 'pointer',
              fontSize: '1.25rem',
              padding: '0.25rem',
              flexShrink: 0,
              transition: 'color 140ms ease',
            }}
          >
            &#10005;
          </button>
        </div>
        {active && (
          <div style={{ aspectRatio: '16/9', background: '#000' }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?autoplay=1&rel=0`}
              title={active.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        )}
      </dialog>

      <style>{`
        dialog::backdrop {
          background: rgba(14, 21, 48, 0.92);
        }
        @media (max-width: 768px) {
          dialog { max-width: 95vw; }
        }
      `}</style>
    </>
  )
}

function PlayIcon() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '56px',
        height: '56px',
        background: 'var(--yellow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden="true">
        <path d="M0 0 L16 9 L0 18 Z" fill="var(--navy-900)" />
      </svg>
    </div>
  )
}
