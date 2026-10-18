/**
 * /videos — All 9 videos, filterable by category, deep-linkable via ?v=<youtubeId>.
 * Decision D43: videos page added; footer nav updated.
 * Opening a video sets ?v=youtubeId in the URL (replaceState, no reload).
 * Closing removes the param. Keyboard: Enter/Space on card opens; Esc closes.
 */
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import { PageHero } from '@/components/PageHero'
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
        kicker="GYN films"
        title="*Summit* videos"
        lead="Highlights, speaker sessions, and delegate testimonials from GYN summits."
      />

      <section
        aria-labelledby="videos-hd"
        data-name="All videos"
        style={{ background: 'var(--field)', paddingBlock: 'var(--sp)' }}
      >
        <div className="wrap">
          <h2 id="videos-hd" className="d2" style={{ marginBottom: '2rem' }}>
            All videos
          </h2>
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

      {/* Yellow closing band — links to SISM 2026 registration */}
      <section
        className="band-y"
        data-name="Join SISM 2026"
        aria-labelledby="vid-cta-hd"
        style={{ paddingBlock: 'var(--sp)', textAlign: 'center' }}
      >
        <div className="wrap">
          <p className="kick">Register now</p>
          <h2 id="vid-cta-hd" className="d2" style={{ marginBottom: '1.5rem' }}>
            See it for yourself
          </h2>
          <Link href="/sism-2026" className="btn btn-n">
            See the 2026 programme
          </Link>
        </div>
      </section>
    </main>
  )
}
