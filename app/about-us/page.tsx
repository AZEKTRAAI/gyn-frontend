import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { DeckSlider } from '@/components/premium/DeckSlider'
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
  { id: 'SDG 4', label: 'Quality Education', color: 'var(--sdg4)' },
  { id: 'SDG 5', label: 'Gender Equality', color: 'var(--sdg5)' },
  { id: 'SDG 9', label: 'Industry, Innovation and Infrastructure', color: 'var(--sdg9)' },
  { id: 'SDG 13', label: 'Climate Action', color: 'var(--sdg13)' },
]

export default function AboutUsPage() {
  const advisoryItems = Object.entries(ADVISORY).map(([key, v]) => {
    const parts = v.alt.split(',')
    return {
      id: key,
      name: parts[0].trim(),
      role: parts.slice(1).join(',').trim(),
      organisation: parts.slice(2).join(',').trim() || parts[1]?.trim() || '',
      imageSrc: v.src,
      imageAlt: v.alt,
    }
  })

  const ambassadorEntries = Object.values(AMBASSADORS)

  return (
    <main id="main" style={{ paddingTop: '3.5rem' }}>

      {/* =====================================================
          HERO
          ===================================================== */}
      <section
        aria-labelledby="about-hero-hd"
        style={{
          background: 'var(--blue-deep)',
          paddingBlock: 'clamp(3rem, 7vw, 6rem)',
        }}
      >
        <div className="wrap">
          <h1
            id="about-hero-hd"
            className="d1"
            style={{ color: 'var(--white)', marginBottom: '1.5rem', maxWidth: '18ch' }}
          >
            ABOUT US
          </h1>
          <p
            style={{
              fontSize: 'clamp(.9375rem, 1.5vw, 1.125rem)',
              color: 'rgba(255,255,255,.9)',
              lineHeight: 1.7,
              maxWidth: '65ch',
            }}
          >
            The Global Youth Network (GYN) is a US-based organization that will provide youth with an
            opportunity to connect with people from various backgrounds coming from different parts of the
            world. Through our international conferences and leadership programs, we aim to target
            students, professionals, innovators, and community leaders to share their ideas and also to
            collaborate on global challenges via provided interactive forums.
          </p>
        </div>
      </section>

      {/* =====================================================
          MISSION + VISION
          ===================================================== */}
      <section
        aria-labelledby="mission-hd"
        style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}
      >
        <div className={`wrap ${styles.missionGrid}`}>
          <div>
            <h2
              id="mission-hd"
              className="d2"
              style={{ color: 'var(--navy-700)', marginBottom: '1.25rem' }}
            >
              Our mission
            </h2>
            <blockquote
              style={{
                borderLeft: '4px solid var(--blue-deep)',
                paddingLeft: '1.25rem',
                margin: 0,
              }}
            >
              <p
                style={{
                  fontSize: 'clamp(.9375rem, 1.3vw, 1.0625rem)',
                  color: 'var(--n-700)',
                  lineHeight: 1.75,
                  fontStyle: 'italic',
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
            <h2
              className="d2"
              style={{ color: 'var(--navy-700)', marginBottom: '1.25rem' }}
            >
              Our vision
            </h2>
            <p
              style={{
                fontSize: 'clamp(.9375rem, 1.3vw, 1.0625rem)',
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
          OBJECTIVES
          ===================================================== */}
      <section
        aria-labelledby="obj-hd"
        style={{ background: 'var(--paper)', paddingBlock: 'var(--sp)' }}
      >
        <div className="wrap">
          <h2
            id="obj-hd"
            className="d2"
            style={{ color: 'var(--navy-900)', marginBottom: '2.5rem' }}
          >
            What we do
          </h2>
          <ul
            style={{ listStyle: 'none', background: 'var(--n-200)' }}
            className={styles.objGrid}
          >
            {OBJECTIVES.map((item, i) => (
              <li
                key={item.title}
                style={{
                  background: i % 2 === 0 ? 'var(--white)' : 'var(--n-50)',
                  padding: '2rem 1.5rem',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--fd)',
                    fontSize: '1rem',
                    color: 'var(--navy-700)',
                    marginBottom: '0.75rem',
                  }}
                >
                  {item.title}
                </p>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--n-600)',
                    lineHeight: 1.65,
                  }}
                >
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* =====================================================
          SDG FOCUS
          ===================================================== */}
      <section
        aria-labelledby="sdg-hd"
        style={{ background: 'var(--navy-900)', paddingBlock: 'var(--sp)' }}
      >
        <div className="wrap">
          <h2
            id="sdg-hd"
            className="d2"
            style={{ color: 'var(--white)', marginBottom: '0.75rem' }}
          >
            4 SDGs we focus on
          </h2>
          <p
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
                style={{
                  background: 'transparent',
                  borderTop: `4px solid ${sdg.color}`,
                  padding: '1.75rem 1.25rem',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--fd)',
                    fontSize: 'clamp(1.5rem, 2.5vw, 1.75rem)',
                    color: sdg.color,
                    display: 'block',
                    marginBottom: '0.5rem',
                  }}
                >
                  {sdg.id}
                </span>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,.8)',
                    lineHeight: 1.5,
                  }}
                >
                  {sdg.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          ADVISORY BOARD — DeckSlider + accessible grid
          ===================================================== */}
      <section
        aria-labelledby="adv-hd"
        style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}
      >
        <div className="wrap">
          <h2
            id="adv-hd"
            className="d2"
            style={{ color: 'var(--navy-900)', marginBottom: '2rem' }}
          >
            Global advisory board
          </h2>
          <div className={styles.advGrid}>
            {/* DeckSlider for visual interaction */}
            <div>
              <DeckSlider items={advisoryItems} heading="Global advisory board" />
            </div>
            {/* Accessible grid fallback — visually hidden; DeckSlider's sr-only list serves ATs */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <ul
                aria-label="Advisory board members"
                style={{ listStyle: 'none' }}
                className={styles.advPersonGrid}
              >
                {Object.entries(ADVISORY).map(([key, v]) => {
                  const parts = v.alt.split(',')
                  return (
                    <li key={key}>
                      <Image
                        src={v.src}
                        alt={v.alt}
                        width={200}
                        height={200}
                        sizes="(max-width: 768px) 45vw, 200px"
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          objectFit: 'cover',
                          marginBottom: '0.625rem',
                        }}
                        loading="lazy"
                      />
                      <p
                        style={{
                          fontFamily: 'var(--fd)',
                          fontSize: '0.8125rem',
                          color: 'var(--navy-700)',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {parts[0].trim()}
                      </p>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--n-600)',
                          lineHeight: 1.4,
                        }}
                      >
                        {parts.slice(1).join(',').trim()}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          AMBASSADORS — 12 people, 11 countries
          ===================================================== */}
      <section
        aria-labelledby="amb-hd"
        style={{ background: 'var(--paper)', paddingBlock: 'var(--sp)' }}
      >
        <div className="wrap">
          <h2
            id="amb-hd"
            className="d2"
            style={{ color: 'var(--navy-900)', marginBottom: '0.75rem' }}
          >
            GYN ambassadors
          </h2>
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'var(--n-600)',
              marginBottom: '2rem',
            }}
          >
            12 ambassadors representing 11 countries.
          </p>
          <ul
            aria-label="GYN ambassadors"
            style={{ listStyle: 'none' }}
            className={styles.ambGrid}
          >
            {ambassadorEntries.map((v) => (
              <li key={v.alt}>
                <Image
                  src={v.src}
                  alt={v.alt}
                  width={400}
                  height={400}
                  sizes="(max-width: 480px) 45vw, (max-width: 768px) 30vw, 22vw"
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    objectFit: 'cover',
                    marginBottom: '0.75rem',
                  }}
                  loading="lazy"
                />
                <p
                  style={{
                    fontFamily: 'var(--fd)',
                    fontSize: '0.875rem',
                    color: 'var(--navy-700)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {v.alt.split(',')[0].replace('GYN Ambassador', '').trim()}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--n-600)' }}>
                  {v.country}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* =====================================================
          PARTNERS
          ===================================================== */}
      <section
        aria-labelledby="par-hd"
        style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}
      >
        <div className="wrap">
          <h2
            id="par-hd"
            className="d2"
            style={{ color: 'var(--navy-900)', marginBottom: '2rem' }}
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
          >
            {PARTNERS.map((p) => (
              <Image
                key={p.src}
                src={p.src}
                alt={p.alt}
                width={p.width}
                height={p.height}
                style={{ height: '2.5rem', width: 'auto' }}
                loading="lazy"
              />
            ))}
          </div>
          <div
            style={{
              paddingTop: '2rem',
              borderTop: '1px solid var(--n-200)',
            }}
          >
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--n-600)',
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
              style={{ height: '3rem', width: 'auto' }}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          PARTNER WITH US CTA (persona Dr. Farah)
          ===================================================== */}
      <section
        aria-labelledby="partner-cta-hd"
        style={{ background: 'var(--blue-deep)', paddingBlock: 'var(--sp)' }}
      >
        <div
          className="wrap"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '1.5rem' }}
        >
          <h2
            id="partner-cta-hd"
            className="d2"
            style={{ color: 'var(--white)' }}
          >
            Partner with us
          </h2>
          <p
            style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,.85)',
              lineHeight: 1.7,
              maxWidth: '60ch',
            }}
          >
            GYN brings together youth leaders, researchers and organizations from across the globe.
            If your organization shares our commitment to the Sustainable Development Goals, we would
            welcome a conversation about how we can work together.
          </p>
          <Link
            href="/contact-us?topic=partnership"
            className="btn btn-y"
          >
            Get in touch about partnership
          </Link>
        </div>
      </section>
    </main>
  )
}
