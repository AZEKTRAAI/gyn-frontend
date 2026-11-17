'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import Image from 'next/image'
import type { VideoEntry } from './page'
import s from './page.module.css'

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
      <div role="group" aria-label="Filter videos by category" className={s.filters}>
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} aria-pressed={activeCategory === cat} className={s.chip}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Video grid: glass cards, lime category pill */}
      <ul className={s.grid}>
        {filtered.map((v) => (
          <li key={v.youtubeId} className={`glass-lite ${s.card}`}>
            <button onClick={() => setOpenId(v.youtubeId)} className={s.cardBtn}>
              <span className={s.thumb}>
                <Image
                  src={v.thumbnail || `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 90vw, (max-width: 1280px) 33vw, 400px"
                  style={{ objectFit: 'cover' }}
                  loading="lazy"
                />
                <span aria-hidden="true" className={s.play}>
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                    <circle cx="22" cy="22" r="22" fill="var(--action)" />
                    <polygon points="18,14 34,22 18,30" fill="var(--ink)" />
                  </svg>
                </span>
              </span>
              <span className={s.meta}>
                <span className={s.tag}>{v.category.charAt(0).toUpperCase() + v.category.slice(1)}</span>
                <span className={s.title}>{v.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && <p className={s.empty}>No videos in this category yet.</p>}

      {/* Video modal */}
      <dialog ref={dlgRef} onClick={onBackdropClick} aria-label={openVideo ? `Playing: ${openVideo.title}` : 'Video player'} className={s.dialog}>
        <div className={s.dialogBar}>
          <span>{openVideo?.title}</span>
          <button onClick={() => setOpenId(null)} aria-label="Close video">&#10005;</button>
        </div>
        {openId && (
          <div className={s.frame}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${openId}?autoplay=1&rel=0`}
              title={openVideo?.title ?? 'Video'}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </dialog>
    </>
  )
}
