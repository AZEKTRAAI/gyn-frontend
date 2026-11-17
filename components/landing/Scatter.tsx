import Image from 'next/image'
import { tornPolygon } from './torn'
import s from './landing.module.css'

export interface ScatterItem {
  src: string
  alt: string
  /** 'face' crops portrait (4:5), 'photo' landscape (4:3). */
  kind?: 'photo' | 'face'
}

/** Which of the six slots (0 = top left, 1 = top right, 2 and 3 = middle pair, 4 = bottom left, 5 = bottom right) a photo set uses, so a short set still looks balanced. */
const SLOTS: number[][] = [[], [0], [0, 1], [0, 1, 4], [0, 1, 2, 3], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4, 5]]

/**
 * The torn-paper photos scattered down both sides of a royal hero box (home hero and event pages), with the
 * optional stickers, starburst and paper plane. Place it inside the box; the words sit above it.
 */
export function Scatter({ items, stickers = [], dense = false }: { items: ScatterItem[]; stickers?: string[]; dense?: boolean }) {
  // dense: the caller already orders the photos slot by slot (home); otherwise pick slots by how many photos there are
  const slots = dense ? items.map((_, i) => i) : SLOTS[Math.min(items.length, 6)]
  return (
    <div className={s.scatter}>
      {items.slice(0, 6).map((x, i) => (
        <figure key={x.src + i} className={`${s.paper} ${s[`scrap${slots[i]}`]} ${x.kind === 'face' ? s.face : ''}`}>
          <div className={s.paperCut} style={{ clipPath: tornPolygon(i * 37 + 11) }}>
            <div className={s.paperImg}>
              <Image
                src={x.src}
                alt={x.alt}
                fill
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                sizes="(max-width: 900px) 40vw, 18vw"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        </figure>
      ))}
      {stickers.map((t, i) => (
        <span key={t} className={`${s.sticker} ${s[`sticker${i}`]}`} aria-hidden="true">{t}</span>
      ))}
      <svg className={s.burst} viewBox="0 0 100 100" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="47" y="4" width="6" height="34" rx="3" transform={`rotate(${i * 30} 50 50)`} />
        ))}
      </svg>
      <svg className={s.plane} viewBox="0 0 64 48" aria-hidden="true">
        <path d="M2 22 62 2 44 46 30 30z" fill="#fff" />
        <path d="M30 30 62 2 24 26z" fill="#C9D3FF" />
      </svg>
    </div>
  )
}
