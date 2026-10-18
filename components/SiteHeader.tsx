// Direction J header
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import type { NavItem } from '@/lib/cms/types'

interface Props {
  nav: NavItem[]
}

export function SiteHeader({ nav }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    hamburgerRef.current?.focus()
  }, [])

  // Scroll: compact pill once past 40px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Escape closes mobile drawer
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen, closeMenu])

  // Scroll lock + inert when drawer open
  useEffect(() => {
    const main = document.getElementById('main')
    const footer = document.querySelector('footer')
    const skip = document.querySelector<HTMLElement>('.sr-only')
    if (menuOpen) {
      document.documentElement.style.overflow = 'hidden'
      if (main) main.inert = true
      if (footer) footer.inert = true
      if (skip) skip.inert = true
      const first = drawerRef.current?.querySelector<HTMLElement>('a, button')
      first?.focus()
    } else {
      document.documentElement.style.overflow = ''
      if (main) main.inert = false
      if (footer) footer.inert = false
      if (skip) skip.inert = false
    }
  }, [menuOpen])

  // Focus trap inside drawer
  useEffect(() => {
    if (!menuOpen || !drawerRef.current) return
    const panel = drawerRef.current
    const getFocusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = getFocusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  function primaryHref(item: NavItem): string {
    if (item.href !== '#') return item.href.replace('https://thegyn.org', '') || '/'
    const first = item.children?.[0]?.href
    return first ? first.replace('https://thegyn.org', '') || '/' : '/'
  }

  /** Returns true if this nav item's path matches the current page */
  function isActive(href: string): boolean {
    const path = href.replace('https://thegyn.org', '') || '/'
    if (path === '/') return pathname === '/'
    return pathname === path || pathname.startsWith(path + '/')
  }

  /** Returns true if any child of a dropdown is active */
  function isDropdownActive(item: NavItem): boolean {
    return item.children?.some((c) => isActive(c.href)) ?? false
  }

  return (
    <>
      <style>{`
        /* navbar is one long floating pill; page shows through around it */
        .site-header {
          position: fixed;
          inset-block-start: 0;
          inset-inline: 0;
          z-index: 1000;
          padding-top: 10px;
          pointer-events: none;
        }
        .site-header > * { pointer-events: auto; }

        .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-height: 3.5rem;
          padding: 6px 8px 6px 16px;
          background: #fff;
          border-radius: 999px;
          box-shadow: 0 8px 24px rgba(14,21,48,.12), 0 1px 3px rgba(14,21,48,.08);
          transition: box-shadow 240ms cubic-bezier(0.25,0.46,0.45,0.94),
                      min-height 200ms cubic-bezier(0.25,0.46,0.45,0.94),
                      padding 200ms cubic-bezier(0.25,0.46,0.45,0.94);
        }
        /* scrolled: slightly tighter + stronger shadow */
        .site-header[data-scrolled] .nav-inner {
          box-shadow: 0 16px 48px rgba(14,21,48,.22), 0 2px 6px rgba(14,21,48,.1);
          min-height: 3.25rem;
          padding: 4px 6px 4px 14px;
        }

        .nav-desktop {
          display: flex;
          align-items: center;
          list-style: none;
          gap: 0;
          /* centred between logo and CTA */
          flex: 1;
          justify-content: center;
        }
        .nav-cta-wrap { display: flex; align-items: center; }
        .ham-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--ink, #0E1530);
          padding: 0.5rem;
          flex-direction: column;
          gap: 5px;
          min-width: 44px;
          min-height: 44px;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 1023px) {
          .nav-desktop { display: none; }
          .nav-cta-wrap { display: none; }
          .ham-btn { display: flex; }
        }

        /* nav items */
        .nav-item { position: relative; }
        .nav-item-btn,
        .nav-item-link {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 0.875rem;
          font-size: 0.9375rem;
          font-weight: 500;
          color: rgba(14,21,48,.72);
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--fb);
          border-radius: 999px;
          white-space: nowrap;
          min-height: 44px;
          position: relative;
          /* smooth hover pill */
          transition: color 140ms, background-color 140ms;
        }
        .nav-item-btn:hover,
        .nav-item-link:hover {
          color: var(--ink, #0E1530);
          background: rgba(14,21,48,.055);
        }
        .nav-item-btn:focus-visible,
        .nav-item-link:focus-visible {
          outline: 2px solid #FCC30B;
          outline-offset: 2px;
        }

        /* active link: navy colour + 2px underline below the text */
        .nav-item-link[aria-current="page"] {
          color: var(--navy, #202F60);
          font-weight: 600;
        }
        .nav-item-link[aria-current="page"]::after {
          content: '';
          position: absolute;
          bottom: 6px;
          left: 0.875rem;
          right: 0.875rem;
          height: 2px;
          background: var(--navy, #202F60);
          border-radius: 1px;
        }
        /* dropdown parent active */
        .nav-item-btn[data-active="true"] {
          color: var(--navy, #202F60);
          font-weight: 600;
        }

        /* dropdown */
        .nav-drop {
          display: none;
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          background: #fff;
          min-width: 210px;
          list-style: none;
          border: 1px solid rgba(14,21,48,.1);
          padding-block: 0.375rem;
          z-index: 10;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(14,21,48,.12);
        }
        .nav-item:hover .nav-drop,
        .nav-item:focus-within .nav-drop { display: block; }
        .nav-drop[data-open="true"] { display: block; }
        .nav-drop-link {
          display: block;
          padding: 0.5625rem 1rem;
          font-size: 0.875rem;
          color: rgba(14,21,48,.72);
          transition: color 120ms, background-color 120ms;
          white-space: nowrap;
        }
        .nav-drop-link:hover {
          color: var(--ink, #0E1530);
          background: rgba(14,21,48,.04);
        }
        .nav-drop-link:focus-visible {
          outline: 2px solid #FCC30B;
          outline-offset: -2px;
        }

        /* CTA pill */
        .nav-book-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #FCC30B;
          color: #0E1530;
          font-size: 0.875rem;
          font-weight: 700;
          padding: 0.625rem 1.125rem;
          border-radius: 999px;
          font-family: var(--fb);
          min-height: 44px;
          transition: background-color 140ms, transform 160ms cubic-bezier(0.23,1,0.32,1);
          white-space: nowrap;
        }
        .nav-book-pill:hover { background: #D6A200; }
        .nav-book-pill:active { transform: scale(0.97); }
        .nav-book-pill:focus-visible { outline: 2px solid #0E1530; outline-offset: 2px; }
        .nav-book-arrow {
          flex: none;
          transition: transform 160ms cubic-bezier(0.23,1,0.32,1);
        }
        .nav-book-pill:hover .nav-book-arrow { transform: translateX(2px); }

        /* Mobile: compact price-only pill beside logo */
        .nav-m-book {
          display: none;
          background: #FCC30B;
          color: #0E1530;
          font-size: 0.8125rem;
          font-weight: 700;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          min-height: 44px;
          align-items: center;
          transition: background-color 140ms;
        }
        .nav-m-book:hover { background: #D6A200; }
        .nav-m-book:focus-visible { outline: 2px solid #0E1530; outline-offset: 2px; }
        @media (max-width: 1023px) {
          .nav-m-book { display: inline-flex; }
        }

        /* Mobile drawer: full-screen, field bg */
        .nav-drawer {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: #EEF2F6;
          padding: 80px 28px 48px;
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow-y: auto;
          opacity: 0;
          pointer-events: none;
          transition: opacity 200ms;
        }
        .nav-drawer.open {
          opacity: 1;
          pointer-events: auto;
        }
        .nav-drawer a {
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--ink, #0E1530);
          padding: 15px 0;
          border-bottom: 1px solid rgba(14,21,48,.1);
          display: block;
          font-family: var(--fb);
          min-height: 52px;
          transition: color 120ms;
        }
        .nav-drawer a:hover { color: var(--navy, #202F60); }
        .nav-drawer a[aria-current="page"] {
          color: var(--navy, #202F60);
          font-weight: 600;
        }
        .nav-drawer a:focus-visible { outline: 2px solid #FCC30B; outline-offset: 4px; }
        .drawer-book {
          margin-top: 28px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #FCC30B !important;
          color: #0E1530 !important;
          font-size: 1.0625rem !important;
          font-weight: 700 !important;
          padding: 16px 32px !important;
          border-radius: 999px;
          text-align: center;
          border-bottom: none !important;
          min-height: 56px !important;
          transition: background-color 140ms !important;
        }
        .drawer-book:hover { background: #D6A200 !important; }

        /* hamburger bars */
        .ham-bar {
          display: block;
          width: 22px;
          height: 2px;
          background: #0E1530;
          border-radius: 2px;
          transition: transform 200ms, opacity 200ms;
        }
        .ham-btn[aria-expanded="true"] .ham-bar:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .ham-btn[aria-expanded="true"] .ham-bar:nth-child(2) { opacity: 0; }
        .ham-btn[aria-expanded="true"] .ham-bar:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
      `}</style>

      <header
        className="site-header"
        role="banner"
        style={{ viewTransitionName: 'site-header' }}
        data-scrolled={scrolled ? '' : undefined}
      >
        <div className="wrap">
          <nav className="nav-inner" aria-label="Main navigation">
            <Link href="/" aria-label="Global Youth Network home" style={{ flexShrink: 0 }}>
              <Image
                className="logo-chip"
                src="/media/logos/gyn-logo.png"
                alt="Global Youth Network"
                width={140}
                height={42}
                priority
                style={{ height: '2.375rem', width: 'auto' }}
              />
            </Link>

            {/* Desktop nav — centred between logo and CTA */}
            <ul className="nav-desktop" role="list">
              {nav.map((item) => (
                <li key={item.label} className="nav-item">
                  {item.children ? (
                    <>
                      <button
                        className="nav-item-btn"
                        aria-haspopup="true"
                        aria-expanded={false}
                        data-active={isDropdownActive(item) ? 'true' : undefined}
                      >
                        {item.label}
                        {/* chevron */}
                        <svg
                          aria-hidden="true"
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          style={{ marginLeft: '2px', opacity: 0.55 }}
                        >
                          <path d="M2 4.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <ul className="nav-drop" role="list">
                        {item.children.map((child) => (
                          <li key={child.label}>
                            <Link
                              href={child.href.replace('https://thegyn.org', '') || '/'}
                              className="nav-drop-link"
                            >
                              {child.label.replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu, '').trim()}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <Link
                      href={item.href.replace('https://thegyn.org', '') || '/'}
                      className="nav-item-link"
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            <div className="nav-cta-wrap" style={{ flexShrink: 0 }}>
              <Link href="/sism-forum-access" className="nav-book-pill">
                Book Forum Access, $199
                <svg
                  className="nav-book-arrow"
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

            {/* Mobile: compact pill + hamburger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Link href="/sism-forum-access" className="nav-m-book" aria-label="Book Forum Access, $199">
                $199
              </Link>
              <button
                ref={hamburgerRef}
                className="ham-btn"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="ham-bar" />
                <span className="ham-bar" />
                <span className="ham-bar" />
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile drawer */}
        <div
          id="mobile-menu"
          ref={drawerRef}
          className={`nav-drawer${menuOpen ? ' open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          aria-hidden={!menuOpen}
        >
          {nav.map((item) => (
            <Link
              key={item.label}
              href={primaryHref(item)}
              onClick={closeMenu}
              tabIndex={menuOpen ? 0 : -1}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/sism-forum-access"
            className="drawer-book"
            onClick={closeMenu}
            tabIndex={menuOpen ? 0 : -1}
          >
            Book Forum Access, $199
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </header>
    </>
  )
}
