import Image from 'next/image'
import Link from 'next/link'
import type { FooterSection, SocialLink } from '@/lib/cms/types'
import s from './SiteFooter.module.css'

interface Props {
  footer: FooterSection[]
  socials: SocialLink[]
}

const WHATSAPP_PATH =
  'M16 3C8.82 3 3 8.82 3 16c0 2.3.6 4.47 1.64 6.36L3 29l6.82-1.6A13 13 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.5a10.46 10.46 0 0 1-5.34-1.46l-.38-.23-3.96.93.95-3.86-.25-.4A10.47 10.47 0 0 1 5.5 16C5.5 9.87 10.87 4.5 16 4.5S26.5 9.87 26.5 16 21.13 26.5 16 26.5zm5.77-7.77c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.95 1.18-.17.2-.35.22-.65.07a8.2 8.2 0 0 1-2.41-1.49 9.1 9.1 0 0 1-1.67-2.08c-.17-.3 0-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46s1.05 2.85 1.2 3.05c.15.2 2.07 3.16 5.01 4.43.7.3 1.25.48 1.67.62.7.22 1.34.19 1.84.11.56-.08 1.73-.71 1.97-1.39.25-.68.25-1.27.18-1.39-.07-.12-.27-.2-.57-.34z'

/** Simple outline icons for the social links; unknown networks fall back to their name. */
function SocialIcon({ label }: { label: string }) {
  const k = label.toLowerCase()
  if (k.includes('whatsapp')) return <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d={WHATSAPP_PATH} /></svg>
  if (k.includes('facebook'))
    return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5H16l.4-3H13.5V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4A20 20 0 0 0 14.3 4.3c-2.2 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z" /></svg>
  if (k.includes('instagram'))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    )
  if (k.includes('youtube'))
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z" />
      </svg>
    )
  return <span className={s.socialText}>{label.slice(0, 2)}</span>
}

const local = (href: string) => href.replace('https://thegyn.org', '') || '/'

export function SiteFooter({ footer, socials }: Props) {
  const footerSocials = socials.filter((x) => x.where.includes('footer'))
  const usefulLinks = footer.find((x) => x.heading === 'Useful Links')
  const policies = footer.find((x) => x.heading === 'Policies')
  const contact = footer.find((x) => x.heading === 'Contact Info')
  const copyright = footer.find((x) => x.type === 'copyright')

  return (
    <footer className={s.footer} role="contentinfo">
      <div className="wrap">
        <div className={s.sheet}>
          <div className={s.brand}>
            <span className={s.logoChip}>
              <Image src="/media/logos/gyn-logo.png" alt="Global Youth Network" width={140} height={42} style={{ height: '2rem', width: 'auto' }} />
            </span>
            <p className={s.about}>
              A US-based organisation that hosts international conferences on the United Nations Sustainable Development Goals.
            </p>
            <ul className={s.socials} aria-label="GYN on social media">
              {footerSocials.map((x) => (
                <li key={x.href}>
                  <a href={x.href} target="_blank" rel="noopener noreferrer" aria-label={x.label} className={s.social}>
                    <SocialIcon label={x.label} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav className={s.col} aria-labelledby="ft-links">
            <h2 id="ft-links" className={s.colHead}>Explore</h2>
            <ul>
              {usefulLinks?.links?.map((l) => (
                <li key={l.href}><Link href={local(l.href)} className={s.link}>{l.label}</Link></li>
              ))}
              <li><Link href="/videos" className={s.link}>Videos</Link></li>
            </ul>
          </nav>

          <nav className={s.col} aria-labelledby="ft-policies">
            <h2 id="ft-policies" className={s.colHead}>Policies</h2>
            <ul>
              {policies?.links?.map((l) => (
                <li key={l.href}><Link href={local(l.href)} className={s.link}>{l.label}</Link></li>
              ))}
            </ul>
          </nav>

          <div className={s.col}>
            <h2 className={s.colHead}>Contact</h2>
            <address className={s.contact}>
              {contact?.items?.map((item) =>
                item.href ? (
                  <a key={item.label} href={item.href} className={s.contactLink}>{item.label}</a>
                ) : (
                  <span key={item.label}>{item.label}</span>
                ),
              )}
            </address>
          </div>
        </div>

        <div className={s.bottom}>
          <span>{copyright?.text}</span>
          <a href="#main" className={s.top}>
            Back to top
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
              <path d="M8 13V3M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      {/* the signature: one giant gradient wordmark, decorative (the logo above carries the name) */}
      <p className={s.wordmark} aria-hidden="true">Global Youth Network</p>

      <a href="https://wa.me/message/HGC6MW4HT5YJC1" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp us" className={`wa-fab ${s.wa}`}>
        <svg width="24" height="24" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d={WHATSAPP_PATH} /></svg>
      </a>
    </footer>
  )
}
