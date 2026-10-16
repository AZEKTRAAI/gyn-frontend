import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import { Countdown } from '@/components/Countdown'
import { GlobeVideo } from '@/components/GlobeVideo'
import { SummitsSwapper } from '@/components/SummitsSwapper'
import { CountryTablist } from '@/components/CountryTablist'
import { VideoModal } from '@/components/VideoModal'
import {
  SPEAKERS,
  ADVISORY,
  AMBASSADORS,
  GALLERY,
  LOGOS,
  PARTNERS,
} from '@/features/media/media'

export const metadata: Metadata = {
  title: 'Global Youth Network – GYN',
  description:
    'SDG Innovation Summit Malaysia 2026: 100 young leaders, 19–22 November, Teedo Hotel, Kuala Lumpur. Co-hosted by UNU Global Health.',
}

export default async function HomePage() {
  const eventsData = await cms.getEvents() as { events: EventData[] }
  const mediaData = await cms.getMedia() as { videos: VideoEntry[] }

  const sism = eventsData.events.find((e: EventData) => e.id === 'sism-2026')!
  const fmst = eventsData.events.find((e: EventData) => e.id === 'fmst-2026')!

  const homeVideos = mediaData.videos.filter((v: VideoEntry) => v.page === 'sism-2026')
  const featuredVideo = homeVideos[0]
  const railVideos = homeVideos.slice(1, 4)

  return (
    <main id="main">
      {/* ===================================================
          HERO
          =================================================== */}
      <section
        aria-labelledby="hero-title"
        style={{
          background: 'var(--blue-deep)',
          paddingTop: 'calc(3.5rem + clamp(2rem, 5vw, 4.5rem))',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="wrap hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center', paddingBlock: 'clamp(2rem, 5vw, 4rem)' }}>
          <div>
            {/* Full white on #00689D = 5.45:1 (AA). rgba .7 only reached 3.81:1 — fixed. */}
            <p style={{ fontSize: 'clamp(.8rem, 1.3vw, .9375rem)', color: 'var(--white)', marginBottom: '1.25rem', lineHeight: 1.55, flexWrap: 'wrap' as const }}>
              19–22 November 2026 / Teedo Hotel, Kuala Lumpur / Co-hosted by UNU Global Health
            </p>
            <h1 id="hero-title" className="d1" style={{ color: 'var(--white)', marginBottom: '1rem' }}>
              SDG INNOVATION SUMMIT MALAYSIA 2026
            </h1>
            <p style={{ fontSize: 'clamp(.875rem, 1.4vw, 1.0625rem)', color: 'rgba(255,255,255,.9)', lineHeight: 1.65, marginBottom: '2rem' }}>
              Join 100 young leaders, innovators, students and professionals from across the globe in Kuala Lumpur. Focused on SDGs 4, 5, 9 and 13.
            </p>
            <Countdown />
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2.5rem' }}>
              <Link href="/sism-forum-access" className="btn btn-y">Book Forum Access, $199</Link>
              <Link href="/sism-2026" className="btn btn-ow">See the full programme</Link>
            </div>
          </div>

          {/* Hero visual: real delegate photo + glass-globe render as brand object */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
            <figure style={{ margin: 0 }}>
              <Image
                src="/media/gallery/fmst-dsc01881-1.webp"
                alt="Delegates at Future Minds Summit, Bangkok, July 2026"
                width={768}
                height={512}
                priority
                sizes="(max-width: 768px) 45vw, 280px"
                style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }}
              />
              <figcaption style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,.6)', marginTop: '0.375rem' }}>
                Future Minds Summit, Bangkok, July 2026
              </figcaption>
            </figure>
            <GlobeVideo />
          </div>
        </div>

        {/* Delegate photo strip — captioned correctly as Bangkok/FMS */}
        <div style={{ background: 'rgba(0,0,0,.28)', paddingBlock: '1.25rem' }}>
          <div className="wrap">
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {GALLERY.slice(1, 7).map((photo) => (
                <figure key={photo.src} style={{ flexShrink: 0, width: '110px', margin: 0 }}>
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={110}
                    height={110}
                    sizes="110px"
                    style={{ width: '110px', height: '110px', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <figcaption style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,.5)', marginTop: '0.375rem', lineHeight: 1.3 }}>
                    FutureMinds Summit, Bangkok, July 2026
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          STATS
          =================================================== */}
      <section aria-label="Summit at a glance" style={{ background: 'var(--navy-900)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div className="t-y stat-span2" style={{ padding: '1.5rem 1.25rem', gridColumn: 'span 2' }}>
              <span className="d2 stat-n" style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1, display: 'block' }}>100</span>
              <span className="stat-l" style={{ fontSize: '0.8125rem', lineHeight: 1.45, marginTop: '0.5rem', display: 'block' }}>seats (30 scholarships) — Kuala Lumpur, Nov 2026</span>
            </div>
            <div className="t-w" style={{ padding: '1.5rem 1.25rem' }}>
              <span className="d2 stat-n" style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1, display: 'block' }}>4</span>
              <span className="stat-l" style={{ fontSize: '0.8125rem', lineHeight: 1.45, marginTop: '0.5rem', display: 'block' }}>days in Kuala Lumpur, Nov 19–22</span>
            </div>
            <div className="t-c" style={{ padding: '1.5rem 1.25rem' }}>
              <span className="d2 stat-n" style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1, display: 'block' }}>8</span>
              <span className="stat-l" style={{ fontSize: '0.8125rem', lineHeight: 1.45, marginTop: '0.5rem', display: 'block' }}>confirmed speakers</span>
            </div>
            <div className="t-b" style={{ padding: '1.5rem 1.25rem' }}>
              <span className="d2 stat-n" style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1, color: 'var(--yellow)', display: 'block' }}>17</span>
              <span className="stat-l" style={{ fontSize: '0.8125rem', lineHeight: 1.45, marginTop: '0.5rem', display: 'block', color: 'rgba(255,255,255,.75)' }}>countries represented by advisors and ambassadors</span>
            </div>
            <div className="t-b" style={{ padding: '1.5rem 1.25rem' }}>
              <span className="d2 stat-n" style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1, color: 'var(--yellow)', display: 'block' }}>$1,000</span>
              <span className="stat-l" style={{ fontSize: '0.8125rem', lineHeight: 1.45, marginTop: '0.5rem', display: 'block', color: 'rgba(255,255,255,.75)' }}>seed grant for the best delegate project</span>
            </div>
            <div className="t-y" style={{ padding: '1.5rem 1.25rem' }}>
              <span className="d2 stat-n" style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1, display: 'block' }}>2</span>
              <span className="stat-l" style={{ fontSize: '0.8125rem', lineHeight: 1.45, marginTop: '0.5rem', display: 'block' }}>GYN summits since 2026</span>
            </div>
            <div className="t-w" style={{ padding: '1.5rem 1.25rem' }}>
              <span className="d2 stat-n" style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1, display: 'block' }}>70+</span>
              <span className="stat-l" style={{ fontSize: '0.8125rem', lineHeight: 1.45, marginTop: '0.5rem', display: 'block' }}>delegates at FutureMinds Summit Thailand 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          WHO WE ARE
          =================================================== */}
      <section aria-labelledby="who-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap who-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(2rem, 5vw, 4rem)', alignItems: 'start' }}>
          <div>
            <h2 id="who-hd" className="d2" style={{ color: 'var(--navy-700)', marginBottom: '1.5rem' }}>Who we are and what we do</h2>
            <p style={{ color: 'var(--n-700)', fontSize: '1rem', lineHeight: 1.75 }}>
              Global Youth Network (GYN) is an international organization dedicated to connecting young people worldwide. We bring together students, professionals, and innovators to collaborate across borders, develop leadership skills, and create meaningful global impact.
            </p>
          </div>
          <ul style={{ listStyle: 'none' }}>
            {[
              { title: 'Conferences', body: 'GYN hosts international forums, workshops and summits to promote dialogue on Sustainable Development Goals.' },
              { title: 'Networking', body: 'Providing a collaborative space of mentorship, technical support and resource sharing to address pressing global challenges.' },
              { title: 'Leadership Development', body: 'Building a new generation of leaders with the foresight, integrity and skills for measurable global impact.' },
              { title: 'Youth Mentoring', body: 'Providing tailor-made, hands-on mentoring to help youth become effective leaders.' },
              { title: 'Workshops & Trainings', body: 'Building leadership capacities and policy expertise for future-ready governance.' },
            ].map((item) => (
              <li
                key={item.title}
                style={{
                  paddingBlock: '0.875rem',
                  borderBottom: '1px solid var(--n-200)',
                }}
              >
                <p style={{ fontFamily: 'var(--fd)', fontSize: '0.875rem', color: 'var(--navy-700)', marginBottom: '0.25rem' }}>{item.title}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--n-600)', lineHeight: 1.6 }}>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===================================================
          WHERE WE'RE FROM
          =================================================== */}
      <section aria-labelledby="from-hd" style={{ background: 'var(--paper)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <h2 id="from-hd" className="d2" style={{ color: 'var(--navy-900)', marginBottom: '0.75rem' }}>Where we&apos;re from</h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--n-600)', marginBottom: '2rem' }}>
            12 ambassadors representing 11 countries, alongside 8 advisors from 9 countries.
          </p>
          <CountryTablist
            tabs={[
              {
                id: 'ambassadors',
                label: 'Ambassadors',
                people: Object.entries(AMBASSADORS).map(([, v]) => ({
                  name: v.alt.split(',')[0].replace('GYN Ambassador', '').trim(),
                  role: 'GYN Ambassador',
                  country: v.country,
                  image: v,
                })),
              },
              {
                id: 'advisory',
                label: 'Advisory Board',
                people: Object.entries(ADVISORY).map(([, v]) => ({
                  name: v.alt.split(',')[0].trim(),
                  role: v.alt.split(',').slice(1).join(',').trim(),
                  country: v.alt.includes(',') ? v.alt.split(',').pop()?.trim() ?? '' : '',
                  image: v,
                })),
              },
            ]}
          />
        </div>
      </section>

      {/* ===================================================
          SUMMITS
          =================================================== */}
      <section aria-labelledby="summits-hd" style={{ background: 'var(--blue-deep)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <h2 id="summits-hd" className="d2" style={{ color: 'var(--white)', marginBottom: '2rem' }}>GYN summits</h2>
          <SummitsSwapper
            summits={[
              {
                id: 'sism-2026',
                name: sism.name,
                dates: sism.dates.display,
                status: 'open',
                photo: '/media/hero/sism-2026-hero-visual.webp',
                photoAlt: 'SDG Innovation Summit Malaysia 2026',
                description: `${sism.seats} young leaders at ${sism.venue}, ${sism.city}. Theme: ${sism.theme}.`,
                ctaLabel: 'Book Forum Access, $199',
                ctaHref: '/sism-forum-access',
              },
              {
                id: 'fmst-2026',
                name: fmst.name,
                dates: fmst.dates.display,
                status: 'past',
                photo: '/media/gallery/fmst-dsc01881-1.webp',
                photoAlt: 'FutureMinds Summit Thailand, Bangkok 2026',
                description: `Over ${fmst.participants} participants at ${fmst.venue}, ${fmst.city}. Theme: ${fmst.summitTheme}.`,
              },
            ]}
          />
        </div>
      </section>

      {/* ===================================================
          SDG FOCUS
          =================================================== */}
      <section aria-labelledby="sdg-hd" style={{ background: 'var(--yellow)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <h2 id="sdg-hd" className="d2" style={{ color: 'var(--navy-900)', marginBottom: '0.75rem' }}>4 SDGs. 1 sustainable future.</h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--navy-800)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '60ch' }}>
            At GYN, we focus on four Sustainable Development Goals as education, gender equality, industry innovation and infrastructure, and climate action, uniting young leaders worldwide to create impactful solutions.
          </p>
          <div className="sdg-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr', gap: '1rem' }}>
            {sism.focusSdgs.map((sdg: FocusSdg) => (
              <div
                key={sdg.sdg}
                style={{
                  background: 'var(--navy-900)',
                  padding: '1.75rem 1.25rem',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--fd)',
                    fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: sdg.sdg === 'SDG 4' ? 'var(--sdg4)'
                         : sdg.sdg === 'SDG 5' ? 'var(--sdg5)'
                         : sdg.sdg === 'SDG 9' ? 'var(--sdg9)'
                         : 'var(--sdg13)',
                  }}
                >
                  {sdg.sdg}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,.8)', lineHeight: 1.5 }}>
                  {sdg.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================
          TICKETS
          =================================================== */}
      <section aria-labelledby="tick-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <h2 id="tick-hd" className="d2" style={{ color: 'var(--navy-900)', marginBottom: '0.75rem' }}>Attend SISM 2026</h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--n-600)', marginBottom: '2.5rem' }}>
            100 seats total (30 scholarships). Scholarship applications closed 11 October, results 16 October. Forum Access and Self-Funded seats are open.
          </p>

          {/* Closed scholarship tiers — crimson stamps tie back to logo palette */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', padding: '0.875rem 1.25rem', background: 'var(--n-100)', marginBottom: '2rem' }}>
            {sism.ticketTypes
              .filter((t: TicketType) => t.status === 'closed')
              .map((t: TicketType) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--n-700)' }}>{t.name}</span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: 'var(--white)',
                      padding: '0.125rem 0.45rem',
                      background: 'var(--crimson-600)',
                      textTransform: 'uppercase', /* 1 of 3 */
                      letterSpacing: '0.06em',
                    }}
                  >
                    Closed
                  </span>
                </div>
              ))}
          </div>

          {/* Open tiers */}
          <div className="tick-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {sism.ticketTypes
              .filter((t: TicketType) => t.status === 'open')
              .map((t: TicketType) => (
                <div
                  key={t.id}
                  style={{
                    border: '1px solid var(--n-200)',
                    padding: '2rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <p style={{ fontFamily: 'var(--fd)', fontSize: '0.875rem', color: 'var(--blue-deep)', marginBottom: '1rem' }}>
                    {t.name}
                  </p>
                  {/* Show only current price, not struck-through was-price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--navy-900)', lineHeight: 1 }}>
                      ${t.price}
                    </span>
                  </div>
                  <ul style={{ listStyle: 'none', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1.5rem' }}>
                    {t.includes.map((item: string) => (
                      <li
                        key={item}
                        style={{ fontSize: '0.8125rem', color: 'var(--n-700)', paddingLeft: '1rem', position: 'relative', lineHeight: 1.5 }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '0.45em',
                            width: '6px',
                            height: '6px',
                            background: 'var(--blue-ocean)',
                            display: 'block',
                          }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  {t.cta.href && (
                    <Link href={t.cta.href.replace('https://thegyn.org', '')} className="btn btn-n">
                      {t.cta.label === 'REGISTER NOW' ? `Register, $${t.price}` : t.cta.label}
                    </Link>
                  )}
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ===================================================
          SPEAKERS
          =================================================== */}
      <section aria-labelledby="spk-hd" style={{ background: 'var(--blue-ocean)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <h2 id="spk-hd" className="d2" style={{ color: 'var(--white)', marginBottom: '2rem' }}>Speakers at SISM 2026</h2>
          <div className="spk-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            {sism.speakers.map((spk: Speaker) => {
              const img = Object.values(SPEAKERS).find((s) => s.alt.toLowerCase().includes(spk.name.split(' ')[1]?.toLowerCase() ?? ''))
              return (
                <div key={spk.name} style={{ background: 'rgba(0,0,0,.18)' }}>
                  {img ? (
                    <Image
                      src={img.src}
                      alt={img.alt}
                      width={400}
                      height={400}
                      sizes="(max-width: 768px) 45vw, 25vw"
                      style={{ aspectRatio: '1', width: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ aspectRatio: '1', width: '100%', background: 'rgba(0,0,0,.3)' }} />
                  )}
                  <div style={{ padding: '0.875rem' }}>
                    <p style={{ fontFamily: 'var(--fd)', fontSize: '0.875rem', color: 'var(--white)', marginBottom: '0.25rem' }}>
                      {spk.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.7)', lineHeight: 1.4 }}>
                      {spk.title}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===================================================
          ADVISORY BOARD
          =================================================== */}
      <section aria-labelledby="adv-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <h2 id="adv-hd" className="d2" style={{ color: 'var(--navy-900)', marginBottom: '2rem' }}>Global advisory board</h2>
          <div className="adv-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            {Object.entries(ADVISORY).map(([, v]) => (
              <div key={v.alt}>
                <Image
                  src={v.src}
                  alt={v.alt}
                  width={400}
                  height={400}
                  sizes="(max-width: 768px) 45vw, 25vw"
                  style={{ aspectRatio: '1', width: '100%', objectFit: 'cover', marginBottom: '0.75rem' }}
                />
                <p style={{ fontFamily: 'var(--fd)', fontSize: '0.875rem', color: 'var(--navy-700)', marginBottom: '0.25rem' }}>
                  {v.alt.split(',')[0]}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--n-600)', lineHeight: 1.4 }}>
                  {v.alt.split(',').slice(1).join(',').trim()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================
          AMBASSADORS
          =================================================== */}
      <section aria-labelledby="amb-hd" style={{ background: 'var(--paper)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <h2 id="amb-hd" className="d2" style={{ color: 'var(--navy-900)', marginBottom: '2rem' }}>GYN ambassadors</h2>
          <div className="amb-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            {Object.entries(AMBASSADORS).map(([, v]) => (
              <div key={v.alt}>
                <Image
                  src={v.src}
                  alt={v.alt}
                  width={400}
                  height={400}
                  sizes="(max-width: 768px) 45vw, 25vw"
                  style={{ aspectRatio: '1', width: '100%', objectFit: 'cover', marginBottom: '0.75rem' }}
                />
                <p style={{ fontFamily: 'var(--fd)', fontSize: '0.875rem', color: 'var(--navy-700)', marginBottom: '0.25rem' }}>
                  {v.alt.split(',')[0].replace('GYN Ambassador', '').trim()}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--n-600)' }}>{v.country}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================
          VIDEOS
          =================================================== */}
      <section aria-labelledby="vid-hd" style={{ background: 'var(--navy-900)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <h2 id="vid-hd" className="d2" style={{ color: 'var(--white)', marginBottom: '2rem' }}>From the FutureMinds Summit Thailand</h2>
          {featuredVideo && (
            <VideoModal
              featured={{
                youtubeId: featuredVideo.youtubeId,
                title: featuredVideo.title,
                thumbnail: featuredVideo.thumbnail,
              }}
              rail={railVideos.map((v: VideoEntry) => ({
                youtubeId: v.youtubeId,
                title: v.title,
                thumbnail: v.thumbnail,
              }))}
            />
          )}
        </div>
      </section>

      {/* ===================================================
          GALLERY
          =================================================== */}
      <section aria-labelledby="gal-hd" style={{ background: 'var(--blue-deep)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <h2 id="gal-hd" className="d2" style={{ color: 'var(--white)', marginBottom: '2rem' }}>FutureMinds Summit Thailand 2026</h2>
          <div className="gal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {GALLERY.slice(0, 8).map((photo, i) => (
              <div
                key={photo.src}
                style={{
                  gridColumn: i === 0 ? 'span 2' : undefined,
                }}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={i === 0 ? 256 : 192}
                  sizes={i === 0
                    ? '(max-width: 768px) 90vw, 680px'
                    : '(max-width: 768px) 45vw, 320px'}
                  style={{
                    width: '100%',
                    height: i === 0 ? '256px' : '192px',
                    objectFit: 'cover',
                  }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================
          PARTNERS
          =================================================== */}
      <section aria-labelledby="par-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <p id="par-hd" style={{ fontFamily: 'var(--fd)', fontSize: '0.875rem', color: 'var(--n-400)', marginBottom: '2rem' }}>
            Our partners
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'center' }}>
            {PARTNERS.map((p) => (
              <div key={p.src}>
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={p.width}
                  height={p.height}
                  style={{
                    height: '2.25rem',
                    width: 'auto',
                    filter: 'grayscale(100%) opacity(.55)',
                    transition: 'filter 200ms ease',
                  }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--n-200)' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--n-600)', marginBottom: '1rem' }}>Co-hosted with</p>
            <Image
              src={LOGOS['logo.unu-global-health'].src}
              alt={LOGOS['logo.unu-global-health'].alt}
              width={LOGOS['logo.unu-global-health'].width}
              height={LOGOS['logo.unu-global-health'].height}
              style={{ height: '3rem', width: 'auto' }}
            />
          </div>
        </div>
      </section>
    </main>
  )
}

// Minimal type stubs for data from CMS (full types live in features/ for backend agent)
interface EventData {
  id: string
  name: string
  dates: { start: string; end: string; display: string }
  venue: string
  city: string
  theme?: string
  summitTheme?: string
  seats?: number
  participants?: number
  focusSdgs: FocusSdg[]
  ticketTypes: TicketType[]
  speakers: Speaker[]
}

interface FocusSdg { sdg: string; label: string }
interface TicketType {
  id: string
  name: string
  price: number
  originalPrice: number | null
  includes: string[]
  cta: { label: string; href: string | null }
  status: string
}
interface Speaker { name: string; title: string; image: string }
interface VideoEntry {
  youtubeId: string
  title: string
  thumbnail: string
  page: string
}
