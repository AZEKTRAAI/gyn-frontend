import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { cms } from '@/lib/cms'
import { Countdown } from '@/components/Countdown'
import { PageHero } from '@/components/PageHero'
import type { Tier } from '@/components/premium/TicketRail'
import { SPEAKERS, LOGOS } from '@/features/media/media'
import { SismSpeakers, type SpeakerItem } from './SismSpeakers'

// this page is static, so this is the build time; Countdown hydrates against it, then shows the live value
const RENDERED_AT = Date.now()

// Below-fold: code-split to reduce initial JS parse time
const TicketRail = dynamic(() =>
  import('@/components/premium/TicketRail').then((m) => ({ default: m.TicketRail })),
)
const SismVideos = dynamic(() =>
  import('@/features/events/SismVideos').then((m) => ({ default: m.SismVideos })),
)

export const metadata: Metadata = {
  // scholarships are closed; title must not say "Fully Funded" (RT-052)
  title: 'SISM 2026, Kuala Lumpur, 19–22 Nov | Forum Access $199',
  description: 'SDG Innovation Summit Malaysia 2026. Scholarship applications closed. Forum Access ($199) and Self-Funded ($399) seats open. 19–22 November, Kuala Lumpur.',
  openGraph: {
    images: [{ url: '/og/sism-2026-og.jpg', width: 1200, height: 630 }],
  },
}

/* Speaker images keyed by last name for fast lookup */
const SPK_BY_LAST: Record<string, (typeof SPEAKERS)[string]> = {}
Object.values(SPEAKERS).forEach(s => {
  const last = s.alt.split(',')[0].split(' ').pop()?.toLowerCase() ?? ''
  SPK_BY_LAST[last] = s
})

/** Title-case a speaker name from content; keeps 'bin' lowercase (RT-050) */
function toTitleCase(name: string): string {
  return name.toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bBin\b/g, 'bin')
}

interface EventData {
  id: string; name: string
  dates: { start: string; end: string; display: string; displayAlt: string }
  venue: string; city: string; theme: string
  focusSdgs: { sdg: string; label: string }[]
  award: string
  ticketTypes: {
    id: string; name: string; price: number; includes: string[]
    cta: { label: string; href: string | null }; status: string
  }[]
  speakers: { name: string; title: string; image: string }[]
  schedule: {
    day: string; date: string; dateDisplay: string; items: string[]
  }[]
  eligibility: string[]
  scholarshipCriteria: string[]
  applicationProcess: { step: string; text: string }[]
  faqs: { q: string; a: string; links?: { label: string; href: string }[] }[]
  scholarships: { total: number }
  coHost: string
}

// SDG colours for application steps (cycles if > 4 steps)
const STEP_COLS = [
  { bg: 'var(--sdg4)', fg: '#fff' },
  { bg: 'var(--sdg13)', fg: '#fff' },
  { bg: 'var(--sdg9)', fg: 'var(--ink)' },
  { bg: 'var(--sdg5)', fg: 'var(--ink)' },
]

