import Image from 'next/image'
import Link from 'next/link'
import type { HomeContent } from '@gyn/core/home-schema'
import { Accent } from './Accent'
import s from './landing.module.css'

/** Partners as a quiet logo row, then the closing call to action on the royal panel that bookends the hero. */
export function Closing({ partners, closing }: { partners: HomeContent['partners']; closing: HomeContent['closing'] }) {
  return (
    <>
      {partners.visible && (
        <section className={s.partners} data-name="Partners" aria-labelledby="partners-h2">
          <div className="wrap">
            <div className={s.cohost}>
              <Image src={partners.cohost.logo.src} alt={partners.cohost.logo.alt} width={160} height={64} className={s.cohostLogo} />
              <p>{partners.cohost.text}</p>
            </div>
            <h2 id="partners-h2" className={s.sideLabel}>{partners.heading}</h2>
            <ul className={s.logos}>
              {partners.logos.map((l) => {
                const img = <Image src={l.logo} alt={l.name} width={140} height={48} className={s.logo} />
                return <li key={l.logo}>{l.href ? <a href={l.href} target="_blank" rel="noopener noreferrer">{img}</a> : img}</li>
              })}
            </ul>
          </div>
        </section>
      )}

      {closing.visible && (
        <section className={s.closingWrap} data-name="Apply" aria-labelledby="closing-h2">
          <div className="wrap">
            <div className={s.closing}>
              <h2 id="closing-h2" className={s.closingH}><Accent text={closing.headline} dark /></h2>
              <p className={s.closingText}>{closing.text.replace(/\*/g, '')}</p>
              <div className={s.ctas}>
                <Link href={closing.primaryCta.href} className="btn btn-y">
                  {closing.primaryCta.label} <span aria-hidden="true">&rarr;</span>
                </Link>
                {closing.secondaryCta.label && (
                  <Link href={closing.secondaryCta.href} className="btn btn-ow">{closing.secondaryCta.label}</Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
