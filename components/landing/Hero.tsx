import Image from 'next/image'
import Link from 'next/link'
import type { HomeContent } from '@gyn/core/home-schema'
import { SdgWheel } from '@/components/SdgWheel'
import { Accent } from './Accent'
import { tornPolygon } from './torn'
import s from './landing.module.css'

/**
 * Home hero, centred on a colour mesh: headline, buttons and glass fact chips, then the wide collage stage
 * (real photos with torn-paper edges, stickers, SDG wheel, ribbon) with two matching glass cards at its lower corners.
 */
export function Hero({ hero, strip, ambassadors }: { hero: HomeContent['hero']; strip: HomeContent['strip']; ambassadors: string }) {
  const { photos, people, stickers, ribbon } = hero.collage
  return (
    <section className={s.hero} data-name="Your first global stage" aria-labelledby="hero-h1">
      <div className={`wrap ${s.heroInner}`}>
        <p className={`glass ${s.eyebrow}`}>
          <span className={s.eyebrowDot} aria-hidden="true" /> Global Youth Network
        </p>
        <h1 id="hero-h1" className={s.h1}>
          <Accent text={hero.headline} />
        </h1>
        <p className={s.lead}>{hero.lead}</p>
        <div className={s.ctas}>
          <Link href={hero.primaryCta.href} className="btn btn-y">
            {hero.primaryCta.label} <span aria-hidden="true">&rarr;</span>
          </Link>
          {hero.secondaryCta.label && (
            <Link href={hero.secondaryCta.href} className={`btn ${s.btnGlass}`}>
              {hero.secondaryCta.label}
            </Link>
          )}
        </div>
        {hero.facts.length > 0 && (
          <ul className={s.facts} aria-label="At a glance">
            {hero.facts.map((f) => <li key={f.label} className="glass">{f.label}</li>)}
          </ul>
        )}

        <div className={s.stageWrap}>
          <div className={s.stage}>
            <SdgWheel className={s.wheel} />
            <SdgWheel className={s.wheel2} />
            <svg className={s.burst} viewBox="0 0 100 100" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <rect key={i} x="47" y="4" width="6" height="34" rx="3" transform={`rotate(${i * 30} 50 50)`} />
              ))}
            </svg>
            <svg className={s.plane} viewBox="0 0 64 48" aria-hidden="true">
              <path d="M2 22 62 2 44 46 30 30z" fill="#fff" />
              <path d="M30 30 62 2 24 26z" fill="#C9D3FF" />
            </svg>

            {photos.map((p, i) => (
              <figure key={p.src + i} className={`${s.paper} ${s[`paper${i}`]}`}>
                <div className={s.paperCut} style={{ clipPath: tornPolygon(i * 37 + 11) }}>
                  <div className={s.paperImg}>
                    <Image
                      src={p.src}
                      alt={p.alt}
                      fill
                      // the big photo is the largest element on desktop (the headline is on phones), so it loads at once
                      loading={i === 0 ? 'eager' : 'lazy'}
                      fetchPriority={i === 0 ? 'high' : 'auto'}
                      sizes={i === 0 ? '(max-width: 900px) 80vw, 40vw' : '(max-width: 900px) 40vw, 22vw'}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </figure>
            ))}

            {stickers.map((t, i) => (
              <span key={t} className={`${s.sticker} ${s[`sticker${i}`]}`} aria-hidden="true">{t}</span>
            ))}

            {ribbon && (
              <div className={s.ribbon} aria-hidden="true">
                <div className={s.ribbonTrack}>
                  {Array.from({ length: 10 }, (_, i) => <span key={i}>{ribbon}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* two matching glass cards, one at each lower corner */}
          <div className={`glass ${s.floatCard} ${s.floatL}`}>
            {people.length > 0 && (
              <ul className={s.faces}>
                {people.map((p) => (
                  <li key={p.src}><Image src={p.src} alt={p.alt} width={80} height={80} sizes="48px" /></li>
                ))}
              </ul>
            )}
            <span className={s.floatText}><b>Global network</b>{ambassadors}</span>
          </div>
          <Link href={hero.primaryCta.href} className={`glass ${s.floatCard} ${s.floatR}`}>
            <span className={s.floatText}><b>{strip.label.replace(/:$/, '')}: {strip.eventName}</b>{strip.dateVenue}</span>
            <span className={s.floatGo} aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
