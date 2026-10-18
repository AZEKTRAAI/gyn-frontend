// Direction J inner-page hero: navy band, slow SDG wheel, capitals headline whose words rise in,
// one *word* in yellow, fact chips, buttons, and an optional photo pinned like a polaroid.
import type { ReactNode } from 'react'
import { accentRuns } from '@/features/home/schema'
import { SdgWheel } from '@/components/SdgWheel'
import styles from './PageHero.module.css'

export function PageHero({
  title,
  kicker,
  lead,
  chips,
  meta,
  actions,
  media,
  id = 'page-h1',
}: {
  /** Wrap one word in *stars* to show it in yellow. */
  title: string
  /** Small red label above the headline, e.g. "SISM 2026". */
  kicker?: string
  lead?: ReactNode
  /** Fact chips (dates, venue, price); the first one is highlighted in yellow. */
  chips?: string[]
  /** Free-form facts row, for when chips are not enough. */
  meta?: ReactNode
  actions?: ReactNode
  media?: ReactNode
  id?: string
}) {
  let w = 0
  return (
    <section className={`${styles.hero} ${media ? styles.withMedia : ''}`} aria-labelledby={id} data-name={kicker}>
      <SdgWheel className={styles.ring} />
      <div className={styles.inner}>
        <div className={styles.text}>
          {kicker && <p className={styles.kicker}>{kicker}</p>}
          <h1 id={id} className={styles.h1}>
            {accentRuns(title).map((r, i) =>
              r.text.split(/(\s+)/).map((tok, j) =>
                /^\s+$/.test(tok) || !tok ? tok : (
                  <span key={`${i}-${j}`} className={`${styles.word} ${r.italic ? styles.acc : ''}`} style={{ '--i': w++ } as React.CSSProperties}>
                    {tok}
                  </span>
                ),
              ),
            )}
          </h1>
          {lead && <div className={styles.lead}>{lead}</div>}
          {chips && chips.length > 0 && (
            <ul className={styles.chips}>
              {chips.map((c, i) => <li key={c} className={i === 0 ? styles.hot : undefined}>{c}</li>)}
            </ul>
          )}
          {meta && <div className={styles.meta}>{meta}</div>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
        {media && <div className={styles.media}>{media}</div>}
      </div>
    </section>
  )
}
