import Link from 'next/link'
import type { EventPageContent } from '@gyn/core/event-schema'
import { Accent } from '@/components/landing/Accent'
import l from '@/components/landing/landing.module.css'

/** The closing royal panel, the same one that bookends the home page. */
export function Cta({ data }: { data: EventPageContent['cta'] }) {
  return (
    <section id="cta" className={l.closingWrap} data-name="Join" aria-labelledby="cta-h2">
      <div className="wrap">
        <div className={l.closing}>
          <h2 id="cta-h2" className={l.closingH}><Accent text={data.heading} dark /></h2>
          {data.text && <p className={l.closingText}>{data.text.replace(/\*/g, '')}</p>}
          <div className={l.ctas}>
            <Link href={data.primaryCta.href} className="btn btn-y">
              {data.primaryCta.label} <span aria-hidden="true">&rarr;</span>
            </Link>
            {data.secondaryCta.label && <Link href={data.secondaryCta.href} className="btn btn-ow">{data.secondaryCta.label}</Link>}
          </div>
        </div>
      </div>
    </section>
  )
}
