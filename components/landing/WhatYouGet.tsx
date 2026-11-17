import Image from 'next/image'
import type { HomeContent } from '@gyn/core/home-schema'
import { SDG_COLOURS } from '@gyn/core/home-schema'
import { SectionHead } from './SectionHead'
import s from './landing.module.css'

type Tile = HomeContent['benefits']['tiles'][number]

function Card({ t }: { t: Tile }) {
  return (
    <li className={`glass-lite ${s.getCard}`} style={{ ['--sdg' as string]: SDG_COLOURS[t.sdg].bg }}>
      <b>{t.big}</b>
      <p>{t.text}</p>
    </li>
  )
}

/** What every delegate leaves with: the photo, and the benefit cards beside it. */
export function WhatYouGet({ data }: { data: HomeContent['benefits'] }) {
  return (
    <section id="get" className={`${s.section} ${s.glowSection}`} data-name="What you leave with" aria-labelledby="get-h2">
      <div className="wrap">
        <SectionHead id="get-h2" heading={data.heading} />
        <div className={s.getGrid}>
          <figure className={s.getPhoto}>
            <Image src={data.photo.src} alt={data.photo.alt} fill sizes="(max-width: 900px) 100vw, 40vw" style={{ objectFit: 'cover' }} />
            <figcaption className={`glass ${s.getCaption}`}>
              <b>{data.photoBig}</b>
              <span>{data.photoText}</span>
            </figcaption>
          </figure>
          <ul className={s.getCol}>{data.tiles.map((t) => <Card key={t.big} t={t} />)}</ul>
        </div>
      </div>
    </section>
  )
}
