import Image from 'next/image'
import { tornPolygon } from '@/components/landing/torn'
import s from './pages.module.css'

/** A photo on white paper with ragged torn edges, as in the home hero. Position it with `className`; `seed` varies the tear. */
export function TornPhoto({ src, alt, seed, className = '', sizes = '(max-width: 900px) 50vw, 18vw', eager = false, caption }: {
  src: string
  alt: string
  seed: number
  className?: string
  sizes?: string
  eager?: boolean
  caption?: string
}) {
  return (
    <figure className={`${s.ph} ${className}`}>
      <div className={s.cut} style={{ clipPath: tornPolygon(seed) }}>
        <div className={s.img}>
          <Image src={src} alt={alt} fill loading={eager ? 'eager' : 'lazy'} sizes={sizes} style={{ objectFit: 'cover' }} />
        </div>
      </div>
      {caption && <figcaption className={s.caption}>{caption}</figcaption>}
    </figure>
  )
}
