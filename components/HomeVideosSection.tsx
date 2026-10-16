'use client'

/**
 * HomeVideosSection — wraps CoverflowVideos with an inline <dialog> player.
 * Opens on card activate; closes on Escape or backdrop click.
 * Decision D44: uses its own dialog rather than wrapping VideoModal to keep
 * state ownership local and avoid prop-drilling the dialog ref.
 */

import { useEffect, useRef, useState } from 'react'
import { CoverflowVideos, type VideoItem } from '@/components/premium/CoverflowVideos'

interface Props {
  items: VideoItem[]
  heading?: string
}

export function HomeVideosSection({ items, heading }: Props) {
  const [open, setOpen] = useState<VideoItem | null>(null)
  const dlgRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dlg = dlgRef.current
    if (!dlg) return
    if (open) {
      if (!dlg.open) dlg.showModal()
    } else {
      if (dlg.open) dlg.close()
    }
  }, [open])

  useEffect(() => {
    const dlg = dlgRef.current
    if (!dlg) return
    const onClose = () => setOpen(null)
    dlg.addEventListener('close', onClose)
    return () => dlg.removeEventListener('close', onClose)
  }, [])

  function onBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dlgRef.current) setOpen(null)
  }

  return (
    <>
      <CoverflowVideos items={items} onOpen={setOpen} heading={heading} />

      <dialog
        ref={dlgRef}
        onClick={onBackdropClick}
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
            {open?.title}
          </span>
          <button
            onClick={() => setOpen(null)}
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
        {open && (
          <div style={{ aspectRatio: '16/9', background: '#000' }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${open.id}?autoplay=1&rel=0`}
              title={open.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        )}
      </dialog>

      <style>{`
        dialog::backdrop { background: rgba(14,21,48,.92); }
        @media (max-width: 768px) { dialog { max-width: 95vw; } }
      `}</style>
    </>
  )
}
