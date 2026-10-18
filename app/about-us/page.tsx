import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { AdvisorsSection } from '@/components/home/AdvisorsSection'
import { PageHero } from '@/components/PageHero'
import {
  ADVISORY,
  AMBASSADORS,
  PARTNERS,
  LOGOS,
} from '@/features/media/media'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'The Global Youth Network (GYN) is a US-based organization connecting youth with people from various backgrounds. Through international conferences and leadership programs we target students, professionals, innovators, and community leaders.',
  openGraph: {
    title: 'About Us – Global Youth Network',
    description:
      'GYN provides youth with an opportunity to connect with people from various backgrounds and collaborate on global challenges via interactive forums.',
  },
}

const OBJECTIVES = [
  {
    title: 'Conferences',
    body: 'GYN hosts international forums, workshops and summits to promote dialogue on Sustainable Development Goals.',
  },
  {
    title: 'Networking',
    body: 'Providing a collaborative space of mentorship, technical support and resource sharing to address pressing global challenges.',
  },
  {
    title: 'Leadership development',
    body: 'Building a new generation of leaders with the foresight, integrity and skills for measurable global impact.',
  },
  {
    title: 'Youth mentoring',
    body: 'Providing tailor-made, hands-on mentoring to help youth become effective leaders.',
  },
  {
    title: 'Workshops and training',
    body: 'Building leadership capacities and policy expertise for future-ready governance.',
  },
]

const SDG_FOCUS = [
  { id: 'SDG 4', label: 'Quality Education', color: '#C5192D', textColor: '#fff' },
  { id: 'SDG 5', label: 'Gender Equality', color: '#FF3A21', textColor: 'var(--ink)' },
  { id: 'SDG 9', label: 'Industry, Innovation and Infrastructure', color: '#FD6925', textColor: 'var(--ink)' },
  { id: 'SDG 13', label: 'Climate Action', color: '#3F7E44', textColor: '#fff' },
]

