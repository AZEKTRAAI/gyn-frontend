'use client'

import { useState } from 'react'
import { CoverflowVideos, type VideoItem } from '@/components/premium/CoverflowVideos'

// Testimonial shorts from content/pages/sism-2026.md
const VIDEO_IDS = [
  'cO1D5dJFops',
  'eeFq13x-_rQ',
  '-UwHA0DhXkA',
  'vcwp4HK7UeI',
  'T5Xrp8KcqOY',
  'q-nYUFwEdo4',
]

const ITEMS: VideoItem[] = VIDEO_IDS.map((id, i) => ({
  id,
  title: `Testimonial ${i + 1} — SISM 2026 delegate`,
  category: 'Delegate voice',
  thumbnailSrc: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
}))

export function SismVideos() {
  const [open, setOpen] = useState<VideoItem | null>(null)

  return (
    <>
      <CoverflowVideos items={ITEMS} onOpen={setOpen} heading="Hear from past delegates" />

      {open && (
        <dialog
          open
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(14,21,48,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', width: '100%', height: '100%', maxWidth: '100%' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(null) }}
        >
          <div style={{ position: 'relative', width: 'min(560px,90vw)', background: 'var(--navy-900)' }}>
            <button
              onClick={() => setOpen(null)}
              aria-label="Close video"
              style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: 'var(--white)', fontSize: '1.5rem', cursor: 'pointer', zIndex: 1, lineHeight: 1 }}
            >
              &#10005;
            </button>
            <div style={{ aspectRatio: '9/16' }}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${open.id}?autoplay=1&rel=0`}
                title={open.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            </div>
          </div>
        </dialog>
      )}
    </>
  )
}
