import type { ReactNode } from 'react'
import { Accent } from '@/components/landing/Accent'
import { SdgWheel } from '@/components/SdgWheel'
import { TornPhoto } from './TornPhoto'
import s from './pages.module.css'

export interface BoxPhoto { src: string; alt: string }

/**
 * The royal box every fixed page opens with: a shorter cousin of the home hero.
 * Words centred (kicker pill, headline with the *starred* word in lime, lead, buttons, optional fact chips);
 * photos, if the page has real ones, are scattered with torn edges down both sides. Pass 2 or 4 so both sides match.
 */
export function PageBox({ id, kicker, title, lead, facts, photos = [], above, children }: {
  id: string
  kicker: string
  /** Wrap one word in *stars* to show it in lime. */
  title: string
  lead?: ReactNode
  /** Short facts (dates, venue, price) as glass chips. */
  facts?: string[]
  photos?: BoxPhoto[]
  /** Something to show above the kicker, e.g. the finished SDG wheel. */
  above?: ReactNode
  /** The buttons. */
  children?: ReactNode
}) {
  const shown = photos.length >= 4 ? photos.slice(0, 4) : photos.length >= 2 ? photos.slice(0, 2) : []

  return (
    <section className={s.top} data-name={kicker} aria-labelledby={id}>
      <div className={`${s.box} ${shown.length ? s.withPhotos : ''}`}>
        <SdgWheel className={s.wheel} />
        <SdgWheel className={s.wheel2} />

        {shown.length > 0 && (
          <div className={s.scatter} data-n={shown.length}>
            {shown.map((p, i) => (
              <TornPhoto key={p.src} src={p.src} alt={p.alt} seed={i * 37 + 11} className={s[`ph${i}`]} eager={i === 0} />
            ))}
          </div>
        )}

        <div className={s.copy}>
          {above && <div className={s.above}>{above}</div>}
          <p className={`glass-dark ${s.pill}`}>
            <span className={s.dot} aria-hidden="true" />
            {kicker}
          </p>
          <h1 id={id} className={s.h1}>
            <Accent text={title} dark />
          </h1>
          {lead && <p className={s.lead}>{lead}</p>}
          {facts && facts.length > 0 && (
            <ul className={s.facts} aria-label="At a glance">
              {facts.map((f) => <li key={f} className="glass-dark">{f}</li>)}
            </ul>
          )}
          {children && <div className={s.actions}>{children}</div>}
        </div>
      </div>
    </section>
  )
}
