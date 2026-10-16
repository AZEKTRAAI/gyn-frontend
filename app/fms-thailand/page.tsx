import type { Metadata } from 'next'
import Image from 'next/image'
import { cms } from '@/lib/cms'
import { SplitReveal } from '@/components/premium/SplitReveal'
import { HorizontalGallery, type GalleryPhoto } from '@/components/premium/HorizontalGallery'
import { DeckSlider, type Speaker as DeckSpeaker } from '@/components/premium/DeckSlider'
import { TransitionLink } from '@/components/premium/PageTransition'
import { HomeVideosSection } from '@/components/HomeVideosSection'
import { type VideoItem } from '@/components/premium/CoverflowVideos'
import { GALLERY, SPEAKERS } from '@/features/media/media'

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await cms.getPage('fms-thailand')
  return {
    title: meta.title,
    description: meta.ogDescription,
    openGraph: {
      title: meta.ogTitle ?? meta.title,
      description: meta.ogDescription,
      images: [{ url: '/media/gallery/fmst-dsc01881-1.webp', width: 768, height: 512 }],
    },
  }
}

export default async function FmsThailandPage() {
  const eventsData = await cms.getEvents() as { events: FmstEvent[] }
  const mediaData = await cms.getMedia() as { videos: VideoEntry[] }

  const fmst = eventsData.events.find((e) => e.id === 'fmst-2026')!
  const pageVideos: VideoItem[] = (mediaData.videos as VideoEntry[])
    .filter((v) => v.page === 'fms-thailand')
    .reduce<VideoItem[]>((acc, v) => {
      if (!acc.find((x) => x.id === v.youtubeId)) {
        acc.push({ id: v.youtubeId, title: v.title, category: v.category, thumbnailSrc: v.thumbnail, thumbnailAlt: v.title })
      }
      return acc
    }, [])

  // Speaker slug → media.ts image mapping (by last name match)
  const speakerSrcMap: Record<string, string> = {
    'Ashley Blake': SPEAKERS['speaker.ashley-blake']?.src ?? '',
    'Wenbo Li': '/media/advisory/wenbo-li.webp',
    'Sura Fitiani': '/media/speakers/sura-fitiani.jpg',
  }

  const deckSpeakers: DeckSpeaker[] = fmst.speakers.map((s, i) => {
    const imgSrc = speakerSrcMap[s.name]
      ?? Object.values(SPEAKERS).find((x) => x.alt.toLowerCase().includes(s.name.split(' ')[1]?.toLowerCase() ?? ''))?.src
      ?? GALLERY[i % GALLERY.length].src

    return {
      id: s.name.toLowerCase().replace(/\s+/g, '-'),
      name: s.name,
      role: s.title,
      organisation: s.title,
      imageSrc: imgSrc,
      imageAlt: s.name,
      topic: undefined,
    }
  })

  const galleryPhotos: GalleryPhoto[] = GALLERY.map((p) => ({
    id: p.src,
    src: p.src,
    alt: p.alt,
    caption: p.alt,
  }))

  return (
    <main id="main">

      {/* HERO */}
      <section
        aria-labelledby="fmst-title"
        style={{
          background: 'var(--navy-900)',
          paddingTop: 'calc(3.5rem + clamp(2rem, 5vw, 4.5rem))',
          paddingBottom: 'clamp(3rem, 6vw, 6rem)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* background hero photo */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
          }}
        >
          <Image
            src="/media/gallery/fmst-dsc01881-1.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center top', opacity: 0.18 }}
          />
        </div>

        <div className="wrap" style={{ position: 'relative', zIndex: 1 }}>
          {/* Event badge */}
          <span
            style={{
              display: 'inline-block',
              background: 'var(--crimson-600)',
              color: 'var(--white)',
              fontFamily: 'var(--fd)',
              fontSize: '0.6875rem',
              padding: '0.25rem 0.75rem',
              letterSpacing: '0.08em',
              marginBottom: '1.25rem',
            }}
          >
            PAST SUMMIT
          </span>

          <SplitReveal
            id="fmst-title"
            lines={['FutureMinds Summit', 'Thailand 2026']}
            as="h1"
            className="d1"
            style={{ color: 'var(--white)', marginBottom: '1rem' }}
          />

          <p style={{ fontSize: 'clamp(.8rem, 1.3vw, .9375rem)', color: 'rgba(255,255,255,.75)', marginBottom: '1.5rem' }}>
            {fmst.dates.display} — {fmst.venue}, {fmst.city} — {fmst.participants}+ participants
          </p>

          <p style={{ fontSize: 'clamp(.875rem, 1.4vw, 1.0625rem)', color: 'rgba(255,255,255,.9)', lineHeight: 1.65, maxWidth: '56ch', marginBottom: '2.5rem' }}>
            The inaugural GYN summit. Four days in Bangkok uniting 70+ young leaders, researchers and innovators around four UN Sustainable Development Goals.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="#chapters" className="btn btn-y">Programme chapters</a>
            <a href="#schedule" className="btn btn-ow">4-day schedule</a>
          </div>

          {/* Quick stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
              marginTop: '3rem',
            }}
            className="fmst-stats"
          >
            {[
              { n: '70+', l: 'participants' },
              { n: String(fmst.speakersCount ?? fmst.speakers.length), l: 'speakers' },
              { n: '4', l: 'days' },
              { n: '4', l: 'chapters' },
            ].map(({ n, l }) => (
              <div key={l} style={{ borderTop: '2px solid var(--yellow)', paddingTop: '0.75rem' }}>
                <span style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: 'var(--yellow)', display: 'block', lineHeight: 1 }}>{n}</span>
                <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,.65)', marginTop: '0.25rem', display: 'block' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHAPTERS */}
      <section id="chapters" aria-labelledby="chap-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <SplitReveal id="chap-hd" lines={['Programme chapters']} as="h2" className="d2"
            style={{ color: 'var(--navy-900)', marginBottom: '3rem' }}
          />
          <div style={{ display: 'grid', gap: '2.5rem' }}>
            {fmst.chapters.map((ch: FmstChapter, i: number) => (
              <div
                key={ch.label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr',
                  gap: '2.5rem',
                  paddingBottom: '2.5rem',
                  borderBottom: i < fmst.chapters.length - 1 ? '1px solid var(--n-200)' : undefined,
                  alignItems: 'start',
                }}
                className="chap-row"
              >
                <div>
                  <span style={{ fontFamily: 'var(--fd)', fontSize: '0.6875rem', color: 'var(--crimson-600)', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
                    {ch.label.toUpperCase()}
                  </span>
                  <h3 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1rem, 1.8vw, 1.4rem)', color: 'var(--navy-900)', lineHeight: 1.2, marginBottom: '0.75rem' }}>
                    {ch.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--n-600)', lineHeight: 1.65 }}>{ch.text}</p>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {ch.sessions.map((s: FmstSession) => (
                    <li
                      key={s.title}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '7rem 1fr',
                        gap: '0.75rem',
                        fontSize: '0.875rem',
                        alignItems: 'baseline',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--fd)', fontSize: '0.625rem', color: 'var(--blue-deep)', letterSpacing: '0.05em', paddingTop: '0.2em' }}>
                        {s.type.toUpperCase()}
                      </span>
                      <span style={{ color: 'var(--n-700)', lineHeight: 1.5 }}>{s.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY — HorizontalGallery (full bleed, scroll-pinned) */}
      <HorizontalGallery photos={galleryPhotos} heading="A glimpse into FMST 2026" />

      {/* SPEAKERS — DeckSlider */}
      <section aria-labelledby="spk-hd" style={{ background: 'var(--blue-deep)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <SplitReveal id="spk-hd" lines={['12 speakers. One summit.']} as="h2" className="d2"
            style={{ color: 'var(--white)', marginBottom: '2.5rem' }}
          />
          <DeckSlider items={deckSpeakers} heading="FMST 2026 speakers" />
        </div>
      </section>

      {/* SCHEDULE */}
      <section id="schedule" aria-labelledby="sched-hd" style={{ background: 'var(--paper)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <SplitReveal id="sched-hd" lines={['Four days on the ground']} as="h2" className="d2"
            style={{ color: 'var(--navy-900)', marginBottom: '2.5rem' }}
          />
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}
            className="sched-grid"
          >
            {fmst.schedule.map((day: FmstScheduleDay) => (
              <div
                key={day.day}
                style={{
                  background: 'var(--white)',
                  padding: '1.5rem',
                  borderTop: '3px solid var(--blue-deep)',
                }}
              >
                <span style={{ fontFamily: 'var(--fd)', fontSize: '0.6875rem', color: 'var(--blue-deep)', display: 'block', marginBottom: '0.25rem', letterSpacing: '0.06em' }}>
                  {day.dateDisplay?.toUpperCase() ?? day.date}
                </span>
                <h3 style={{ fontFamily: 'var(--fd)', fontSize: '0.875rem', color: 'var(--navy-900)', lineHeight: 1.25, marginBottom: '1rem' }}>
                  {day.day}
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {day.items.map((item: FmstScheduleItem) => (
                    <li key={item.title}>
                      <p style={{ fontFamily: 'var(--fd)', fontSize: '0.75rem', color: 'var(--navy-700)', marginBottom: '0.25rem' }}>
                        {item.title}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--n-600)', lineHeight: 1.5 }}>
                        {item.text}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HIGHLIGHT VIDEOS */}
      {pageVideos.length > 0 && (
        <section aria-labelledby="vid-hd-fmst" style={{ background: 'var(--navy-900)', paddingBlock: 'var(--sp)' }}>
          <div className="wrap">
            <SplitReveal id="vid-hd-fmst" lines={['FutureMinds Summit highlights']} as="h2" className="d2"
              style={{ color: 'var(--white)', marginBottom: '2rem' }}
            />
            <HomeVideosSection items={pageVideos} heading="FMST 2026 videos" />
          </div>
        </section>
      )}

      {/* CTA TO SISM 2026 */}
      <section aria-label="Join us at SISM 2026" style={{ background: 'var(--yellow)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap cta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
          <div>
            <SplitReveal lines={['The next chapter']} as="h2" className="d2"
              style={{ color: 'var(--navy-900)', marginBottom: '1rem' }}
            />
            <p style={{ fontSize: '1rem', color: 'var(--navy-800)', lineHeight: 1.7 }}>
              Building on what we started in Bangkok, SISM Malaysia 2026 brings 100 delegates to Kuala Lumpur. 19–22 November 2026.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignSelf: 'center' }}>
            <TransitionLink href="/sism-forum-access" className="btn btn-n">
              Book Forum Access, $199
            </TransitionLink>
            <a href="/sism-2026" className="btn btn-n">
              Full SISM 2026 programme
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

/* ── Local type definitions ──────────────────────────────────── */
interface FmstSession { type: string; title: string }
interface FmstChapter { label: string; title: string; text: string; sessions: FmstSession[] }
interface FmstScheduleItem { title: string; text: string }
interface FmstScheduleDay { day: string; date: string; dateDisplay?: string; items: FmstScheduleItem[] }
interface FmstEvent {
  id: string
  name: string
  dates: { start: string; end: string; display: string }
  venue: string
  city: string
  participants?: number
  speakersCount?: number
  chapters: FmstChapter[]
  schedule: FmstScheduleDay[]
  speakers: { name: string; title: string; image: string | null; imageNote?: string }[]
  media?: { highlightVideos: string[]; gallery: string; heroImage: string }
}
interface VideoEntry {
  youtubeId: string
  title: string
  thumbnail: string
  page: string
  category: string
}
