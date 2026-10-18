import type { Metadata } from 'next'
import { ContactForm } from '@/features/contact/ui/ContactForm'
import { PageHero } from '@/components/PageHero'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the Global Youth Network. Email contact@thegyn.org, WhatsApp, or send us a message using the form.',
  openGraph: {
    title: 'Contact Us – Global Youth Network',
    description:
      'Email contact@thegyn.org or fill in our contact form for general enquiries, partnerships, group bookings and media requests.',
  },
}

const VALID_TOPICS = ['general', 'partnership', 'group-booking', 'media'] as const
type Topic = typeof VALID_TOPICS[number]

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ContactUsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const topicParam = params.topic
  const topic: Topic =
    typeof topicParam === 'string' && (VALID_TOPICS as readonly string[]).includes(topicParam)
      ? (topicParam as Topic)
      : 'general'

  return (
    <main id="main">
      <PageHero
        kicker="Write to us"
        title="Get in *touch*"
        lead="Have a question, a partnership idea, or want to book for a group? We would love to hear from you."
      />

      {/* Contact details + form */}
      <section
        aria-labelledby="contact-details-hd"
        data-name="Write to us"
        style={{ background: 'var(--field)', paddingBlock: 'var(--sp)' }}
      >
        <div className={`wrap ${styles.contactGrid}`}>
          {/* Contact methods as SDG-colour tiles */}
          <aside aria-label="Contact details">
            <h2
              id="contact-details-hd"
              className="d3"
              style={{ color: 'var(--ink)', marginBottom: '1.5rem' }}
            >
              Contact details
            </h2>

            <div className={styles.tileStack}>
              {/* SDG4 red — email */}
              <div className="tile" style={{ background: '#C5192D' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                  Email
                </p>
                <a
                  href="mailto:contact@thegyn.org"
                  style={{ color: '#fff', fontWeight: 600, fontSize: '0.9375rem' }}
                >
                  contact@thegyn.org
                </a>
              </div>

              {/* SDG16 dark blue — phone/WhatsApp */}
              <div className="tile" style={{ background: '#00689D' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                  Phone / WhatsApp
                </p>
                <a
                  href="https://wa.me/message/HGC6MW4HT5YJC1"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#fff', fontWeight: 600, fontSize: '0.9375rem' }}
                >
                  +1 (302) 556-0064
                </a>
              </div>

              {/* SDG8 dark crimson — address */}
              <div className="tile" style={{ background: '#A21942' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                  Address
                </p>
                <address
                  style={{
                    fontStyle: 'normal',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    lineHeight: 1.5,
                  }}
                >
                  1001 S Main St STE 500<br />
                  Kalispell, Montana 59901<br />
                  United States
                </address>
              </div>

              {/* SDG17 midnight navy — social links */}
              <div className="tile" style={{ background: '#19486A' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                  Follow us
                </p>
                <ul
                  aria-label="GYN social media links"
                  style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}
                >
                  <li>
                    <a
                      href="https://www.facebook.com/thegyn.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.875rem', color: '#fff' }}
                    >
                      Facebook
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.instagram.com/gyn_global"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.875rem', color: '#fff' }}
                    >
                      Instagram
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.youtube.com/@globalyouthnetwork/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.875rem', color: '#fff' }}
                    >
                      YouTube
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.linkedin.com/company/thegyn"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.875rem', color: '#fff' }}
                    >
                      LinkedIn
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Contact form in a white rounded card */}
          <div
            className="card"
            style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}
          >
            <h2
              id="form-hd"
              className="d3"
              style={{ color: 'var(--ink)', marginBottom: '1.5rem' }}
            >
              Send a message
            </h2>
            <section aria-labelledby="form-hd">
              <ContactForm defaultTopic={topic} />
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}
