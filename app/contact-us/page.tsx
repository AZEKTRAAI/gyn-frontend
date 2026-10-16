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
        title="Get in *touch*"
        lead="Have a question, a partnership idea, or want to book for a group? We would love to hear from you."
      />

      {/* Contact details + form */}
      <section
        aria-labelledby="contact-form-hd"
        style={{ background: 'var(--white)', paddingBlock: 'var(--sp)' }}
      >
        <div className={`wrap ${styles.contactGrid}`}>
          {/* Contact details */}
          <aside aria-label="Contact details">
            <h2
              id="contact-form-hd"
              className="d3"
              style={{ color: 'var(--ink)', marginBottom: '2rem' }}
            >
              Contact details
            </h2>

            <dl style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <dt
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--n-500)',
                    textTransform: 'uppercase', /* 1 of 3 */
                    letterSpacing: '0.08em',
                    marginBottom: '0.25rem',
                  }}
                >
                  Email
                </dt>
                <dd>
                  <a
                    href="mailto:contact@thegyn.org"
                    style={{
                      fontSize: '0.9375rem',
                      color: 'var(--navy)',
                      fontWeight: 600,
                    }}
                  >
                    contact@thegyn.org
                  </a>
                </dd>
              </div>

              <div>
                <dt
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--n-500)',
                    textTransform: 'uppercase', /* 2 of 3 */
                    letterSpacing: '0.08em',
                    marginBottom: '0.25rem',
                  }}
                >
                  Phone / WhatsApp
                </dt>
                <dd>
                  <a
                    href="https://wa.me/message/HGC6MW4HT5YJC1"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.9375rem',
                      color: 'var(--navy)',
                      fontWeight: 600,
                    }}
                  >
                    +1 (302) 556-0064
                  </a>
                </dd>
              </div>

              <div>
                <dt
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--n-500)',
                    textTransform: 'uppercase', /* 3 of 3 */
                    letterSpacing: '0.08em',
                    marginBottom: '0.25rem',
                  }}
                >
                  Address
                </dt>
                <dd>
                  <address
                    style={{
                      fontSize: '0.9375rem',
                      color: 'var(--n-700)',
                      fontStyle: 'normal',
                      lineHeight: 1.6,
                    }}
                  >
                    1001 S Main St STE 500<br />
                    Kalispell, Montana 59901<br />
                    United States
                  </address>
                </dd>
              </div>

              <div>
                <dt
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--n-500)',
                    letterSpacing: '0.08em',
                    marginBottom: '0.5rem',
                  }}
                >
                  Follow us
                </dt>
                <dd>
                  <ul
                    aria-label="GYN social media links"
                    style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                  >
                    <li>
                      <a
                        href="https://www.facebook.com/thegyn.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.875rem', color: 'var(--navy)' }}
                      >
                        Facebook
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://www.instagram.com/gyn_global"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.875rem', color: 'var(--navy)' }}
                      >
                        Instagram
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://www.youtube.com/@globalyouthnetwork/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.875rem', color: 'var(--navy)' }}
                      >
                        YouTube
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://www.linkedin.com/company/thegyn"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.875rem', color: 'var(--navy)' }}
                      >
                        LinkedIn
                      </a>
                    </li>
                  </ul>
                </dd>
              </div>
            </dl>
          </aside>

          {/* Contact form (client component) */}
          <section aria-labelledby="form-hd">
            <h2
              id="form-hd"
              className="d3"
              style={{ color: 'var(--ink)', marginBottom: '1.5rem' }}
            >
              Send a message
            </h2>
            <ContactForm defaultTopic={topic} />
          </section>
        </div>
      </section>
    </main>
  )
}
