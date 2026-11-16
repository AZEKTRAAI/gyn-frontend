import type { HomeContent } from '@gyn/core/home-schema'
import { SectionHead } from './SectionHead'
import s from './landing.module.css'

/** "Who we are": GYN itself, before any single event (the client found the old home page read like one event's page). */
export function About({ data }: { data: HomeContent['about'] }) {
  return (
    <section id="who" className={s.section} data-name="Who we are" aria-labelledby="who-h2">
      <div className="wrap">
        <SectionHead id="who-h2" kicker={data.kicker} heading={data.heading} intro={data.text} link={data.cta} />

        {data.stats.length > 0 && (
          <div className={s.statsStage}>
            <ul className={s.stats}>
              {data.stats.map((x) => (
                <li key={x.label} className="glass">
                  <b>{x.n}</b>
                  <span>{x.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.objectives.length > 0 && (
          <ol className={s.objectives}>
            {data.objectives.map((o, i) => (
              <li key={o.title} className="glass-lite">
                <span className={s.objN} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3>{o.title}</h3>
                <p>{o.text}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
