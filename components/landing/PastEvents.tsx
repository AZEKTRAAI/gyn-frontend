import Link from 'next/link'
import type { HomeContent } from '@gyn/core/home-schema'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'
import { SectionHead } from './SectionHead'
import s from './landing.module.css'

/** Past summits as admission tickets (the client liked the ticket and stamp), each with its video playing in place. */
export function PastEvents({ data }: { data: HomeContent['past'] }) {
  return (
    <section id="past" className={s.section} data-name="Past summits" aria-labelledby="past-h2">
      <div className="wrap">
        <SectionHead id="past-h2" heading={data.heading} />

        <ul className={s.tickets}>
          {data.editions.map((ed) => (
            <li key={ed.name} className={s.ticketRow}>
              <article className={`glass-lite ${s.ticket}`}>
                <div className={s.ticketTop}>
                  <span className={s.ticketEdition}>{ed.edition}</span>
                  {ed.stamp && <span className={s.stamp}>{ed.stamp}</span>}
                </div>
                <h3 className={s.ticketName}>{ed.name}</h3>
                <p className={s.ticketDates}>{ed.dates}</p>
                <p className={s.ticketText}>{ed.text}</p>
                <div className={s.tear} aria-hidden="true" />
                <ul className={s.ticketFacts}>
                  {ed.facts.map((f) => (
                    <li key={f.label}><b>{f.n}</b> {f.label}</li>
                  ))}
                </ul>
                {ed.link && (
                  <Link href={ed.link} className={s.textLink}>
                    See the summit <span aria-hidden="true">&rarr;</span>
                  </Link>
                )}
              </article>
              <div className={s.ticketVideo}>
                <YouTubeEmbed
                  videoUrl={ed.videoUrl}
                  posterSrc={ed.videoPoster.src}
                  posterAlt={ed.videoPoster.alt}
                  overlayClassName={s.playOverlay}
                  playBtnClassName={s.playBtn}
                />
              </div>
            </li>
          ))}
        </ul>
        {data.note && <p className={s.small}>{data.note}</p>}
      </div>
    </section>
  )
}
