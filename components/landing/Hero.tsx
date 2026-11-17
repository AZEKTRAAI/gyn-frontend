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
export function Hero({ hero, strip }: { hero: HomeContent['hero']; strip: HomeContent['strip'] }) {
  const { photos, people, stickers } = hero.collage
  // four photos: events top left and right, two faces between them (slot classes scrap0 to scrap3)
  const scraps = [
    photos[0] && { ...photos[0], kind: 'photo' },
    photos[1] && { ...photos[1], kind: 'photo' },
    people[0] && { ...people[0], kind: 'face' },
    people[1] && { ...people[1], kind: 'face' },
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
        </div>
      </div>
    </section>
  )
}
