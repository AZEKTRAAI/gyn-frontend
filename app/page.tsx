import type { Metadata } from 'next'
import Link from 'next/link'
import { getHome } from '@/features/home/store'
import { accentRuns, countdownTarget } from '@/features/home/schema'
import { Countdown } from '@/components/Countdown'
import { AboutSection } from '@/components/home/AboutSection'
import { FocusSection } from '@/components/home/FocusSection'
import { ObjectivesSection } from '@/components/home/ObjectivesSection'
import { AdvisorsSection } from '@/components/home/AdvisorsSection'
import { AmbassadorsSection } from '@/components/home/AmbassadorsSection'
import { EventsSection } from '@/components/home/EventsSection'
import { PartnersSection } from '@/components/home/PartnersSection'
import { ClosingSection } from '@/components/home/ClosingSection'
import { HeroWheel } from '@/components/home/HeroWheel'

// Render time: Countdown hydrates against it so server HTML matches initial client render
const RENDERED_AT = Date.now()

export async function generateMetadata(): Promise<Metadata> {
  const content = await getHome()
  return {
    title: content.seo.title,
    description: content.seo.description,
  }
}

export default async function HomePage() {
  const content = await getHome()
  const { hero, about, focus, objectives, advisors, ambassadors, events, partners, closing } = content

  const cdTarget = countdownTarget(hero)
  const heroRuns = accentRuns(hero.headline)

  return (
    <main id="main">

      {/* HERO — centred Apple composition */}
      <section
        className="home-hero"
        aria-labelledby="hero-h1"
        style={{
          minHeight: '100svh',
          background: '#EEF2F6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '72px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Text block — nothing above the H1 */}
        <div
          className="home-hero-text"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '0.875rem',
            maxWidth: '1100px',
            width: '100%',
            padding: 'clamp(12px,2vw,28px) clamp(16px,4vw,40px) 0',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <h1
            id="hero-h1"
            style={{
              fontFamily: 'var(--font-host-grotesk, var(--fb))',
              fontSize: 'clamp(3rem,6.5vw,5.5rem)',
              letterSpacing: '-0.022em',
              lineHeight: 1.03,
              fontWeight: 600,
              color: '#0E1530',
              whiteSpace: 'pre-line', // editors set line breaks in the admin
            }}
          >
            {heroRuns.map((part, i) =>
              part.italic ? (
                <em
                  key={i}
                  style={{ fontFamily: 'var(--font-bodoni, Georgia, serif)', fontStyle: 'italic', fontWeight: 400 }}
                >
                  {part.text}
                </em>
              ) : (
                <span key={i}>{part.text}</span>
              ),
            )}
          </h1>

          <p
            style={{
              fontSize: 'clamp(1.0625rem,1.8vw,1.375rem)',
              color: '#202F60',
              lineHeight: 1.38,
              fontWeight: 400,
              maxWidth: '720px',
              textAlign: 'center',
            }}
          >
            <strong style={{ fontWeight: 600, color: '#0E1530' }}>{hero.eventName}</strong>
            <br />
            {hero.dateVenue}
            {hero.note && (
              <>
                <br />
                {hero.note}
              </>
            )}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link
              href={hero.primaryCta.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#FCC30B',
                color: '#0E1530',
                fontSize: '1rem',
                fontWeight: 600,
                padding: '0.875rem 1.75rem',
                borderRadius: '999px',
                transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)',
                minHeight: '44px',
              }}
            >
              {hero.primaryCta.label} <span aria-hidden="true">&#8594;</span>
            </Link>
            {hero.secondaryCta.label && (
              <Link
                href={hero.secondaryCta.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  background: 'transparent',
                  color: '#202F60',
                  fontSize: '1rem',
                  fontWeight: 500,
                  padding: '0.875rem 1.5rem',
                  borderRadius: '999px',
                  border: '1.5px solid rgba(32,47,96,.3)',
                  transition: 'border-color 160ms, transform 160ms cubic-bezier(0.23,1,0.32,1)',
                  minHeight: '44px',
                }}
              >
                {hero.secondaryCta.label}
              </Link>
            )}
          </div>

          {cdTarget !== null && cdTarget > RENDERED_AT && (
            <div style={{ fontSize: '0.8125rem', color: '#202F60', opacity: 0.7 }}>
              <Countdown serverNow={RENDERED_AT} target={cdTarget} />
            </div>
          )}
        </div>

        {/* SDG wheel canvas / poster */}
        <HeroWheel />
      </section>

      {/* ABOUT — heading + body + type poster */}
      {about.visible && (
        <AboutSection about={about} />
      )}

      {/* FOCUS — SDG chapters */}
      {focus.visible && focus.goals.length > 0 && (
        <FocusSection focus={focus} />
      )}

      {/* OBJECTIVES — ruled grid list */}
      {objectives.visible && objectives.items.length > 0 && (
        <ObjectivesSection objectives={objectives} />
      )}

      {/* ADVISORS — name list + sticky photo */}
      {advisors.visible && advisors.people.length > 0 && (
        <AdvisorsSection advisors={advisors} />
      )}

      {/* AMBASSADORS — mosaic */}
      {ambassadors.visible && ambassadors.people.length > 0 && (
        <AmbassadorsSection ambassadors={ambassadors} />
      )}

      {/* EVENTS — large first card + smaller cards */}
      {events.visible && events.items.length > 0 && (
        <EventsSection events={events} />
      )}

      {/* PARTNERS — ink band with logos */}
      {partners.visible && partners.logos.length > 0 && (
        <PartnersSection partners={partners} />
      )}

      {/* CLOSING — hands video + poster headline */}
      {closing.visible && (
        <ClosingSection closing={closing} />
      )}

      <style>{`
        /* Hero mobile: unstick the wheel */
        @media (max-width: 1023px) {
          .home-hero { height: auto; overflow: visible; }
          .home-hero-wheel { width: min(88vw, 420px); margin-top: -6%; }
        }
        @media (max-width: 767px) {
          .home-hero-wheel { width: min(96vw, 360px); }
        }
      `}</style>
    </main>
  )
}
