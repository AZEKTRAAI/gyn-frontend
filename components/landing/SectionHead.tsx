import Link from 'next/link'
import { Accent } from './Accent'
import s from './landing.module.css'

/** The one way every home section opens: heading, optional intro (with an optional link at its end), all centred. */
export function SectionHead({ id, heading, intro, link }: { id: string; heading: string; intro?: string; link?: { label: string; href: string } }) {
  return (
    <header className={s.head}>
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
