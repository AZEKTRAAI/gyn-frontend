import type { Metadata } from 'next'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { cms } from '@/lib/cms'
import { Countdown } from '@/components/Countdown'
import { GlobeVideo } from '@/components/GlobeVideo'
import { MagneticButton } from '@/components/premium/MagneticButton'
import { TransitionLink } from '@/components/premium/PageTransition'
import type { Summit } from '@/components/premium/SummitSwitcher'
import type { Tier } from '@/components/premium/TicketRail'
import { type VideoItem } from '@/components/premium/CoverflowVideos'

// Below-fold: code-split to cut initial JS parse time
const SplitReveal = dynamic(() =>
  import('@/components/premium/SplitReveal').then((m) => ({ default: m.SplitReveal })),
)
const SummitSwitcher = dynamic(() =>
  import('@/components/premium/SummitSwitcher').then((m) => ({ default: m.SummitSwitcher })),
)
const TicketRail = dynamic(() =>
  import('@/components/premium/TicketRail').then((m) => ({ default: m.TicketRail })),
)
const CountryTablist = dynamic(() =>
  import('@/components/CountryTablist').then((m) => ({ default: m.CountryTablist })),
)
const HomeVideosSection = dynamic(() =>
  import('@/components/HomeVideosSection').then((m) => ({ default: m.HomeVideosSection })),
)
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
  openGraph: {
    title: 'Global Youth Network – GYN',
    description: 'SDG Innovation Summit Malaysia 2026: 100 young leaders, 19–22 November, Teedo Hotel, Kuala Lumpur.',
    images: [{ url: '/media/og/sism-2026-og.jpg', width: 1200, height: 630 }],
  },
}

