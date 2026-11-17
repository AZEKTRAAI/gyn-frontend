// Direction J header
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import type { NavItem } from '@/lib/cms/types'

interface Props {
  nav: NavItem[]
  /** Next upcoming event's forum-access fee and page; null hides the Book pill. */
  book: { fee: string; href: string } | null
}

export function SiteHeader({ nav, book }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openDrop, setOpenDrop] = useState<string | null>(null)
  const pathname = usePathname()

  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  /** Ref to the button that last opened a dropdown — for returning focus on Escape */
  const dropTriggerRef = useRef<HTMLButtonElement | null>(null)
  /** Was the currently-open dropdown opened by a click (vs. hover)? */
  const openedByClickRef = useRef(false)
  /** Labels where hover-reopen is suppressed after a click-close (until pointer leaves) */
  const suppressHoverRef = useRef(new Set<string>())
  /** Debounce timer for hover-leave close */
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    hamburgerRef.current?.focus()
  }, [])

  const clearHoverTimer = useCallback(() => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current)
      hoverCloseTimerRef.current = null
    }
  }, [])

  /** Mouse enters a dropdown nav-item — open unless suppressed after a click-close. */
  const onNavItemEnter = useCallback((e: React.PointerEvent, label: string) => {
    if (e.pointerType !== 'mouse') return
    clearHoverTimer()
    if (suppressHoverRef.current.has(label)) return
    // Only change openedBy if we're actually switching items
    setOpenDrop((prev) => {
      if (prev !== label) openedByClickRef.current = false
      return label
    })
  }, [clearHoverTimer])

  /** Mouse leaves a dropdown nav-item — schedule a close if hover-opened; clear suppression. */
  const onNavItemLeave = useCallback((e: React.PointerEvent, label: string) => {
    if (e.pointerType !== 'mouse') return
    // Pointer has left — next enter is a fresh hover, so clear suppression
    suppressHoverRef.current.delete(label)
    // Only auto-close if this item was hover-opened (not click-opened)
    if (openedByClickRef.current) return
    hoverCloseTimerRef.current = setTimeout(() => {
      hoverCloseTimerRef.current = null
      if (!openedByClickRef.current) {
        setOpenDrop((prev) => (prev === label ? null : prev))
      }
    }, 150)
  }, [])

  /** Click the dropdown trigger — toggle open/close; after click-close suppress hover-reopen. */
  const onTriggerClick = useCallback((e: React.MouseEvent, label: string) => {
    e.stopPropagation()
    clearHoverTimer()
    setOpenDrop((prev) => {
      if (prev === label) {
        // Close by click: suppress hover until pointer leaves the item
        openedByClickRef.current = false
        suppressHoverRef.current.add(label)
        return null
      }
      // Open by click
      openedByClickRef.current = true
      suppressHoverRef.current.delete(label)
      return label
    })
  }, [clearHoverTimer])

  // Cleanup hover timer on unmount
  useEffect(() => clearHoverTimer, [clearHoverTimer])

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

  // Close open dropdown on Escape or outside click
  useEffect(() => {
    if (!openDrop) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDrop(null)
        dropTriggerRef.current?.focus()
      }
    }
    const onClick = (e: MouseEvent) => {
      const header = document.querySelector<HTMLElement>('.site-header')
      if (!header?.contains(e.target as Node)) setOpenDrop(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick, { capture: true })
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick, { capture: true })
    }
  }, [openDrop])


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
        /* Floating glass capsule (docs/frontend-design-plan.md): centred, tightens on scroll. */
        .site-header {
          position: fixed;
          inset-block-start: 0;
          inset-inline: 0;
          z-index: 1000;
          padding-top: 12px;
          pointer-events: none;
        }
        .site-header > * { pointer-events: auto; }

        .nav-inner {
          /* above the open mobile menu (z-index 999), so the logo and the close button stay visible */
          position: relative;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          max-width: 1120px;
          margin-inline: auto;
          min-height: 60px;
          padding: 7px 7px 7px 18px;
          background: rgba(255,255,255,.58);
          -webkit-backdrop-filter: blur(22px) saturate(180%);
          backdrop-filter: blur(22px) saturate(180%);
          border: 1px solid rgba(255,255,255,.8);
          border-radius: 999px;
          box-shadow: 0 10px 30px -8px rgba(14,21,48,.18), 0 0 0 1px rgba(14,21,48,.04), inset 0 1px 0 rgba(255,255,255,.9);
          transition: max-width 420ms cubic-bezier(.2,.8,.2,1), min-height 300ms cubic-bezier(.2,.8,.2,1),
                      padding 300ms cubic-bezier(.2,.8,.2,1), background-color 300ms, box-shadow 300ms;
        }
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .nav-inner { background: rgba(255,255,255,.94); }
        }
        .site-header[data-scrolled] .nav-inner {
          max-width: 1000px;
          min-height: 54px;
          padding: 5px 5px 5px 16px;
          background: rgba(255,255,255,.72);
          box-shadow: 0 18px 40px -12px rgba(14,21,48,.28), 0 0 0 1px rgba(14,21,48,.05), inset 0 1px 0 rgba(255,255,255,.9);
        }
        .nav-logo { flex-shrink: 0; display: flex; align-items: center; border-radius: 10px; }

        /* links sit in an inset track; hover and the current page get a white segmented pill */
        .nav-desktop {
          display: flex;
          align-items: center;
          list-style: none;
          gap: 2px;
          padding: 4px;
          border-radius: 999px;
          background: rgba(14,21,48,.045);
          box-shadow: inset 0 1px 2px rgba(14,21,48,.06);
        }
        .nav-cta-wrap { display: flex; align-items: center; }
        .ham-btn {
          display: none;
          background: rgba(14,21,48,.05);
          border: none;
          border-radius: 999px;
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

        .nav-item { position: relative; }
        .nav-item-btn,
        .nav-item-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0 0.95rem;
          font-size: 0.9rem;
          font-weight: 500;
          letter-spacing: -0.005em;
          color: rgba(14,21,48,.7);
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--fb);
          border-radius: 999px;
          white-space: nowrap;
          min-height: 40px;
          transition: color 160ms, background-color 160ms, box-shadow 160ms;
        }
        .nav-item-btn:hover,
        .nav-item-link:hover,
        .nav-item-btn[aria-expanded="true"] {
          color: var(--ink, #0E1530);
          background: rgba(255,255,255,.85);
          box-shadow: 0 1px 2px rgba(14,21,48,.08), 0 4px 12px -4px rgba(14,21,48,.12);
        }
        .nav-item-btn:focus-visible,
        .nav-item-link:focus-visible {
          outline: 2px solid var(--brand);
          outline-offset: 2px;
        }
        .nav-item-link[aria-current="page"],
        .nav-item-btn[data-active="true"] {
          color: var(--brand);
          font-weight: 600;
          background: #fff;
          box-shadow: 0 1px 2px rgba(14,21,48,.08), 0 4px 12px -4px rgba(45,63,224,.25);
        }
        .nav-chev { transition: transform 200ms cubic-bezier(.2,.8,.2,1); opacity: .55; }
        .nav-item-btn[aria-expanded="true"] .nav-chev { transform: rotate(180deg); }

        /* dropdown: glass sheet that rises in */
        .nav-drop {
          visibility: hidden;
          opacity: 0;
          transform: translateY(-6px) scale(.98);
          transform-origin: top left;
          position: absolute;
          top: calc(100% + 12px);
          left: 0;
          min-width: 240px;
          list-style: none;
          padding: 6px;
          z-index: 10;
          border-radius: 20px;
          background: rgba(255,255,255,.8);
          -webkit-backdrop-filter: blur(22px) saturate(180%);
          backdrop-filter: blur(22px) saturate(180%);
          border: 1px solid rgba(255,255,255,.85);
          box-shadow: 0 24px 50px -12px rgba(14,21,48,.25), 0 0 0 1px rgba(14,21,48,.05);
          transition: opacity 180ms, transform 220ms cubic-bezier(.2,.8,.2,1), visibility 0s 220ms;
        }
        .nav-drop[data-open="true"] {
          visibility: visible;
          opacity: 1;
          transform: none;
          transition: opacity 180ms, transform 220ms cubic-bezier(.2,.8,.2,1), visibility 0s;
        }
        .nav-drop-link {
          display: block;
          padding: 0.7rem 0.9rem;
          font-size: 0.9rem;
          font-weight: 500;
          border-radius: 14px;
          color: rgba(14,21,48,.78);
          transition: color 120ms, background-color 120ms;
          white-space: nowrap;
        }
        .nav-drop-link:hover { color: var(--brand); background: rgba(45,63,224,.07); }
        .nav-drop-link:focus-visible { outline: 2px solid var(--brand); outline-offset: -2px; }

        /* CTA: lime pill with an ink arrow badge */
        .nav-book-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--action);
          color: #0E1530;
          font-size: 0.875rem;
          font-weight: 700;
          line-height: 1;
          padding: 5px 5px 5px 18px;
          border-radius: 999px;
          font-family: var(--fb);
          min-height: 46px;
          box-shadow: 0 6px 16px -6px rgba(140,180,10,.7), inset 0 1px 0 rgba(255,255,255,.5);
          transition: background-color 160ms, transform 160ms cubic-bezier(0.23,1,0.32,1);
          white-space: nowrap;
        }
        .nav-book-pill:hover { background: var(--action-dk); }
        .nav-book-pill:active { transform: scale(0.97); }
        .nav-book-pill:focus-visible { outline: 2px solid #0E1530; outline-offset: 2px; }
        .nav-book-icon {
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #0E1530;
          color: #fff;
          flex: none;
          transition: transform 200ms cubic-bezier(0.23,1,0.32,1);
        }
        .nav-book-pill:hover .nav-book-icon { transform: rotate(-45deg); }

        /* Mobile: compact "Book · price" pill beside the menu button */
        .nav-m-book {
          display: none;
          background: var(--action);
          color: #0E1530;
          font-size: 0.8125rem;
          font-weight: 700;
          line-height: 1;
          padding: 0.5rem 0.875rem;
          border-radius: 999px;
          min-height: 44px;
          white-space: nowrap;
          align-items: center;
          justify-content: center;
          transition: background-color 140ms;
        }
        .nav-m-book:hover { background: var(--action-dk); }
        .nav-m-book:focus-visible { outline: 2px solid #0E1530; outline-offset: 2px; }
        @media (max-width: 1023px) {
          .nav-m-book { display: inline-flex; }
        }

        /* Mobile menu: frosted full-screen sheet */
        .nav-drawer {
          position: fixed;
          inset: 0;
          z-index: 999;
          background:
            radial-gradient(30rem 24rem at 100% 0%, rgba(38,189,226,.22), transparent 70%),
            radial-gradient(26rem 22rem at 0% 100%, rgba(198,244,50,.22), transparent 70%),
            rgba(244,246,251,.86);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          backdrop-filter: blur(24px) saturate(160%);
          padding: 96px 28px 48px;
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow-y: auto;
          opacity: 0;
          pointer-events: none;
          transition: opacity 220ms;
        }
        .nav-drawer.open {
          opacity: 1;
          pointer-events: auto;
        }
        .nav-drawer a {
          font-family: var(--fd);
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--ink, #0E1530);
          padding: 14px 0;
          border-bottom: 1px solid rgba(14,21,48,.08);
          display: block;
          min-height: 52px;
          transition: color 120ms;
        }
        .nav-drawer a:hover, .nav-drawer a[aria-current="page"] { color: var(--brand); }
        .nav-drawer a:focus-visible { outline: 2px solid var(--brand); outline-offset: 4px; }
        /* grouped links (Past / Upcoming events): small label, then indented, slightly smaller children */
        .drawer-group { display: flex; flex-direction: column; }
        .drawer-group-label {
          padding: 18px 0 2px;
          font-family: var(--fb);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(14,21,48,.72);
        }
        .nav-drawer .drawer-child {
          font-size: 1.375rem;
          padding: 12px 0 12px 16px;
          min-height: 48px;
        }
        .drawer-book {
          margin-top: 28px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--action) !important;
          color: #0E1530 !important;
          font-family: var(--fb) !important;
          font-size: 1.0625rem !important;
          font-weight: 700 !important;
          letter-spacing: 0 !important;
          line-height: 1 !important;
          padding: 16px 32px !important;
          border-radius: 999px;
          text-align: center;
          border-bottom: none !important;
          min-height: 56px !important;
          transition: background-color 140ms !important;
        }
        .drawer-book:hover { background: var(--action-dk) !important; }

        .ham-bar {
          display: block;
          width: 18px;
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
        data-scrolled={scrolled ? '' : undefined}
      >
        <div className="wrap">
          {/* the transition name lives on the capsule, not the header: an element with a view-transition-name stops
              backdrop blur inside it from seeing the page, which would turn the glass (and the mobile menu) into plain tint */}
          <nav className="nav-inner" aria-label="Main navigation" style={{ viewTransitionName: 'site-header' }}>
            <Link href="/" aria-label="Global Youth Network home" className="nav-logo">
              <Image
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
                <li
                  key={item.label}
                  className="nav-item"
                  onPointerEnter={item.children ? (e) => onNavItemEnter(e, item.label) : undefined}
                  onPointerLeave={item.children ? (e) => onNavItemLeave(e, item.label) : undefined}
                >
                  {item.children ? (
                    <>
                      <button
                        ref={(el) => { if (openDrop === item.label) dropTriggerRef.current = el }}
                        className="nav-item-btn"
                        aria-haspopup="true"
                        aria-expanded={openDrop === item.label}
                        data-active={isDropdownActive(item) ? 'true' : undefined}
                        onClick={(e) => onTriggerClick(e, item.label)}
                      >
                        {item.label}
                        {/* chevron */}
                        <svg
                          aria-hidden="true"
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          className="nav-chev"
                        >
                          <path d="M2 4.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <ul
                        className="nav-drop"
                        role="list"
                        data-open={openDrop === item.label ? 'true' : undefined}
                      >
                        {item.children.map((child) => (
                          <li key={child.label}>
                            <Link
                              href={child.href.replace('https://thegyn.org', '') || '/'}
                              className="nav-drop-link"
                              onClick={() => setOpenDrop(null)}
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

            {book && <div className="nav-cta-wrap" style={{ flexShrink: 0 }}>
              <Link href={book.href} className="nav-book-pill">
                Book your seat &middot; {book.fee}
                <span className="nav-book-icon" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </Link>
            </div>}

            {/* Mobile: compact pill + hamburger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {book && (
                <Link href={book.href} className="nav-m-book" aria-label={`Book your seat, ${book.fee}`}>
                  Book &middot; {book.fee}
                </Link>
              )}
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
          {nav.map((item, i) =>
            item.children ? (
              // a group: small label, then every child as its own link (the label is not a link)
              <div key={item.label} role="group" aria-labelledby={`drawer-group-${i}`} className="drawer-group">
                <span id={`drawer-group-${i}`} className="drawer-group-label">{item.label}</span>
                {item.children.map((child) => (
                  <Link
                    key={child.label}
                    href={child.href.replace('https://thegyn.org', '') || '/'}
                    className="drawer-child"
                    onClick={closeMenu}
                    tabIndex={menuOpen ? 0 : -1}
                    aria-current={isActive(child.href) ? 'page' : undefined}
                  >
                    {child.label.replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu, '').trim()}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.label}
                href={primaryHref(item)}
                onClick={closeMenu}
                tabIndex={menuOpen ? 0 : -1}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ),
          )}
          {book && (
            <Link
              href={book.href}
              className="drawer-book"
              onClick={closeMenu}
              tabIndex={menuOpen ? 0 : -1}
            >
              Book your seat &middot; {book.fee}
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}
        </div>
      </header>
    </>
  )
}
