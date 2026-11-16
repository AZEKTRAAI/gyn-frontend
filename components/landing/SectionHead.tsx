import Link from 'next/link'
import { Accent } from './Accent'
import s from './landing.module.css'

/** The one way every home section opens: small label, heading, optional intro, all centred. */
export function SectionHead({ id, kicker, heading, intro, link }: { id: string; kicker: string; heading: string; intro?: string; link?: { label: string; href: string } }) {
  return (
    <header className={s.head}>
      {kicker && <p className={s.kicker}>{kicker}</p>}
      <h2 id={id} className={s.h2}><Accent text={heading} /></h2>
      {intro && (
        <p className={s.headIntro}>
          {intro}
          {link?.label && (
            <>
              {' '}
              <Link href={link.href} className={s.inlineLink}>{link.label} <span aria-hidden="true">&rarr;</span></Link>
            </>
          )}
        </p>
      )}
    </header>
  )
}