export default async function HomePage() {
  const eventsData = await cms.getEvents() as { events: EventData[] }
  const mediaData = await cms.getMedia() as { videos: VideoEntry[] }

  const sism = eventsData.events.find((e: EventData) => e.id === 'sism-2026')!
  const fmst = eventsData.events.find((e: EventData) => e.id === 'fmst-2026')!

  const homeVideos = mediaData.videos.filter((v: VideoEntry) => v.page === 'sism-2026')

  const switcherSummits: Summit[] = [
    {
      id: 'sism-2026',
      label: 'SISM Malaysia 2026',
      title: ['SDG Innovation', 'Summit Malaysia'],
      meta: `${sism.dates.display} — ${sism.venue}, ${sism.city}`,
      imageSrc: '/media/hero/sism-2026-hero-visual.webp',
      imageAlt: 'SDG Innovation Summit Malaysia 2026 — Kuala Lumpur',
      accentColor: '#00689D',
      status: 'Next summit',
      cta: { label: 'Book Forum Access, $199', href: '/sism-forum-access' },
    },
    {
      id: 'fmst-2026',
      label: 'FMS Thailand 2026',
      title: ['FutureMinds Summit', 'Thailand'],
      meta: `${fmst.dates.display} — ${fmst.venue}, ${fmst.city}`,
      imageSrc: '/media/gallery/fmst-dsc01881-1.webp',
      imageAlt: 'FutureMinds Summit Thailand, Bangkok 2026',
      accentColor: '#C52035',
      status: 'Past summit',
      cta: { label: 'See the recap', href: '/fms-thailand' },
    },
  ]

  const ticketTiers: Tier[] = sism.ticketTypes
    .filter((t: TicketType) => t.id !== 'forum-access-discounted')
    .map((t: TicketType) => ({
      id: t.id,
      name: t.name.charAt(0) + t.name.slice(1).toLowerCase(),
      price: t.status === 'closed' ? 'Closed' : `$${t.price}`,
      priceLabel: t.status === 'closed' ? 'Applications closed' : 'USD, flights not included',
      description: t.status === 'closed'
        ? `Application fee was $${t.price}. Selection complete.`
        : t.includes[0] ?? '',
      features: t.includes.slice(0, 5),
      cta: t.status === 'closed'
        ? 'Application closed'
        : (t.cta.label === 'REGISTER NOW' ? `Register, $${t.price}` : t.cta.label),
      ctaHref: t.cta.href?.replace('https://thegyn.org', '') ?? '#',
      featured: t.id === 'forum-access',
      closed: t.status === 'closed',
    }))

  const coverflowItems: VideoItem[] = homeVideos.map((v: VideoEntry) => ({
    id: v.youtubeId,
    title: v.title,
    category: v.category,
    thumbnailSrc: v.thumbnail,
    thumbnailAlt: v.title,
  }))

  return (
    <main id="main">

      {/* HERO */}
      <section
        aria-labelledby="hero-title"
        style={{
          background: 'var(--blue-deep)',
          paddingTop: 'calc(3.5rem + clamp(2rem, 5vw, 4.5rem))',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          className="wrap hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr minmax(520px, 42vw)',
            gap: '2rem',
            alignItems: 'center',
            paddingBlock: 'clamp(2rem, 5vw, 4rem)',
          }}
        >
          {/* Left: headline first (nothing above H1 per taste rules) */}
          <div style={{ minWidth: 0 }}>
            <h1 id="hero-title" className="d1" style={{ color: 'var(--white)', marginBottom: '1rem' }}>
              SDG INNOVATION SUMMIT MALAYSIA 2026
            </h1>
            {/* Meta below H1 — date/venue/co-host (task 1a) */}
            <p style={{ fontSize: 'clamp(.8rem, 1.3vw, .9375rem)', color: 'var(--white)', marginBottom: '1rem', lineHeight: 1.55 }}>
              19–22 November 2026 / Teedo Hotel, Kuala Lumpur / Co-hosted by UNU Global Health
            </p>
            <p style={{ fontSize: 'clamp(.875rem, 1.4vw, 1.0625rem)', color: 'rgba(255,255,255,.9)', lineHeight: 1.65, marginBottom: '2rem' }}>
              Join 100 young leaders, innovators, students and professionals from across the globe in Kuala Lumpur. Focused on SDGs 4, 5, 9 and 13.
            </p>
            <Countdown />
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2.5rem' }}>
              {/* MagneticButton on primary CTA only (task 2) */}
              <MagneticButton href="/sism-forum-access" className="btn btn-y">
                Book Forum Access, $199
              </MagneticButton>
              <TransitionLink href="/sism-2026" className="btn btn-ow">See the full programme</TransitionLink>
            </div>
          </div>

          {/* Right: globe poster (server Image = LCP hint) + client video overlay */}
          <div className="hero-right" style={{ position: 'relative', minWidth: 0 }}>
            {/* Server-rendered poster so Next.js emits a fetchpriority=high preload */}
            <div style={{ position: 'relative', width: 'min(100%, 600px)', aspectRatio: '1' }}>
              <Image
                src="/renders/glass-globe-poster.webp"
                alt="A glass globe with 17 SDG-coloured planets in orbit"
                width={500}
                height={500}
                priority
                fetchPriority="high"
                sizes="(max-width: 768px) 70vw, 500px"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <GlobeVideo />
            </div>
            <figure
              style={{
                position: 'absolute',
                bottom: '-0.5rem',
                left: '-0.75rem',
                width: '46%',
                margin: 0,
                zIndex: 2,
              }}
            >
              <Image
                src="/media/gallery/fmst-dsc01881-1.webp"
                alt="Delegates at Future Minds Summit, Bangkok, July 2026"
                width={768}
                height={512}
                sizes="(max-width: 768px) 80vw, 260px"
                style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
              />
              <figcaption style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,.9)', marginTop: '0.25rem', lineHeight: 1.3 }}>
                Future Minds Summit, Bangkok, July 2026
              </figcaption>
            </figure>
          </div>
        </div>

        {/* Photo strip */}
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
                  <figcaption style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,.85)', marginTop: '0.375rem', lineHeight: 1.3 }}>
                    FutureMinds Summit, Bangkok, July 2026
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section aria-label="Summit at a glance" style={{ background: 'var(--navy-900)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div className="t-y stat-span2" style={{ padding: '1.5rem 1.25rem', gridColumn: 'span 2' }}>
              <span className="d2 stat-n" style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1, display: 'block' }}>100</span>
              <span className="stat-l" style={{ fontSize: '0.8125rem', lineHeight: 1.45, marginTop: '0.5rem', display: 'block' }}>seats (30 scholarships) — Kuala Lumpur, Nov 2026</span>
            </div>
            <div className="t-w" style={{ padding: '1.5rem 1.25rem' }}>
              <span className="d2 stat-n" style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1, display: 'block' }}>4</span>
              <span className="stat-l" style={{ fontSize: '0.8125rem', lineHeight: 1.45, marginTop: '0.5rem', display: 'block' }}>days, Kuala Lumpur, Nov 19–22</span>
            </div>
            <div className="t-c" style={{ padding: '1.5rem 1.25rem' }}>
              <span className="d2 stat-n" style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1, display: 'block' }}>8</span>
              <span className="stat-l" style={{ fontSize: '0.8125rem', lineHeight: 1.45, marginTop: '0.5rem', display: 'block' }}>confirmed speakers</span>
            </div>
            <div className="t-b" style={{ padding: '1.5rem 1.25rem' }}>
              <span className="d2 stat-n" style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1, color: 'var(--yellow)', display: 'block' }}>17</span>
              <span className="stat-l" style={{ fontSize: '0.8125rem', lineHeight: 1.45, marginTop: '0.5rem', display: 'block', color: 'rgba(255,255,255,.75)' }}>countries represented</span>
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

      {/* WHO WE ARE */}
      <section aria-labelledby="who-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap who-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(2rem, 5vw, 4rem)', alignItems: 'start' }}>
          <div>
            <SplitReveal id="who-hd" lines={['Who we are', 'and what we do']} className="d2" as="h2"
              style={{ color: 'var(--navy-700)' }}
            />
            <p style={{ color: 'var(--n-700)', fontSize: '1rem', lineHeight: 1.75, marginTop: '1.5rem' }}>
              Global Youth Network (GYN) is an international organization dedicated to connecting young people worldwide. We bring together students, professionals, and innovators to collaborate across borders, develop leadership skills, and create meaningful global impact.
            </p>
          </div>
          <ul style={{ listStyle: 'none' }}>
            {[
              { title: 'Conferences', body: 'GYN hosts international forums, workshops and summits to promote dialogue on Sustainable Development Goals.' },
              { title: 'Networking', body: 'Providing a collaborative space of mentorship, technical support and resource sharing to address pressing global challenges.' },
              { title: 'Leadership Development', body: 'Building a new generation of leaders with the foresight, integrity and skills for measurable global impact.' },
              { title: 'Youth Mentoring', body: 'Providing tailor-made, hands-on mentoring to help youth become effective leaders.' },
              { title: 'Workshops and Trainings', body: 'Building leadership capacities and policy expertise for future-ready governance.' },
            ].map((item) => (
              <li key={item.title} style={{ paddingBlock: '0.875rem', borderBottom: '1px solid var(--n-200)' }}>
                <p style={{ fontFamily: 'var(--fd)', fontSize: '0.875rem', color: 'var(--navy-700)', marginBottom: '0.25rem' }}>{item.title}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--n-600)', lineHeight: 1.6 }}>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHERE WE'RE FROM */}
      <section aria-labelledby="from-hd" style={{ background: 'var(--paper)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <SplitReveal id="from-hd" lines={["Where we're from"]} className="d2" as="h2"
            style={{ color: 'var(--navy-900)' }}
          />
          <p style={{ fontSize: '0.9375rem', color: 'var(--n-600)', marginBottom: '2rem', marginTop: '0.75rem' }}>
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

      {/* SUMMITS — SummitSwitcher (task 2) */}
      <section aria-labelledby="summits-hd" style={{ background: 'var(--blue-deep)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <SplitReveal id="summits-hd" lines={['GYN summits']} className="d2" as="h2"
            style={{ color: 'var(--white)', marginBottom: '2rem' }}
          />
          <SummitSwitcher summits={switcherSummits} />
        </div>
      </section>

      {/* SDG FOCUS */}
      <section aria-labelledby="sdg-hd" style={{ background: 'var(--yellow)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <SplitReveal id="sdg-hd" lines={['4 SDGs. 1 sustainable future.']} className="d2" as="h2"
            style={{ color: 'var(--navy-900)' }}
          />
          <p style={{ fontSize: '0.9375rem', color: 'var(--navy-800)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '60ch', marginTop: '0.75rem' }}>
            At GYN, we focus on four Sustainable Development Goals as education, gender equality, industry innovation and infrastructure, and climate action, uniting young leaders worldwide to create impactful solutions.
          </p>
          <div className="sdg-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr', gap: '1rem' }}>
            {sism.focusSdgs.map((sdg: FocusSdg) => (
              <div key={sdg.sdg} style={{ background: 'var(--navy-900)', padding: '1.75rem 1.25rem' }}>
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
                >{sdg.sdg}</span>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,.8)', lineHeight: 1.5 }}>{sdg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TICKETS — TicketRail (task 2) */}
      <section aria-labelledby="tick-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <SplitReveal id="tick-hd" lines={['Attend SISM 2026']} className="d2" as="h2"
            style={{ color: 'var(--navy-900)' }}
          />
          <p style={{ fontSize: '0.9375rem', color: 'var(--n-600)', marginBottom: '2.5rem', marginTop: '0.75rem' }}>
            100 seats total (30 scholarships). Scholarship applications closed 11 October, results 16 October. Forum Access and Self-Funded seats are open.
          </p>
          <TicketRail
            tiers={ticketTiers}
            defaultActive={ticketTiers.findIndex((t) => t.id === 'forum-access')}
          />
        </div>
      </section>

      {/* SPEAKERS */}
      <section aria-labelledby="spk-hd" style={{ background: 'var(--blue-deep)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <SplitReveal id="spk-hd" lines={['Speakers at SISM 2026']} className="d2" as="h2"
            style={{ color: 'var(--white)' }}
          />
          <div className="spk-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
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
                    <p style={{ fontFamily: 'var(--fd)', fontSize: '0.875rem', color: 'var(--white)', marginBottom: '0.25rem' }}>{spk.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.7)', lineHeight: 1.4 }}>{spk.title}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ADVISORY BOARD */}
      <section aria-labelledby="adv-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <SplitReveal id="adv-hd" lines={['Global advisory board']} className="d2" as="h2"
            style={{ color: 'var(--navy-900)' }}
          />
          <div className="adv-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
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
                <p style={{ fontFamily: 'var(--fd)', fontSize: '0.875rem', color: 'var(--navy-700)', marginBottom: '0.25rem' }}>{v.alt.split(',')[0]}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--n-600)', lineHeight: 1.4 }}>{v.alt.split(',').slice(1).join(',').trim()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AMBASSADORS */}
      <section aria-labelledby="amb-hd" style={{ background: 'var(--paper)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <SplitReveal id="amb-hd" lines={['GYN ambassadors']} className="d2" as="h2"
            style={{ color: 'var(--navy-900)' }}
          />
          <div className="amb-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
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

      {/* VIDEOS — CoverflowVideos (task 2) */}
      <section aria-labelledby="vid-hd" style={{ background: 'var(--navy-900)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <SplitReveal id="vid-hd" lines={['From the FutureMinds Summit Thailand']} className="d2" as="h2"
            style={{ color: 'var(--white)', marginBottom: '2rem' }}
          />
          {coverflowItems.length > 0 && (
            <HomeVideosSection items={coverflowItems} heading="FutureMinds Summit 2026 videos" />
          )}
        </div>
      </section>

      {/* GALLERY */}
      <section aria-labelledby="gal-hd" style={{ background: 'var(--blue-deep)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <SplitReveal id="gal-hd" lines={['FutureMinds Summit Thailand 2026']} className="d2" as="h2"
            style={{ color: 'var(--white)', marginBottom: '2rem' }}
          />
          <div className="gal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '2rem' }}>
            {GALLERY.slice(0, 8).map((photo, i) => (
              <div key={photo.src} style={{ gridColumn: i === 0 ? 'span 2' : undefined }}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={i === 0 ? 256 : 192}
                  sizes={i === 0 ? '(max-width: 768px) 90vw, 680px' : '(max-width: 768px) 45vw, 320px'}
                  style={{ width: '100%', height: i === 0 ? '256px' : '192px', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section aria-labelledby="par-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <p id="par-hd" style={{ fontFamily: 'var(--fd)', fontSize: '0.875rem', color: 'var(--n-600)', marginBottom: '2rem' }}>
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
                  style={{ height: '2.25rem', width: 'auto', opacity: 0.8 }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--n-200)' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--n-600)', marginBottom: '1rem' }}>Co-hosted with</p>
            {/* width: 5.3rem = 3rem × (620/350) — correct aspect ratio */}
            <Image
              src={LOGOS['logo.unu-global-health'].src}
              alt={LOGOS['logo.unu-global-health'].alt}
              width={620}
              height={350}
              style={{ height: '3rem', width: '5.3rem' }}
            />
          </div>
        </div>
      </section>
    </main>
  )
}

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
  category: string
}
