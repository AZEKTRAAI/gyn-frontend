'use client'

/**
 * PolicyLayout — long-form readable layout for policy pages.
 * 65–75ch measure, sticky table of contents on desktop (from H2s),
 * "Last updated" line, and consistent typography.
 */

import { useEffect, useState } from 'react'
import { PageHero } from '@/components/PageHero'
import type { TocEntry } from '@/lib/md-render'

interface Props {
  title: string
  /** Small label above the hero headline, e.g. "Legal". Defaults to "Legal". */
  kicker?: string
  toc: TocEntry[]
  lastUpdated: string | null
  children: React.ReactNode
}

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
      <PageHero
        title={title}
        kicker={kicker}
        chips={lastUpdated ? [lastUpdated] : undefined}
      />

      {/* Content area — field background, article in a white card */}
      <div style={{ background: 'var(--field)', paddingBlock: 'var(--sp)' }}>
        <div
          className={`wrap pol-grid${toc.length ? ' pol-grid-toc' : ''}`}
          style={{ alignItems: 'start' }}
        >
          {/* Body in a white rounded card */}
          <article className="card policy-body">
            {children}
          </article>

          {/* Sticky TOC card — desktop only */}
          {toc.length > 0 && (
            <nav
              aria-label="Table of contents"
              className="card policy-toc"
              style={{
                position: 'sticky',
                top: 'calc(3.5rem + 1.5rem)',
                padding: '1.25rem 1.5rem',
                display: 'none', // hidden on mobile, shown via media query below
              }}
            >
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--n-500)',
                  marginBottom: '0.875rem',
                }}
              >
                On this page
              </p>
              <ul style={{ listStyle: 'none' }}>
                {toc.map(({ id, text }) => (
                  <li key={id} style={{ marginBottom: '0.25rem' }}>
                    <a
                      href={`#${id}`}
                      style={{
                        fontSize: '0.8125rem',
                        lineHeight: 1.5,
                        color: activeId === id ? 'var(--navy)' : 'var(--n-600)',
                        fontWeight: activeId === id ? 600 : 400,
                        display: 'block',
                        padding: '0.25rem 0',
                        borderLeft: `2px solid ${activeId === id ? 'var(--navy)' : 'transparent'}`,
                        paddingLeft: '0.75rem',
                        transition: 'color 150ms ease, border-color 150ms ease',
                      }}
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>

      <style>{`
        .pol-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(2rem, 4vw, 4rem);
        }
        @media (min-width: 900px) {
          .pol-grid-toc { grid-template-columns: 1fr 260px; }
          .policy-toc { display: block !important; }
        }
        .policy-body { padding: clamp(1.5rem, 4vw, 2.5rem); max-width: 65ch; }
        .policy-body h1 { font-family: var(--fd); font-size: clamp(1.4rem, 3vw, 2rem); color: var(--ink); margin-top: 2.5rem; margin-bottom: 1rem; line-height: 1.15; }
        .policy-body h2 { font-family: var(--fd); font-size: clamp(1.1rem, 2vw, 1.5rem); color: var(--ink); margin-top: 2.5rem; margin-bottom: 0.875rem; scroll-margin-top: calc(3.5rem + 1.5rem); }
        .policy-body h3, .policy-body h4 { font-family: var(--fd); font-size: 1rem; color: var(--navy); margin-top: 2rem; margin-bottom: 0.625rem; scroll-margin-top: calc(3.5rem + 1.5rem); }
        .policy-body h5, .policy-body h6 { font-size: 0.9375rem; font-weight: 700; color: var(--n-700); margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .policy-body p { font-size: 1rem; color: var(--n-700); line-height: 1.75; margin-bottom: 1rem; }
        .policy-body ul, .policy-body ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        .policy-body li { font-size: 1rem; color: var(--n-700); line-height: 1.7; margin-bottom: 0.375rem; }
        .policy-body strong { font-weight: 700; color: var(--n-800); }
        .policy-body a { color: var(--navy); text-decoration: underline; text-underline-offset: 2px; }
        .policy-body a:hover { color: var(--navy-500); }
        .policy-body table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.9375rem; }
        .policy-body th { background: var(--ink); color: var(--white); padding: 0.625rem 0.875rem; text-align: left; font-weight: 600; }
        .policy-body th strong { color: inherit; }
        .policy-body td { padding: 0.5rem 0.875rem; border-bottom: 1px solid var(--n-200); color: var(--n-700); vertical-align: top; }
        .policy-body tr:nth-child(even) td { background: var(--n-50); }
      `}</style>
    </main>
  )
}
