/**
 * /videos — All 9 videos, filterable by category, deep-linkable via ?v=<youtubeId>.
 * Decision D43: videos page added; footer nav updated.
 * Opening a video sets ?v=youtubeId in the URL (replaceState, no reload).
 * Closing removes the param. Keyboard: Enter/Space on card opens; Esc closes.
 */
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { cms } from '@/lib/cms'
import { PageHero } from '@/components/PageHero'
import { LoopVideo } from '@/components/LoopVideo'
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
    <main id="main">
      <PageHero
        title="*Summit* videos"
        lead="Highlights, speaker sessions, and delegate testimonials from GYN summits."
        tone="field"
        media={
          // seamless 3D loop rendered on the same #EEF2F6 as the hero, so it has no visible edge
          <div style={{ aspectRatio: '1 / 1', width: 'min(100%, 520px)', marginInline: 'auto' }}>
            <LoopVideo base="/renders/r3/morph-loop" />
          </div>
        }
      />

      <section style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          {/* VideosClient reads ?v= from the URL, so it renders client-side; the fallback keeps the list in the static HTML */}
          <Suspense
            fallback={
              <ul>
                {videos.map((v) => (
                  <li key={v.youtubeId}>
                    <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`}>{v.title}</a>
                  </li>
                ))}
              </ul>
            }
          >
            <VideosClient videos={videos} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
