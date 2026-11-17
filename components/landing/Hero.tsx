import Image from 'next/image'
import Link from 'next/link'
import type { HomeContent } from '@gyn/core/home-schema'
import { SdgWheel } from '@/components/SdgWheel'
import { Accent } from './Accent'
import { Scatter, type ScatterItem } from './Scatter'
import s from './landing.module.css'

/**
 * Home hero: one big royal box filling the screen, the words centred in it,
 * and the photos (events and ambassadors) scattered with torn edges down both sides.
 */
export function Hero({ hero, strip, ambassadors }: { hero: HomeContent['hero']; strip: HomeContent['strip']; ambassadors: string }) {
  const { photos, people, stickers, ribbon } = hero.collage
  // events and faces alternate, so each side gets a mix; slot classes place them (scrap0 = top left, then around)
  const scraps = [
    photos[0] && { ...photos[0], kind: 'photo' },
    photos[1] && { ...photos[1], kind: 'photo' },
    people[0] && { ...people[0], kind: 'face' },
    people[1] && { ...people[1], kind: 'face' },
    photos[2] && { ...photos[2], kind: 'photo' },
    people[2] && { ...people[2], kind: 'face' },
  ].filter(Boolean) as ScatterItem[]

  return (
    <section className={s.hero} data-name="Your first global stage" aria-labelledby="hero-h1">
      <div className={s.heroBox}>
        <SdgWheel className={s.wheel} />
        <SdgWheel className={s.wheel2} />

        <Scatter items={scraps} stickers={stickers} dense />

        <div className={s.heroCopy}>
          <Link href={hero.primaryCta.href} className={`glass-dark ${s.eyebrow}`}>
            <span className={s.eyebrowDot} aria-hidden="true" />
            <span>{strip.label.replace(/:$/, '')}: <b>{strip.eventName}</b> · {strip.dateVenue.split(',')[0]}</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <h1 id="hero-h1" className={s.h1}>
            <Accent text={hero.headline} dark />
          </h1>
          <p className={s.lead}>{hero.lead}</p>
          <div className={s.ctas}>
            <Link href={hero.primaryCta.href} className="btn btn-y">
              {hero.primaryCta.label} <span aria-hidden="true">&rarr;</span>
            </Link>
            {hero.secondaryCta.label && (
              <Link href={hero.secondaryCta.href} className={`btn glass-dark ${s.btnGlass}`}>
                {hero.secondaryCta.label}
              </Link>
            )}
          </div>
          {hero.facts.length > 0 && (
            <ul className={s.facts} aria-label="At a glance">
              {hero.facts.map((f) => <li key={f.label} className="glass-dark">{f.label}</li>)}
            </ul>
          )}
          <p className={s.network}>
            {people.length > 0 && (
              <span className={s.faces} aria-hidden="true">
                {people.map((p) => <Image key={p.src} src={p.src} alt="" width={64} height={64} sizes="32px" />)}
              </span>
            )}
            {ambassadors}
          </p>
        </div>

        {ribbon && (
          <div className={s.ribbon} aria-hidden="true">
            <div className={s.ribbonTrack}>
              {Array.from({ length: 10 }, (_, i) => <span key={i}>{ribbon}</span>)}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
