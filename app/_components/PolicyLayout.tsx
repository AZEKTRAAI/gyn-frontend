'use client'

/**
 * PolicyLayout: long-form readable layout for policy pages.
 * The royal page-top box, then a 70ch reading column with a sticky table of contents (from the H2s) on desktop.
 */

import { useEffect, useState } from 'react'
import { PageBox } from '@/components/pages/PageBox'
import type { TocEntry } from '@/lib/md-render'
import s from './PolicyLayout.module.css'

interface Props {
  title: string
  /** Small label above the headline, e.g. "Legal". Defaults to "Legal". */
  kicker?: string
  toc: TocEntry[]
  lastUpdated: string | null
  children: React.ReactNode
}

/** "Privacy Policy" becomes "Privacy *Policy*": the last word gets the lime highlight. */
const accentLast = (t: string) => t.replace(/(\S+)$/, '*$1*')

export function PolicyLayout({ title, kicker = 'Legal', toc, lastUpdated, children }: Props) {
  const [activeId, setActiveId] = useState<string>('')

  // Update active TOC item on scroll
  useEffect(() => {
    if (!toc.length) return
    const headings = toc
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    headings.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [toc])

  return (
    <main id="main">
      <PageBox id="policy-h1" kicker={kicker} title={accentLast(title)} facts={lastUpdated ? [`Last updated ${lastUpdated}`] : undefined} />

      <div className={s.page}>
        <div className={`wrap ${s.grid} ${toc.length ? s.gridToc : ''}`}>
          {toc.length > 0 && (
            <nav aria-label="Table of contents" className={s.toc}>
              <p className={s.tocLabel}>On this page</p>
              <ul>
                {toc.map(({ id, text }) => (
                  <li key={id}>
                    <a href={`#${id}`} aria-current={activeId === id ? 'true' : undefined}>{text}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <article className={s.body}>{children}</article>
        </div>
      </div>
    </main>
  )
}
