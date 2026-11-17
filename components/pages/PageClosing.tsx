import type { ReactNode } from 'react'
import { Accent } from '@/components/landing/Accent'
import s from './pages.module.css'

/** The royal call-to-action panel that ends a page, like the home closing. `children` are the buttons. */
export function PageClosing({ id, name, heading, text, children }: { id: string; name: string; heading: string; text?: string; children: ReactNode }) {
  return (
    <section id={id} className={s.closingWrap} data-name={name} aria-labelledby={`${id}-h2`}>
      <div className="wrap">
        <div className={s.closing}>
          <h2 id={`${id}-h2`} className={s.closingH}><Accent text={heading} dark /></h2>
          {text && <p className={s.closingText}>{text}</p>}
          <div className={s.actions}>{children}</div>
        </div>
      </div>
    </section>
  )
}
