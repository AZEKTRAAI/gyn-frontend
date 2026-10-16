'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { FooterSection, SocialLink } from '@/lib/cms/types'

interface Props {
  footer: FooterSection[]
  socials: SocialLink[]
}

export function SiteFooter({ footer, socials }: Props) {
  const footerSocials = socials.filter((s) => s.where.includes('footer'))
  const usefulLinks = footer.find((s) => s.heading === 'Useful Links')
  const policies = footer.find((s) => s.heading === 'Policies')
  const contact = footer.find((s) => s.heading === 'Contact Info')
  const copyright = footer.find((s) => s.type === 'copyright')

  return (
    <footer
      style={{ background: 'var(--navy-900)', paddingBlock: '3rem' }}
      role="contentinfo"
    >
      <div className="wrap">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '2rem',
          }}
        >
          {/* About column */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <Image
                className="logo-chip"
                src="/media/logos/gyn-logo.png"
                alt="Global Youth Network"
                width={120}
                height={36}
                style={{ height: '2rem', width: 'auto' }}
              />
            </div>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'rgba(255,255,255,.5)',
                lineHeight: 1.65,
                marginBottom: '1.25rem',
                maxWidth: '30ch',
              }}
            >
              The Global Youth Network is a U.S. based organization that hosts international
              Conferences to support the United Nations Sustainable Development Goals (SDGs).
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {footerSocials.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.8125rem',
                    color: 'rgba(255,255,255,.5)',
                    transition: 'color 140ms ease',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--yellow)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,.5)')}
                >
                  {s.label}
                </a>
              ))}
              {/* WhatsApp floating button is separate; link still in footer */}
            </div>
          </div>

          {/* Useful links */}
          <div>
            <p
              style={{
                fontFamily: 'var(--fd)',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,.7)',
                marginBottom: '1rem',
              }}
            >
              Useful Links
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {usefulLinks?.links?.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href.replace('https://thegyn.org', '') || '/'}
                    style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,.55)', transition: 'color 140ms ease' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              {/* D43: Videos page added to nav */}
              <li>
                <Link href="/videos" style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,.55)', transition: 'color 140ms ease' }}>
                  Videos
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <p
              style={{
                fontFamily: 'var(--fd)',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,.7)',
                marginBottom: '1rem',
              }}
            >
              Policies
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {policies?.links?.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href.replace('https://thegyn.org', '')}
                    style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,.55)', transition: 'color 140ms ease' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p
              style={{
                fontFamily: 'var(--fd)',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,.7)',
                marginBottom: '1rem',
              }}
            >
              Contact Info
            </p>
            <address
              style={{
                fontStyle: 'normal',
                fontSize: '0.8125rem',
                color: 'rgba(255,255,255,.55)',
                lineHeight: 1.85,
              }}
            >
              {contact?.items?.map((item) => (
                <p key={item.label}>
                  {item.href ? (
                    <a href={item.href} style={{ color: 'var(--yellow)' }}>
                      {item.label}
                    </a>
                  ) : (
                    item.label
                  )}
                </p>
              ))}
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,.08)',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,.6)',
          }}
        >
          {copyright?.text}
        </div>
      </div>

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/message/HGC6MW4HT5YJC1"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp us"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 50,
          background: '#25D366',
          color: '#fff',
          borderRadius: '50%',
          width: '3.25rem',
          height: '3.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,.25)',
        }}
      >
        {/* WhatsApp SVG icon — no emoji */}
        <svg width="24" height="24" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
          <path d="M16 3C8.82 3 3 8.82 3 16c0 2.3.6 4.47 1.64 6.36L3 29l6.82-1.6A13 13 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.5a10.46 10.46 0 0 1-5.34-1.46l-.38-.23-3.96.93.95-3.86-.25-.4A10.47 10.47 0 0 1 5.5 16C5.5 9.87 10.87 4.5 16 4.5S26.5 9.87 26.5 16 21.13 26.5 16 26.5zm5.77-7.77c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.95 1.18-.17.2-.35.22-.65.07a8.2 8.2 0 0 1-2.41-1.49 9.1 9.1 0 0 1-1.67-2.08c-.17-.3 0-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46s1.05 2.85 1.2 3.05c.15.2 2.07 3.16 5.01 4.43.7.3 1.25.48 1.67.62.7.22 1.34.19 1.84.11.56-.08 1.73-.71 1.97-1.39.25-.68.25-1.27.18-1.39-.07-.12-.27-.2-.57-.34z" />
        </svg>
      </a>

      <style>{`
        @media (max-width: 768px) {
          footer .wrap > div:first-child {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          footer .wrap > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  )
}
