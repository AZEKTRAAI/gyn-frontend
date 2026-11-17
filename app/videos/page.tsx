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
import { GALLERY } from '@/features/media/media'
import { PageBox } from '@/components/pages/PageBox'
import { PageSection } from '@/components/pages/PageSection'
import { PageClosing } from '@/components/pages/PageClosing'
import { VideosClient } from './_client'
import s from './page.module.css'

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

// four Bangkok summit photos for the sides of the box
const PHOTOS = [0, 6, 2, 10].map((i) => ({ src: GALLERY[i].src, alt: GALLERY[i].alt }))

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
      <PageBox
        id="videos-h1"
        kicker="GYN films"
        title="*Summit* videos"
        lead="Highlights, speaker sessions, and delegate testimonials from GYN summits."
        photos={PHOTOS}
      />

      <PageSection id="videos" heading="Pick a *video* to play" glow>
        {/* VideosClient reads ?v= from the URL, so it renders client-side; the fallback keeps the list in the static HTML */}
        <Suspense
          fallback={
            <ul className={s.fallback}>
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
      </PageSection>

      <PageClosing id="video-cta" name="Join SISM 2026" heading="*See* it for yourself">
        <Link href="/sism-2026" className="btn btn-y">
          See the 2026 programme <span aria-hidden="true">&rarr;</span>
        </Link>
      </PageClosing>
    </main>
  )
}
