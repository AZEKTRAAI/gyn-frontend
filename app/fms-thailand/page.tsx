import type { Metadata } from 'next'
import Image from 'next/image'
import { cms } from '@/lib/cms'
import { HorizontalGallery, type GalleryPhoto } from '@/components/premium/HorizontalGallery'
import { TransitionLink } from '@/components/premium/PageTransition'
import { HomeVideosSection } from '@/components/HomeVideosSection'
import { type VideoItem } from '@/components/premium/CoverflowVideos'
import { GALLERY, SPEAKERS, ADVISORY, LOGOS } from '@/features/media/media'
import { PageHero } from '@/components/PageHero'
import { FmstSpeakers, type SpeakerEntry } from './_speakers'

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

  // Speaker image lookup: check SPEAKERS manifest, then ADVISORY board, by last name.
  // Wenbo Li and Sura Fitiani are in ADVISORY (their /media/advisory/ paths 404ed — RT fix).
  // Speakers with no matching image get the GYN logo placeholder; never a gallery photo.
  const speakerSrcMap: Record<string, string> = {
    'Ashley Blake': SPEAKERS['speaker.ashley-blake']?.src ?? '',
    'Wenbo Li': ADVISORY['advisory.wenbo-li']?.src ?? '',
    'Sura Fitiani': ADVISORY['advisory.sura-fitiani']?.src ?? '',
  }

  const fmstSpeakers: SpeakerEntry[] = fmst.speakers.map((s) => {
    const lastName = s.name.split(' ').pop()?.toLowerCase() ?? ''
    const imgSrc = speakerSrcMap[s.name]
      ?? Object.values(SPEAKERS).find((x) => x.alt.toLowerCase().includes(lastName))?.src
      ?? Object.values(ADVISORY).find((x) => x.alt.toLowerCase().includes(lastName))?.src
      ?? LOGOS['logo.gyn'].src // no headshot: use GYN logo, never a gallery photo

    return {
      id: s.name.toLowerCase().replace(/\s+/g, '-'),
      name: s.name,
      role: s.title,
      imageSrc: imgSrc,
      imageAlt: s.name,
    }
  })

  const galleryPhotos: GalleryPhoto[] = GALLERY.map((p) => ({
    id: p.src,
    src: p.src,
    alt: p.alt,
    caption: 'FutureMinds Summit, Bangkok, July 2026',
  }))

  const speakerCount = fmst.speakersCount ?? fmst.speakers.length

  return (
    <main id="main">

      {/* HERO */}
      <PageHero
        title="FutureMinds *Summit* Thailand 2026"
        lead="The inaugural GYN summit. Four days in Bangkok exploring sustainability through innovative minds."
        meta={
          <>
            <span>July 16–19, 2026</span>
            <span>{fmst.venue}, {fmst.city}</span>
            <span>70+ participants</span>
            <span>{speakerCount} speakers</span>
          </>
        }
        actions={
          <>
            <a href="#chapters" className="btn btn-y">Programme chapters</a>
            <a href="#schedule" className="btn btn-g">4-day schedule</a>
          </>
        }
        media={
          <Image
            src="/media/gallery/fmst-dsc01881-1.webp"
            alt="Delegates at FutureMinds Summit, Bangkok, July 2026"
            width={760}
            height={506}
            priority
            sizes="(max-width: 900px) 100vw, 45vw"
            style={{ objectFit: 'cover' }}
          />
        }
        tone="field"
      />

      {/* PAST SUMMIT label */}
      <div style={{ background: 'var(--field)', paddingTop: 0, paddingBottom: 0 }}>
        <div className="wrap" style={{ paddingBlock: '0.75rem 0' }}>
          <span
            style={{
              display: 'inline-block',
              background: 'var(--crimson-600)',
              color: 'var(--white)',
              fontFamily: 'var(--fd)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              padding: '0.25rem 0.75rem',
              letterSpacing: '0.08em',
            }}
          >
            PAST SUMMIT
          </span>
        </div>
      </div>

      {/* CHAPTERS */}
      <section id="chapters" aria-labelledby="chap-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <h2 id="chap-hd" className="d2" style={{ color: 'var(--ink)', marginBottom: 'clamp(32px,4vw,48px)' }}>
            Programme chapters
          </h2>
          {/* Ruled grid */}
          <div
            style={{
              borderTop: '1px solid rgba(14,21,48,.12)',
              borderLeft: '1px solid rgba(14,21,48,.12)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 480px), 1fr))',
            }}
          >
            {fmst.chapters.map((ch: FmstChapter) => (
              <div
                key={ch.label}
                style={{
                  borderRight: '1px solid rgba(14,21,48,.12)',
                  borderBottom: '1px solid rgba(14,21,48,.12)',
                  padding: '1.75rem 2rem',
                }}
              >
                <p style={{
                  fontFamily: 'var(--fd)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--crimson-600)',
                  letterSpacing: '0.08em',
                  marginBottom: '0.5rem',
                }}>
                  {ch.label.toUpperCase()}
                </p>
                <h3 style={{
                  fontFamily: 'var(--fd)',
                  fontSize: 'clamp(1rem,1.6vw,1.25rem)',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  lineHeight: 1.2,
                  marginBottom: '0.5rem',
                }}>
                  {ch.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--navy)', lineHeight: 1.65, marginBottom: '1rem' }}>
                  {ch.text}
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {ch.sessions.map((s: FmstSession) => (
                    <li key={s.title} style={{ display: 'grid', gridTemplateColumns: '6rem 1fr', gap: '0.5rem', fontSize: '0.8125rem', alignItems: 'baseline' }}>
                      <span style={{
                        fontFamily: 'var(--fd)',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: 'var(--n-600)',
                        letterSpacing: '0.05em',
                        paddingTop: '0.15em',
                      }}>
                        {s.type.toUpperCase()}
                      </span>
                      <span style={{ color: 'var(--ink)', lineHeight: 1.5 }}>{s.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <HorizontalGallery photos={galleryPhotos} heading="A glimpse into FMST 2026" />

      {/* SPEAKERS */}
      <section aria-labelledby="spk-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <h2 id="spk-hd" className="d2" style={{ color: 'var(--ink)', marginBottom: 'clamp(32px,4vw,48px)' }}>
            {speakerCount} speakers. One summit.
          </h2>
          <FmstSpeakers speakers={fmstSpeakers} />
        </div>
      </section>

      {/* SCHEDULE */}
      <section id="schedule" aria-labelledby="sched-hd" style={{ background: 'var(--field)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <h2 id="sched-hd" className="d2" style={{ color: 'var(--ink)', marginBottom: 'clamp(32px,4vw,48px)' }}>
            Four days on the ground
          </h2>
          {/* Ruled 4-column grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              borderTop: '1px solid rgba(14,21,48,.15)',
              borderLeft: '1px solid rgba(14,21,48,.15)',
            }}
            className="sched-grid"
          >
            {fmst.schedule.map((day: FmstScheduleDay) => (
              <div
                key={day.day}
                style={{
                  borderRight: '1px solid rgba(14,21,48,.15)',
                  borderBottom: '1px solid rgba(14,21,48,.15)',
                  padding: '1.5rem',
                  background: 'var(--white)',
                }}
              >
                <p style={{
                  fontFamily: 'var(--fd)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--n-600)',
                  letterSpacing: '0.06em',
                  marginBottom: '0.25rem',
                }}>
                  {(day.dateDisplay ?? day.date).toUpperCase()}
                </p>
                <h3 style={{
                  fontFamily: 'var(--fd)',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  lineHeight: 1.2,
                  marginBottom: '1rem',
                  borderBottom: '2px solid var(--navy)',
                  paddingBottom: '0.75rem',
                }}>
                  {day.day}
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {day.items.map((item: FmstScheduleItem) => (
                    <li key={item.title}>
                      <p style={{ fontFamily: 'var(--fd)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.2rem' }}>
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
        <section aria-labelledby="vid-hd-fmst" style={{ background: 'var(--ink)', paddingBlock: 'var(--sp)' }}>
          <div className="wrap">
            <h2 id="vid-hd-fmst" className="d2" style={{ color: 'var(--white)', marginBottom: '2rem' }}>
              Bangkok, July 2026. We were there.
            </h2>
            <HomeVideosSection items={pageVideos} heading="FMST 2026 videos" />
          </div>
        </section>
      )}

      {/* CTA TO SISM 2026 */}
      <section aria-label="Join us at SISM 2026" style={{ background: 'var(--yellow)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap cta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
          <div>
            <h2 className="d2" style={{ color: 'var(--ink)', marginBottom: '1rem' }}>
              The next chapter
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--ink)', lineHeight: 1.7, opacity: 0.8 }}>
              Building on what we started in Bangkok, SISM Malaysia 2026 brings 100 delegates to Kuala Lumpur. 19 to 22 November 2026.
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

      <style>{`
        @media (max-width: 767px) {
          .sched-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .cta-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .sched-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
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