export default function AboutUsPage() {
  // Map ADVISORY manifest to the shape AdvisorsSection expects
  const advisorPeople = Object.values(ADVISORY).map((v) => {
    const parts = v.alt.split(',')
    return {
      name: parts[0].trim(),
      role: parts.slice(1).join(',').trim(),
      bio: '',
      photo: { src: v.src, alt: v.alt },
    }
  })

  const ambassadorEntries = Object.values(AMBASSADORS)

  return (
    <main id="main">

      {/* Hero — navy, hands-wheel render on the right */}
      <PageHero
        title="*About* GYN"
        kicker="About GYN"
        lead="The Global Youth Network connects young people worldwide through international summits, leadership programs and four Sustainable Development Goal focus areas."
        media={
          <Image
            src="/renders/r3/hands-wheel-poster.webp"
            alt="Four hands holding the SDG wheel, representing GYN's four focus goals"
            width={640}
            height={640}
            priority
          />
        }
      />

      {/* =====================================================
          MISSION + VISION — white band
          ===================================================== */}
      <section
        aria-labelledby="mission-hd"
        data-name="Our mission"
        style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}
      >
        <div className={`wrap ${styles.missionGrid}`}>
          <div>
            <p className="kick">GYN Mission</p>
            <h2
              id="mission-hd"
              className="d2"
              style={{ color: 'var(--ink)', marginBottom: '1.5rem' }}
            >
              Our mission
            </h2>
            {/* Pull quote as a large upright Newsreader quote on a navy card */}
            <blockquote
              style={{
                background: 'var(--navy)',
                borderRadius: '20px',
                padding: '2rem',
                margin: 0,
              }}
            >
              <p
                style={{
                  fontSize: 'clamp(1rem, 1.3vw, 1.125rem)',
                  color: '#fff',
                  lineHeight: 1.75,
                }}
              >
                &ldquo;Empowering youth by cultivating leadership skills via a goal-driven network
                of GYN, the dedicated platform bringing sustainable change in communities via global
                interactions through cross-functional ideas ranging from, but not limited to,
                students, scientists, researchers, policymakers, legal professionals, volunteers,
                and entrepreneurs.&rdquo;
              </p>
            </blockquote>
          </div>
          <div>
            <p className="kick">GYN Vision</p>
            <h2
              className="d2"
              style={{ color: 'var(--ink)', marginBottom: '1.25rem' }}
            >
              Our vision
            </h2>
            <p
              style={{
                fontSize: 'clamp(0.9375rem, 1.3vw, 1.0625rem)',
                color: 'var(--n-700)',
                lineHeight: 1.75,
              }}
            >
              GYN is a global platform for young people connecting students, professionals,
              researchers and innovators. The platform will be organizing various collaborative
              activities where individuals will be able to utilize their skills, communicate and
              learn from diverse knowledge based network. Its goal is to bring inspiration to young
              and responsible leaders of tomorrow.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          OBJECTIVES — field band, J card tiles
          ===================================================== */}
      <section
        aria-labelledby="obj-hd"
        data-name="What we do"
        style={{ background: 'var(--field)', paddingBlock: 'var(--sp)' }}
      >
        <div className="wrap">
          <p className="kick">What we do</p>
          <h2
            id="obj-hd"
            className="d2"
            style={{ color: 'var(--ink)', marginBottom: 'clamp(2rem, 3vw, 3rem)' }}
          >
            Five ways GYN works
          </h2>
          <div className={styles.objGrid} role="list">
            {OBJECTIVES.map((item) => (
              <div key={item.title} role="listitem" className="card">
                <p
                  style={{
                    fontFamily: 'var(--fd)',
                    fontSize: '1.25rem',
                    color: 'var(--ink)',
                    marginBottom: '0.75rem',
                  }}
                >
                  {item.title}
                </p>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    color: 'var(--navy)',
                    lineHeight: 1.6,
                  }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          SDG FOCUS — navy band, four SDG colour tiles
          ===================================================== */}
      <section
        aria-labelledby="sdg-hd"
        data-name="Our focus"
        className="band-navy"
        style={{ paddingBlock: 'var(--sp)' }}
      >
        <div className="wrap">
          <p className="kick kick-y">SDG Focus</p>
          <h2
            id="sdg-hd"
            className="d2"
            style={{ color: 'var(--white)', marginBottom: '0.75rem' }}
          >
            Four goals we focus on
          </h2>
          <p
            className="rise"
            style={{
              fontSize: '0.9375rem',
              color: 'rgba(255,255,255,.75)',
              lineHeight: 1.65,
              marginBottom: '2.5rem',
              maxWidth: '60ch',
            }}
          >
            With our target focus on four SDGs (4, 5, 9 and 13), we hope to bring sustainable
            change through local communities to global outreach.
          </p>
          <div className={styles.sdgGrid}>
            {SDG_FOCUS.map((sdg) => (
              <div
                key={sdg.id}
                className="tile"
                style={{ background: sdg.color, color: sdg.textColor }}
              >
                <span className="tile-n">{sdg.id}</span>
                <p
                  style={{
                    fontSize: '0.875rem',
                    lineHeight: 1.4,
                    marginTop: '0.5rem',
                  }}
                >
                  {sdg.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          ADVISORY BOARD — white band, sticky-photo pattern
          (reuses AdvisorsSection from home, mapped from ADVISORY manifest)
          ===================================================== */}
      <AdvisorsSection
        kicker="Advisory Board"
        advisors={{ visible: true, heading: 'Global advisory board', people: advisorPeople }}
      />

      {/* =====================================================
          AMBASSADORS — field band, polaroid photo grid
          12 ambassadors, 11 countries
          ===================================================== */}
      <section
        aria-labelledby="amb-hd"
        data-name="Our ambassadors"
        style={{ background: 'var(--field)', paddingBlock: 'var(--sp)' }}
      >
        <div className="wrap">
          <p className="kick">Ambassadors</p>
          <h2
            id="amb-hd"
            className="d2"
            style={{ color: 'var(--ink)', marginBottom: '0.75rem' }}
          >
            GYN ambassadors
          </h2>
          <p
            className="rise"
            style={{
              fontSize: '0.9375rem',
              color: 'var(--n-600)',
              marginBottom: '2.5rem',
            }}
          >
            12 ambassadors representing 11 countries.
          </p>
          <ul aria-label="GYN ambassadors" className={styles.ambGrid}>
            {ambassadorEntries.map((v) => (
              <li key={v.alt}>
                <figure className="pol">
                  <Image
                    src={v.src}
                    alt={v.alt}
                    width={400}
                    height={400}
                    sizes="(max-width: 480px) 45vw, (max-width: 768px) 30vw, 22vw"
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <figcaption>
                    <p style={{ fontFamily: 'var(--fd)', fontSize: '0.875rem', color: 'var(--ink)' }}>
                      {v.alt.split(',')[0].replace('GYN Ambassador', '').trim()}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--n-600)', marginTop: '0.2rem' }}>
                      {v.country}
                    </p>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* =====================================================
          PARTNERS — navy band, white logos via CSS invert filter
          (matches PartnersSection.tsx pattern from home page)
          ===================================================== */}
      <section
        aria-labelledby="par-hd"
        data-name="Partners"
        className="band-navy"
        style={{ paddingBlock: 'clamp(56px,7vw,112px)' }}
      >
        <div className="wrap">
          <p className="kick kick-y">Our Partners</p>
          <h2
            id="par-hd"
            className="d2"
            style={{ color: 'var(--white)', marginBottom: 'clamp(24px,3vw,40px)' }}
          >
            Our partners
          </h2>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2.5rem',
              alignItems: 'center',
              marginBottom: '2.5rem',
            }}
            role="list"
          >
            {PARTNERS.map((p) => (
              <div key={p.src} role="listitem">
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={p.width}
                  height={p.height}
                  style={{ height: '2.5rem', width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.8 }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          <div
            style={{
              paddingTop: '2rem',
              borderTop: '1px solid rgba(255,255,255,.12)',
            }}
          >
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'rgba(255,255,255,.8)',
                marginBottom: '1rem',
              }}
            >
              Co-hosted with
            </p>
            <Image
              src={LOGOS['logo.unu-global-health'].src}
              alt={LOGOS['logo.unu-global-health'].alt}
              width={LOGOS['logo.unu-global-health'].width}
              height={LOGOS['logo.unu-global-health'].height}
              style={{ height: '3rem', width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.85 }}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          PARTNER WITH US CTA — yellow band-y closing section
          ===================================================== */}
      <section
        aria-labelledby="partner-cta-hd"
        data-name="Partner with us"
        className="band-y"
        style={{ paddingBlock: 'var(--sp)' }}
      >
        <div
          className="wrap"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '1.5rem' }}
        >
          <p className="kick">Get in touch</p>
          <h2
            id="partner-cta-hd"
            className="d2"
          >
            Partner with us
          </h2>
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--ink)',
              lineHeight: 1.7,
              maxWidth: '60ch',
              opacity: 0.85,
            }}
          >
            GYN brings together youth leaders, researchers and organizations from across the globe.
            If your organization shares our commitment to the Sustainable Development Goals, we would
            welcome a conversation about how we can work together.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Link href="/contact-us?topic=partnership" className="btn btn-n">
              Get in touch about partnership
            </Link>
            <Link href="/sism-2026" className="btn btn-n">
              Explore SISM 2026
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
