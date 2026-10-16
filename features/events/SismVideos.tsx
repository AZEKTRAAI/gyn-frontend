'use client'

import { useEffect, useRef, useState } from 'react'
import { CoverflowVideos, type VideoItem } from '@/components/premium/CoverflowVideos'

// Titles from content/media.json (sism-2026 testimonialShorts). Category: FutureMinds Summit Thailand speakers/delegates.
const ITEMS: VideoItem[] = [
  { id: 'cO1D5dJFops', title: 'Sura Fitiani, speaker from Palestine', category: 'FutureMinds Summit, Bangkok, July 2026', thumbnailSrc: 'https://i.ytimg.com/vi/cO1D5dJFops/hqdefault.jpg' },
  { id: 'eeFq13x-_rQ', title: 'Dr. Suman Roy, Most Energetic Speaker at FutureMinds Summit', category: 'FutureMinds Summit, Bangkok, July 2026', thumbnailSrc: 'https://i.ytimg.com/vi/eeFq13x-_rQ/hqdefault.jpg' },
  { id: '-UwHA0DhXkA', title: 'Speaker testimonial, Future Minds Summit 2026', category: 'FutureMinds Summit, Bangkok, July 2026', thumbnailSrc: 'https://i.ytimg.com/vi/-UwHA0DhXkA/hqdefault.jpg' },
  { id: 'vcwp4HK7UeI', title: 'Special guest testimonial, Future Minds Summit 2026', category: 'FutureMinds Summit, Bangkok, July 2026', thumbnailSrc: 'https://i.ytimg.com/vi/vcwp4HK7UeI/hqdefault.jpg' },
  { id: 'T5Xrp8KcqOY', title: 'Tejaswini shares her experience at Future Minds Summit 2026', category: 'FutureMinds Summit, Bangkok, July 2026', thumbnailSrc: 'https://i.ytimg.com/vi/T5Xrp8KcqOY/hqdefault.jpg' },
  { id: 'q-nYUFwEdo4', title: 'Future Minds Summit 2026, Bangkok, Thailand', category: 'FutureMinds Summit, Bangkok, July 2026', thumbnailSrc: 'https://i.ytimg.com/vi/q-nYUFwEdo4/hqdefault.jpg' },
]

export function SismVideos() {
  const [open, setOpen] = useState<VideoItem | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  // remember the element that triggered the modal so we can return focus (RT-051)
  const triggerRef = useRef<HTMLElement | null>(null)

  const handleOpen = (item: VideoItem) => {
    triggerRef.current = document.activeElement as HTMLElement
    setOpen(item)
  }

  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (open) {
      // showModal() gives native Esc handling and focus trap (RT-051)
      dlg.showModal()
    } else {
      dlg.close()
      triggerRef.current?.focus()
    }
  }, [open])

  // close on backdrop click (outside the inner box)
  function onDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) setOpen(null)
  }

  return (
    <>
      <CoverflowVideos items={ITEMS} onOpen={handleOpen} heading="Hear from FMS Thailand speakers and delegates" />

      {/* RT-051: real modal — showModal() gives Esc + focus trap natively */}
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(null)}
        onClick={onDialogClick}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(14,21,48,.92)',
          // an inline display overrides the closed dialog's display:none, so only set it while open
          display: open ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          padding: 0,
        }}
      >
        {open && (
          <div style={{
            position: 'relative',
            // 9:16 shorts: width also bounded by viewport height so the close button stays on screen on laptops (RT-080)
            width: 'min(560px, 90vw, calc((100dvh - 7rem) * 9 / 16))',
            background: 'var(--navy-900)',
          }}>
            <button
              onClick={() => setOpen(null)}
              aria-label="Close video"
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: 'none',
                border: 'none',
                color: 'var(--white)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                zIndex: 1,
                lineHeight: 1,
              }}
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
        )}
      </dialog>
    </>
  )
}
