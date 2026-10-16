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
  // Track which desktop dropdown is open (by label)
  const [expandedLabel, setExpandedLabel] = useState<string | null>(null)

  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    hamburgerRef.current?.focus()
  }, [])

  // Escape closes mobile menu
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen, closeMenu])

  // Focus trap inside mobile menu
  useEffect(() => {
    if (!menuOpen || !menuRef.current) return
    const panel = menuRef.current
    const getFocusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )

    // Move focus to first item when menu opens
    const focusable = getFocusable()
    focusable[0]?.focus()

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

  // Close desktop dropdowns on Escape
  useEffect(() => {
    if (!expandedLabel) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedLabel(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [expandedLabel])

  // First child href for parent nav items that have href="#"
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
          z-index: 100;
          background: var(--navy-900);
          border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 3.5rem;
        }
        .nav-desktop { display: flex; align-items: center; list-style: none; gap: 0; }
        .nav-cta-wrap { display: flex; align-items: center; gap: 0.75rem; }
        .ham-btn { display: none; background: none; border: none; cursor: pointer; color: var(--white); padding: 0.5rem; }
        @media (max-width: 767px) {
          .nav-desktop { display: none; }
          .nav-cta-wrap { display: none; }
          .ham-btn { display: block; }
        }
        .nav-item { position: relative; }
        .nav-item-btn, .nav-item-link {
          display: block;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(255,255,255,.8);
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--fb);
          transition: color 140ms cubic-bezier(0.23, 1, 0.32, 1);
          white-space: nowrap;
        }
        .nav-item-btn:hover, .nav-item-link:hover { color: var(--white); }
        .nav-drop {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          background: var(--navy-800);
          min-width: 200px;
          list-style: none;
          border-top: 2px solid var(--yellow);
          padding-block: 0.5rem;
          z-index: 10;
        }
        .nav-item:hover .nav-drop,
        .nav-item:focus-within .nav-drop { display: block; }
        .nav-drop[data-open="true"] { display: block; }
        .nav-drop-link {
          display: block;
          padding: 0.5rem 1rem;
          font-size: 0.8125rem;
          color: rgba(255,255,255,.75);
          transition: color 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms cubic-bezier(0.23, 1, 0.32, 1);
          white-space: nowrap;
        }
        .nav-drop-link:hover { color: var(--white); background: rgba(255,255,255,.05); }
      `}</style>

      <header className="site-header" role="banner">
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
                <li
                  key={item.label}
                  className="nav-item"
                  onMouseLeave={() => setExpandedLabel(null)}
                >
                  {item.children ? (
                    <>
                      <button
                        className="nav-item-btn"
                        aria-haspopup="true"
                        aria-expanded={expandedLabel === item.label}
                        onMouseEnter={() => setExpandedLabel(item.label)}
                        onFocus={() => setExpandedLabel(item.label)}
                        onClick={() =>
                          setExpandedLabel((v) => (v === item.label ? null : item.label))
                        }
                      >
                        {item.label}
                      </button>
                      <ul
                        className="nav-drop"
                        role="list"
                        data-open={expandedLabel === item.label ? 'true' : undefined}
                      >
                        {item.children.map((child) => (
                          <li key={child.label}>
                            <Link
                              href={child.href.replace('https://thegyn.org', '') || '/'}
                              className="nav-drop-link"
                              onClick={() => setExpandedLabel(null)}
                            >
                              {/* Strip flag emoji per taste rule 10 */}
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
              <Link href="/sism-forum-access" className="btn btn-y">
                Book Forum Access, $199
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              ref={hamburgerRef}
              className="ham-btn"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden="true">
                {menuOpen ? (
                  <>
                    <line x1="1" y1="1" x2="21" y2="17" stroke="currentColor" strokeWidth="2" />
                    <line x1="21" y1="1" x2="1" y2="17" stroke="currentColor" strokeWidth="2" />
                  </>
                ) : (
                  <>
                    <rect width="22" height="2" fill="currentColor" />
                    <rect y="8" width="22" height="2" fill="currentColor" />
                    <rect y="16" width="22" height="2" fill="currentColor" />
                  </>
                )}
              </svg>
            </button>
          </nav>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div
            id="mobile-menu"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            style={{
              position: 'fixed',
              insetBlockStart: '3.5rem',
              insetInline: 0,
              background: 'var(--navy-800)',
              zIndex: 99,
              padding: '1.25rem var(--gut) 2rem',
              borderTop: '2px solid var(--yellow)',
            }}
          >
            <ul style={{ listStyle: 'none' }}>
              {nav.map((item) => (
                <li key={item.label}>
                  {/* Items with href="#": link to the primary destination (first child) instead */}
                  <Link
                    href={primaryHref(item)}
                    onClick={closeMenu}
                    style={{
                      display: 'block',
                      padding: '0.75rem 0',
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,.85)',
                      borderBottom: '1px solid rgba(255,255,255,.08)',
                    }}
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <ul style={{ listStyle: 'none', paddingLeft: '1rem' }}>
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            href={child.href.replace('https://thegyn.org', '')}
                            onClick={closeMenu}
                            style={{
                              display: 'block',
                              padding: '0.5rem 0',
                              fontSize: '0.9rem',
                              color: 'rgba(255,255,255,.65)',
                              borderBottom: '1px solid rgba(255,255,255,.05)',
                            }}
                          >
                            {child.label.replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu, '').trim()}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '1.25rem' }}>
              <Link href="/sism-forum-access" className="btn btn-y" onClick={closeMenu}>
                Book Forum Access, $199
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
