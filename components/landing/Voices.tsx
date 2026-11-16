import Image from 'next/image'
import type { HomeContent } from '@gyn/core/home-schema'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'
import { SectionHead } from './SectionHead'
import s from './landing.module.css'

/** Delegate quotes and on-camera stories (the client liked the tilted portrait videos), then the photo wall as one strip. */
export function Voices({ stories, gallery }: { stories: HomeContent['stories']; gallery: HomeContent['gallery'] }) {
  const photos = gallery.visible ? gallery.items : []
  return (
    <>
    <section id="voices" className={`${s.section} ${s.glowSection}`} data-name="Delegates, in their own words" aria-labelledby="voices-h2">
      <div className="wrap">
        <SectionHead id="voices-h2" kicker={stories.kicker} heading={stories.heading} intro={stories.intro} />

        <div className={s.voicesGrid}>
          {stories.quotes.length > 0 && (
            <ul className={s.quotes}>
              {stories.quotes.map((q) => (
                <li key={q.name + q.quote.slice(0, 20)} className={`glass-lite ${s.quote}`}>
                  <blockquote>&ldquo;{q.quote}&rdquo;</blockquote>
                  <div className={s.quoteBy}>
                    <Image src={q.photo.src} alt={q.photo.alt} width={52} height={52} sizes="52px" />
                    <span>
                      <b>{q.name}</b>
                      <small>{[q.status, q.country].filter(Boolean).join(' · ')}</small>
                    </span>
                  </div>
                  {q.link && <a href={q.link} className={s.textLink} target="_blank" rel="noopener noreferrer">Read the post <span aria-hidden="true">&rarr;</span></a>}
                </li>
              ))}
            </ul>
          )}
          {stories.videos.length > 0 && (
            <ul className={s.shorts}>
              {stories.videos.map((v) => (
                <li key={v.url} className={s.short}>
                  <YouTubeEmbed
                    videoUrl={v.url}
                    posterSrc={v.poster.src}
                    posterAlt={v.poster.alt}
                    overlayClassName={s.playOverlay}
                    playBtnClassName={s.playBtn}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>

    {/* the photo wall is its own short section, so each one fits on a screen */}
    {photos.length > 0 && (
      <section id="wall" className={s.wallSection} data-name="The wall" aria-labelledby="wall-h2">
        <div className="wrap">
          <SectionHead id="wall-h2" kicker={gallery.kicker} heading={gallery.heading} intro={gallery.intro} />
        </div>
        <ul className={s.strip}>
          {photos.map((p) => (
            <li key={p.image.src} className={s.stripItem}>
              <Image src={p.image.src} alt={p.image.alt} fill sizes="(max-width: 900px) 70vw, 26vw" style={{ objectFit: 'cover' }} />
              {(p.title || p.caption) && (
                <span className={`glass-dark ${s.stripCaption}`}>{p.title || p.caption}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    )}
    </>
  )
}
