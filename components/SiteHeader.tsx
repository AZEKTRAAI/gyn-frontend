// Direction I header
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import type { NavItem } from '@/lib/cms/types'

interface Props {
  nav: NavItem[]
}

export function SiteHeader({ nav }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    hamburgerRef.current?.focus()
  }, [])

  // Scroll: show solid field background once past 40px
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
      // Focus first link in drawer
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

  return (
    <>
      <style>{`
        .site-header {
          position: fixed;
          inset-block-start: 0;
          inset-inline: 0;
          z-index: 1000;
          /* always solid: inner pages have dark photo heroes the dark nav text would vanish on */
          background: #EEF2F6;
          transition: background 240ms cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 240ms cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .site-header[data-scrolled] {
          background: rgba(238,242,246,.96);
          box-shadow: 0 1px 0 rgba(14,21,48,.08);
        }
        .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 3.5rem;
        }
        .nav-desktop { display: flex; align-items: center; list-style: none; gap: 0; }
        .nav-cta-wrap { display: flex; align-items: center; gap: 0.75rem; }
        .ham-btn { display: none; background: none; border: none; cursor: pointer; color: var(--ink, #0E1530); padding: 0.5rem; flex-direction: column; gap: 5px; min-width: 44px; min-height: 44px; align-items: center; justify-content: center; }
        @media (max-width: 1023px) {
          .nav-desktop { display: none; }
          .nav-cta-wrap { display: none; }
          .ham-btn { display: flex; }
        }
        .nav-item { position: relative; }
        .nav-item-btn, .nav-item-link {
          display: block;
          padding: 0.5rem 0.75rem;
          font-size: 0.9375rem;
          font-weight: 500;
          color: rgba(14,21,48,.72);
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-host-grotesk, var(--fb));
          transition: color 150ms;
          white-space: nowrap;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
        }
        .nav-item-btn:hover, .nav-item-link:hover { color: #0E1530; }
        .nav-item-btn:focus-visible, .nav-item-link:focus-visible { outline: 2px solid #FCC30B; outline-offset: 4px; border-radius: 2px; }
        .nav-drop {
          display: none;
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          background: rgba(238,242,246,.98);
          min-width: 200px;
          list-style: none;
          border: 1px solid rgba(14,21,48,.1);
          padding-block: 0.5rem;
          z-index: 10;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(14,21,48,.08);
        }
        .nav-item:hover .nav-drop,
        .nav-item:focus-within .nav-drop { display: block; }
        .nav-drop[data-open="true"] { display: block; }
        .nav-drop-link {
          display: block;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          color: rgba(14,21,48,.72);
          transition: color 140ms, background-color 140ms;
          white-space: nowrap;
        }
        .nav-drop-link:hover { color: #0E1530; background: rgba(14,21,48,.04); }
        .nav-book-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FCC30B;
          color: #0E1530;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.625rem 1.25rem;
          border-radius: 999px;
          transition: transform 160ms cubic-bezier(0.23,1,0.32,1);
          font-family: var(--font-host-grotesk, var(--fb));
          min-height: 44px;
        }
        .nav-book-pill:hover { transform: scale(1.02); }
        .nav-book-pill:active { transform: scale(0.97); }
        .nav-book-pill:focus-visible { outline: 2px solid #0E1530; outline-offset: 2px; }
        /* Mobile: compact price-only pill beside logo */
        .nav-m-book {
          display: none;
          background: #FCC30B;
          color: #0E1530;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          min-height: 44px;
          align-items: center;
        }
        @media (max-width: 1023px) {
          .nav-m-book { display: inline-flex; }
        }

        /* Mobile drawer — full screen, field bg */
        .nav-drawer {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: #EEF2F6;
          padding: 76px 24px 40px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          /* hidden by default; toggled via menuOpen */
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
          color: #0E1530;
          padding: 14px 0;
          border-bottom: 1px solid rgba(14,21,48,.1);
          display: block;
          font-family: var(--font-host-grotesk, var(--fb));
          min-height: 44px;
        }
        .nav-drawer a:focus-visible { outline: 2px solid #FCC30B; outline-offset: 4px; }
        .drawer-book {
          margin-top: 24px;
          display: inline-block;
          background: #FCC30B;
          color: #0E1530;
          font-size: 1rem;
          font-weight: 600;
          padding: 14px 28px;
          border-radius: 999px;
          text-align: center;
          border-bottom: none !important;
        }
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
            <Link href="/" aria-label="Global Youth Network home">
              <Image
                className="logo-chip"
                src="/media/logos/gyn-logo.png"
                alt="Global Youth Network"
                width={120}
                height={36}
                priority
                style={{ height: '2.25rem', width: 'auto' }}
              />
            </Link>

            {/* Desktop nav */}
            <ul className="nav-desktop" role="list">
              {nav.map((item) => (
                <li key={item.label} className="nav-item">
                  {item.children ? (
                    <>
                      <button
                        className="nav-item-btn"
                        aria-haspopup="true"
                        aria-expanded={false}
                      >
                        {item.label}
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
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            <div className="nav-cta-wrap">
              <Link href="/sism-forum-access" className="nav-book-pill">
                Book Forum Access, $199
              </Link>
            </div>

            {/* Mobile: compact pill + hamburger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
          </Link>
        </div>
      </header>
    </>
  )
}
