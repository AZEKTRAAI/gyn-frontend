// Direction I inner-page hero: light field, big Host Grotesk headline with one Bodoni italic word
// (*word* in the title), optional facts row, buttons and a media slot on the right.
import type { ReactNode } from 'react'
import { accentRuns } from '@/features/home/schema'
import styles from './PageHero.module.css'

export function PageHero({
  title,
  lead,
  meta,
  actions,
  media,
  tone = 'field',
  id = 'page-h1',
}: {
  /** Wrap one word in *stars* for the italic accent. */
  title: string
  lead?: ReactNode
  /** Short facts (dates, venue, price) shown as a quiet row under the lead. */
  meta?: ReactNode
  actions?: ReactNode
  media?: ReactNode
  tone?: 'field' | 'ink'
  id?: string
}) {
  return (
    <section className={`${styles.hero} ${tone === 'ink' ? styles.ink : ''} ${media ? styles.withMedia : ''}`} aria-labelledby={id}>
      <div className={styles.inner}>
        <div className={styles.text}>
          <h1 id={id} className={styles.h1}>
            {accentRuns(title).map((r, i) => (r.italic ? <em key={i} className="accent">{r.text}</em> : r.text))}
          </h1>
          {lead && <div className={styles.lead}>{lead}</div>}
          {meta && <div className={styles.meta}>{meta}</div>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
        {media && <div className={styles.media}>{media}</div>}
      </div>
    </section>
  )
}