export default async function Sism2026Page() {
  const eventsData = await cms.getEvents() as { events: EventData[] }
  const sism = eventsData.events.find(e => e.id === 'sism-2026') as EventData

  const openTiers = sism.ticketTypes.filter(t => t.status === 'open')
  const closedTiers = sism.ticketTypes.filter(t => t.status === 'closed')

  // open tiers first so Forum Access is visible without scrolling (RT-054)
  const railTiers: Tier[] = [
    ...openTiers.map(t => ({
      id: t.id,
      name: t.name.replace(/\(.*?\)/g, '').trim(),
      price: `$${t.price}`,
      description: t.id === 'forum-access'
        ? 'Confirmed seat. Summit access, meals, sightseeing and certificate.'
        : t.id === 'self-funded'
        ? 'Confirmed seat with twin-sharing accommodation included.'
        : 'Official invitation letter for your Malaysian visa application.',
      features: t.includes.slice(0, 5),
      cta: t.id === 'invitation-letter' ? `Get invitation letter, $${t.price}` : `Book ${t.id === 'forum-access' ? 'Forum Access' : 'Self Funded'}, $${t.price}`,
      ctaHref: t.id === 'forum-access' ? '/sism-forum-access'
        : t.id === 'self-funded' ? '/sism-self-funded'
        : '/sism-invitation-letter',
      featured: t.id === 'forum-access',
    })),
    ...closedTiers.map(t => ({
      id: t.id,
      name: t.id === 'fully-funded' ? 'Fully Funded Scholarship' : 'Partial Scholarship',
      price: t.id === 'fully-funded' ? 'Funded' : 'Partial',
      description: t.id === 'fully-funded'
        ? 'Scholarship applications closed 11 October. Results announced 16 October.'
        : 'Applications closed 11 October. Results announced 16 October.',
      features: t.includes.slice(0, 5),
      cta: 'Applications closed',
      ctaHref: '#tickets',
      closed: true,
    })),
  ]

  const speakerItems: SpeakerItem[] = sism.speakers.map((spk) => {
    const lastWord = spk.name.split(' ').pop()?.toLowerCase() ?? ''
    const img = SPK_BY_LAST[lastWord]
    return {
      name: toTitleCase(spk.name),
      role: spk.title.split('|')[0].split('-')[0].trim(),
      org: spk.title.split('|').slice(-1)[0].trim(),
      imageSrc: img?.src ?? '/media/events/sism-2026-call-for-applications.webp',
      imageAlt: img?.alt ?? spk.name,
    }
  })

  return (
    <main id="main">

      {/* ─── HERO ─── */}
      <PageHero
        id="sism-title"
        kicker="SISM 2026"
        title="SDG *Innovation* Summit Malaysia 2026"
        lead={<>100 seats, {sism.scholarships.total} scholarships. Join young leaders, innovators and professionals from around the world in Kuala Lumpur.</>}
        chips={[sism.dates.displayAlt, `${sism.venue}, ${sism.city}`, `Co-hosted by ${sism.coHost}`]}
        actions={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            {/* Hard-coded target: 19 Nov 2026 00:00 MYT = UTC+8 */}
            <Countdown serverNow={RENDERED_AT} target={new Date('2026-11-18T16:00:00Z').getTime()} />
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/sism-forum-access" className="btn btn-y">Book Forum Access, $199</Link>
              <Link href="#tickets" className="btn btn-g">See all tickets</Link>
            </div>
          </div>
        }
        media={
          <Image
            src="/media/hero/sism-2026-hero-visual.webp"
            alt="SDG Innovation Summit Malaysia 2026 promotional visual"
            width={720}
            height={540}
            sizes="(max-width: 768px) 100vw, 45vw"
          />
        }
      />

      {/* ─── WHAT IT IS ─── */}
      <section data-name="What is SISM 2026" aria-labelledby="what-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap who-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(2rem,5vw,4rem)', alignItems: 'start' }}>
          <div>
            <p className="kick">About the summit</p>
            <h2 id="what-hd" className="d2" style={{ color: 'var(--ink)', marginBottom: '1.5rem' }}>What is the SDG Innovation Summit 2026?</h2>
            <p style={{ color: 'var(--n-700)', fontSize: '1rem', lineHeight: 1.75, marginBottom: '1rem' }}>
              The SDG Innovation Summit Malaysia 2026 is a premier international youth summit designed to bring together 100 young leaders, innovators, students, entrepreneurs, professionals, researchers, and changemakers from around the world to explore innovative ideas, foster meaningful collaboration, and create sustainable impact in support of the United Nations Sustainable Development Goals (SDGs).
            </p>
            <p style={{ color: 'var(--n-600)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
              Following the success of our international summit in Bangkok, Thailand, the summit continues in Kuala Lumpur, Malaysia.
            </p>
          </div>
          <div>
            <h3 className="d3" style={{ color: 'var(--navy)', marginBottom: '1.25rem' }}>What will you experience?</h3>
            <p style={{ color: 'var(--n-600)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: '1rem' }}>
              Through keynote addresses, high-level panel discussions, leadership workshops, innovation labs, strategic networking, cultural exchange activities, and an exclusive institutional visit to Asia Pacific University (APU), Malaysia, delegates will gain valuable knowledge, practical skills, global perspectives, and meaningful international connections.
            </p>
            <Link href="https://youtu.be/Aqqo3cL4W6w" target="_blank" rel="noopener" className="btn btn-g" style={{ display: 'inline-flex' }}>
              Watch the summit video
            </Link>
          </div>
        </div>
      </section>

      {/* ─── THEME & PURPOSE ─── */}
      <section data-name="Forum Theme" aria-labelledby="theme-hd" style={{ background: 'var(--field)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <p className="kick">Theme</p>
          <h2 id="theme-hd" className="d2" style={{ color: 'var(--ink)', marginBottom: '0.5rem' }}>Forum theme</h2>
          <p style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1.5rem,4vw,3rem)', color: 'var(--ink)', lineHeight: 1.1, marginBottom: '2rem' }}>
            Innovative Ideas for Social Impact
          </p>
          <p style={{ fontSize: '1rem', color: 'var(--navy)', lineHeight: 1.75, maxWidth: '65ch', marginBottom: '2.5rem' }}>
            The SDG Innovation Summit Malaysia aims to create a collaborative platform where innovation meets purpose and ideas become action. The summit inspires young leaders to present innovative ideas aligned with the four focus SDGs.
          </p>

          {/* Solid SDG colour tiles with 3D poster renders */}
          <div className="sdg-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {sism.focusSdgs.map(sdg => {
              const tileColor = sdg.sdg === 'SDG 4' ? 'var(--sdg4)' : sdg.sdg === 'SDG 5' ? 'var(--sdg5)' : sdg.sdg === 'SDG 9' ? 'var(--sdg9)' : 'var(--sdg13)'
              // SDG 4 + 13 pass 4.5:1 with white; SDG 5 + 9 need ink
              const textColor = (sdg.sdg === 'SDG 5' || sdg.sdg === 'SDG 9') ? 'var(--ink)' : 'var(--white)'
              const poster = sdg.sdg === 'SDG 4' ? '/renders/r3/sdg4-books-poster.webp'
                : sdg.sdg === 'SDG 5' ? '/renders/r3/sdg5-balance-poster.webp'
                : sdg.sdg === 'SDG 9' ? '/renders/r3/sdg9-gears-poster.webp'
                : '/renders/r3/sdg13-leaf-poster.webp'
              return (
                <div key={sdg.sdg} className="tile" style={{ background: tileColor, color: textColor, padding: 0, overflow: 'hidden' }}>
                  <Image
                    src={poster}
                    alt=""
                    width={400}
                    height={280}
                    style={{ width: '100%', height: 'auto', display: 'block', aspectRatio: '10/7', objectFit: 'cover' }}
                    aria-hidden="true"
                  />
                  <div style={{ padding: '1.25rem 1rem' }}>
                    <span className="tile-n" style={{ color: textColor, display: 'block', marginBottom: '0.375rem' }}>
                      {sdg.sdg}
                    </span>
                    <span style={{ fontSize: '0.8125rem', lineHeight: 1.5, display: 'block' }}>{sdg.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── SEED GRANT ─── */}
      <section data-name="Seed Grant" aria-labelledby="grant-hd" className="band-navy" style={{ paddingBlock: 'var(--sp)' }}>
        <div className="wrap who-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
          <div>
            <p className="kick kick-y">Award</p>
            <h2 id="grant-hd" className="d2" style={{ color: 'var(--yellow)', marginBottom: '1rem' }}>$1,000 Seed Grant Award</h2>
            <p style={{ color: 'rgba(255,255,255,.85)', fontSize: '1rem', lineHeight: 1.75 }}>
              Participants compete for a $1,000 Seed Grant to support innovative projects and social impact initiatives. Whether your project is at the conceptual stage, in its pilot phase, under implementation, or fully realized, we welcome you to present your innovation on stage.
            </p>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,.15)', paddingLeft: '3rem' }}>
            <p style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(3rem,8vw,6rem)', lineHeight: 1, color: 'var(--yellow)' }}>$1,000</p>
            <p style={{ fontSize: '0.9375rem', color: 'var(--white)', marginTop: '0.5rem' }}>seed grant for the best project</p>
          </div>
        </div>
      </section>

      {/* ─── CO-HOST ─── */}
      <section data-name="Co-host" aria-labelledby="cohost-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap who-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
          <div>
            <p className="kick">Partners</p>
            <h2 id="cohost-hd" className="d2" style={{ color: 'var(--ink)', marginBottom: '1.25rem' }}>Co-hosted by UNU Global Health</h2>
            <p style={{ color: 'var(--n-700)', fontSize: '1rem', lineHeight: 1.75, marginBottom: '1rem' }}>
              The Global Youth Network (GYN) organizes the SDG Innovation Summit Malaysia, co-hosted by the United Nations University International Institute for Global Health, Malaysia. Participants will have an opportunity to engage with UNU Global Health representatives and UNU Young Leaders during the summit.
            </p>
            <p style={{ color: 'var(--n-600)', fontSize: '0.9375rem', lineHeight: 1.65 }}>
              The United Nations University (UNU) operates the UNU International Institute for Global Health in Kuala Lumpur, which functions as a global research think tank focusing on health equity and sustainable development.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* width: 6.2rem = 3.5rem × (620/350) — correct aspect ratio */}
            <Image
              src={LOGOS['logo.unu-global-health'].src}
              alt={LOGOS['logo.unu-global-health'].alt}
              width={620}
              height={350}
              style={{ height: '3.5rem', width: '6.2rem' }}
            />
          </div>
        </div>
      </section>

      {/* ─── APU VISIT ─── */}
      <section data-name="APU Visit" aria-labelledby="apu-hd" style={{ background: 'var(--field)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap who-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
          <div>
            <p className="kick">Venue experience</p>
            <h2 id="apu-hd" className="d2" style={{ color: 'var(--ink)', marginBottom: '1.25rem' }}>Exclusive APU institutional visit</h2>
            <p style={{ color: 'var(--n-700)', fontSize: '1rem', lineHeight: 1.75 }}>
              Experience an exclusive institutional visit to Asia Pacific University (APU), one of Malaysia&apos;s leading universities. Explore its academic environment and global learning community while connecting with fellow international delegates. Delegates will also explore Petaling Street (Chinatown), GMBB KL, Petronas Twin Towers, KLCC Park and many other spots.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <Image
                src="/renders/r3/kl-towers.webp"
                alt="Petronas Twin Towers, Kuala Lumpur"
                width={600}
                height={400}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
            <Image
              src={LOGOS['logo.apu'].src}
              alt={LOGOS['logo.apu'].alt}
              width={LOGOS['logo.apu'].width}
              height={LOGOS['logo.apu'].height}
              style={{ width: 'min(100%, 240px)', height: 'auto', display: 'block' }}
            />
          </div>
        </div>
      </section>

      {/* ─── WHO CAN APPLY ─── */}
      <section data-name="Eligibility" aria-labelledby="apply-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap who-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
          <div>
            <p className="kick">Eligibility</p>
            <h2 id="apply-hd" className="d2" style={{ color: 'var(--ink)', marginBottom: '1.25rem' }}>Who can apply</h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {sism.eligibility.map(item => (
                <li key={item} style={{ fontSize: '0.9375rem', color: 'var(--n-700)', lineHeight: 1.6, paddingLeft: '1.25rem', position: 'relative' }}>
                  <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: '0.55em', width: '6px', height: '6px', background: 'var(--ink)', borderRadius: '50%', display: 'block' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="d3" style={{ color: 'var(--navy-700)', marginBottom: '1.25rem' }}>Scholarship criteria</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {sism.scholarshipCriteria.map(item => (
                <li key={item} style={{ fontSize: '0.9375rem', color: 'var(--n-600)', lineHeight: 1.6, paddingLeft: '1.25rem', position: 'relative' }}>
                  <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: '0.55em', width: '6px', height: '6px', background: 'var(--yellow)', borderRadius: '50%', display: 'block' }} />
                  {item}
                </li>
              ))}
            </ul>
            <p style={{ fontSize: '0.875rem', color: 'var(--n-500)', marginTop: '1.25rem', lineHeight: 1.6 }}>
              Scholarship applications closed 11 October 2026. Results announced 16 October 2026.
            </p>
          </div>
        </div>
      </section>

      {/* ─── TICKETS ─── */}
      <section id="tickets" data-name="Tickets" aria-labelledby="tick-hd" style={{ background: 'var(--field)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <p className="kick">Tickets</p>
          <h2 id="tick-hd" className="d2" style={{ color: 'var(--ink)', marginBottom: '0.75rem' }}>Attend SISM 2026</h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--n-600)', marginBottom: '2.5rem', maxWidth: '60ch' }}>
            100 seats (30 scholarships). Scholarship applications closed. Forum Access and Self-Funded seats open now. Group discounts via{' '}
            <a href="mailto:contact@thegyn.org" style={{ color: 'var(--navy)', textDecoration: 'underline' }}>contact@thegyn.org</a>.
          </p>
          <TicketRail tiers={railTiers} defaultActive={0} />
        </div>
      </section>

      {/* ─── SPEAKERS ─── */}
      <section data-name="Speakers" aria-labelledby="spk-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <p className="kick">Confirmed speakers</p>
          <h2 id="spk-hd" className="d2" style={{ color: 'var(--ink)', marginBottom: 'clamp(32px,4vw,48px)' }}>Speakers at SISM 2026</h2>
          <SismSpeakers speakers={speakerItems} />
        </div>
      </section>

      {/* ─── SCHEDULE ─── */}
      <section data-name="Programme" aria-labelledby="sched-hd" style={{ background: 'var(--field)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <p className="kick">Schedule</p>
          <h2 id="sched-hd" className="d2" style={{ color: 'var(--ink)', marginBottom: '0.5rem' }}>4-day programme</h2>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--navy)', marginBottom: '3rem' }}>Kuala Lumpur, 19–22 November 2026 (tentative)</p>

          {/* J-style rounded cards — replaces the old ruled grid */}
          <div
            className="prog-grid-sism"
            role="list"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
            }}
          >
            {sism.schedule.map((day, i) => (
              <div
                key={day.day}
                role="listitem"
                className="card"
                style={{ padding: 0, overflow: 'hidden', position: 'relative' }}
              >
                <div style={{ padding: '20px 20px 8px' }}>
                  {/* Faded Anton day number */}
                  <div
                    aria-hidden="true"
                    className="day-n"
                    data-n={String(i + 1).padStart(2, '0')}
                    style={{
                      fontFamily: 'var(--fd)',
                      fontSize: 'clamp(3rem,5vw,4.5rem)',
                      lineHeight: 1,
                      color: 'var(--navy)',
                      opacity: 0.1,
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  />
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--navy)', marginTop: '-4px' }}>
                    {day.dateDisplay}
                  </div>
                </div>
                <ul style={{ padding: '8px 20px 20px', listStyle: 'none' }} aria-label={`Day ${i + 1} sessions`}>
                  {day.items.map((item, j) => (
                    <li
                      key={item}
                      style={{
                        fontSize: '12px',
                        lineHeight: 1.5,
                        color: 'var(--n-700)',
                        padding: '4px 0 4px 14px',
                        position: 'relative',
                        borderBottom: j < day.items.length - 1 ? '1px solid var(--n-100)' : 'none',
                      }}
                    >
                      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: '0.7em', width: '5px', height: '5px', background: 'var(--navy)', borderRadius: '50%', opacity: 0.4 }} />
                      {item.replace(/:/g, ': ')}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <style>{`
            @media (max-width: 767px) { .prog-grid-sism { grid-template-columns: 1fr !important; } }
            @media (min-width: 768px) and (max-width: 1023px) { .prog-grid-sism { grid-template-columns: 1fr 1fr !important; } }
          `}</style>
        </div>
      </section>

      {/* ─── TESTIMONIAL VIDEOS ─── */}
      <section data-name="Delegate Stories" aria-labelledby="vid-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <p className="kick">Testimonials</p>
          <h2 id="vid-hd" className="d2" style={{ color: 'var(--navy-900)', marginBottom: '0.75rem' }}>Hear from past delegates</h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--n-600)', marginBottom: '2rem' }}>
            Watch past delegates and fellows explain why they recommend applying.
          </p>
          <SismVideos />
        </div>
      </section>

      {/* ─── APPLICATION PROCESS ─── */}
      <section data-name="How to Apply" aria-labelledby="proc-hd" className="band-navy" style={{ paddingBlock: 'var(--sp)' }}>
        <div className="wrap">
          <p className="kick kick-y">Application</p>
          <h2 id="proc-hd" className="d2" style={{ color: 'var(--white)', marginBottom: '2.5rem' }}>How to apply</h2>
          {/* SDG-coloured tiles with big Anton step numbers */}
          <ol style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} className="sdg-grid">
            {sism.applicationProcess.map((s, i) => {
              const col = STEP_COLS[i % STEP_COLS.length]
              return (
                <li key={s.step} className="tile" style={{ background: col.bg, color: col.fg }}>
                  <span className="tile-n">{i + 1}</span>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: '0.5rem', marginBottom: '0.375rem' }}>{s.step}</p>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{s.text}</p>
                </li>
              )
            })}
          </ol>
          <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/sism-forum-access" className="btn btn-y">Book Forum Access, $199</Link>
            <Link href="/sism-self-funded" className="btn btn-ow">Book Self Funded, $399</Link>
            <Link href="/sism-invitation-letter" className="btn btn-ow">Get invitation letter, $49</Link>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section data-name="FAQ" aria-labelledby="faq-hd" style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}>
        <div className="wrap" style={{ maxWidth: '860px' }}>
          <p className="kick">Questions</p>
          <h2 id="faq-hd" className="d2" style={{ color: 'var(--navy-900)', marginBottom: '2rem' }}>Frequently asked questions</h2>
          <div>
            {sism.faqs.map((faq, i) => (
              <details
                key={i}
                style={{ borderBottom: '1px solid var(--n-200)' }}
              >
                <summary
                  style={{
                    padding: '1.125rem 0',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--navy-900)',
                    lineHeight: 1.5,
                    listStyle: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    userSelect: 'none',
                  }}
                >
                  {faq.q}
                  {/* round pill marker replaces old square */}
                  <span aria-hidden="true" style={{ flexShrink: 0, width: '24px', height: '24px', border: '1.5px solid var(--n-300)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'var(--navy-700)' }}>+</span>
                </summary>
                <div style={{ paddingBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--n-700)', lineHeight: 1.7 }}>
                    {faq.a}
                    {faq.links?.map(l => (
                      <span key={l.href}> <a href={l.href} target="_blank" rel="noopener" style={{ color: 'var(--navy)', textDecoration: 'underline' }}>{l.label}</a></span>
                    ))}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CLOSING CTA ─── */}
      <section data-name="Book your seat" aria-labelledby="cta-close-hd" className="band-y" style={{ paddingBlock: 'var(--sp)', textAlign: 'center' }}>
        <div className="wrap">
          <h2 id="cta-close-hd" className="d2" style={{ color: 'var(--ink)', marginBottom: '1.5rem' }}>
            Join us in Kuala Lumpur
          </h2>
          <p className="rise" style={{ color: 'var(--navy)', margin: '0 auto 2rem', fontSize: '1.0625rem', maxWidth: '50ch' }}>
            19&#8211;22 November 2026. 100 seats. Forum Access from $199.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/sism-forum-access" className="btn btn-n">Book Forum Access, $199</Link>
            <Link href="/sism-self-funded" className="btn btn-n">Book Self Funded, $399</Link>
          </div>
        </div>
      </section>

      {/* ─── STICKY MOBILE BAR ─── */}
      <div
        aria-label="Quick booking"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--navy-900)', borderTop: '1px solid rgba(255,255,255,.12)',
          // clears the iPhone home indicator
          padding: '0.875rem var(--gut) calc(0.875rem + env(safe-area-inset-bottom, 0px))',
          alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          zIndex: 100,
        }}
        // display lives in the classes: an inline display would override md:hidden and show the bar on desktop (RT-081)
        className="flex md:hidden"
      >
        <div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.85)', marginBottom: '0.125rem' }}>Confirmed seat from</p>
          <p style={{ fontFamily: 'var(--fd)', fontSize: '1.25rem', color: 'var(--yellow)' }}>$199</p>
        </div>
        <Link href="/sism-forum-access" className="btn btn-y" style={{ flexShrink: 0, minHeight: '44px' }}>
          Book Forum Access, $199
        </Link>
      </div>

      {/* Spacer so sticky bar doesn't cover content on mobile */}
      <div className="md:hidden" style={{ height: '80px' }} aria-hidden="true" />

    </main>
  )
}
