/**
 * /videos — All 9 videos, filterable by category, deep-linkable via ?v=<youtubeId>.
 * Decision D26: videos page added; footer nav updated.
 * Opening a video sets ?v=youtubeId in the URL (replaceState, no reload).
 * Closing removes the param. Keyboard: Enter/Space on card opens; Esc closes.
 */
import type { Metadata } from 'next'
import { cms } from '@/lib/cms'
import { VideosClient } from './_client'

export const metadata: Metadata = {
  title: 'Videos – GYN',
  description: 'Watch highlights, speaker sessions and delegate testimonials from GYN summits.',
  openGraph: {
    title: 'Videos – GYN',
    description: 'Watch highlights, speaker sessions and delegate testimonials from GYN summits.',
    images: [{ url: '/media/gallery/fmst-dsc01881-1.webp', width: 768, height: 512 }],
  },
}

export interface VideoEntry {
  youtubeId: string
  title: string
  thumbnail: string
  page: string
  category: string
}

export default async function VideosPage() {
  const mediaData = await cms.getMedia() as { videos: VideoEntry[] }

  // Deduplicate by youtubeId — same video appears on multiple pages
  const seen = new Set<string>()
  const videos = mediaData.videos.filter((v) => {
    if (seen.has(v.youtubeId)) return false
    seen.add(v.youtubeId)
    return true
  })

  return (
    <main id="main" style={{ background: 'var(--navy-900)', minHeight: '100vh' }}>
      <section style={{ paddingTop: 'calc(3.5rem + clamp(2rem, 5vw, 4rem))', paddingBottom: 'clamp(3rem, 6vw, 6rem)' }}>
        <div className="wrap">
          <h1 className="d1" style={{ color: 'var(--white)', marginBottom: '0.5rem' }}>
            Videos
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,.65)', marginBottom: '2.5rem' }}>
            Highlights, speaker sessions, and delegate testimonials from GYN summits.
          </p>
          <VideosClient videos={videos} />
        </div>
      </section>
    </main>
  )
}
