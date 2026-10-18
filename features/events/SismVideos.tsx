'use client'

import { ShortsRow } from '@/components/ShortsRow'
import type { VideoItem } from '@/components/premium/CoverflowVideos'

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
  return (
    <ShortsRow
      items={ITEMS}
      heading="Hear from past delegates"
    />
  )
}
