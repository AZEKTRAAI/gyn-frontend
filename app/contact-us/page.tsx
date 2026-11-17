import type { Metadata } from 'next'
import { ContactForm } from '@/features/contact/ui/ContactForm'
import { PageBox } from '@/components/pages/PageBox'
import { PageSection } from '@/components/pages/PageSection'
import { isContactTopic, type ContactTopic } from '@gyn/core/contact-topics'
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

const SOCIAL = [
  { label: 'Facebook', href: 'https://www.facebook.com/thegyn.org/' },
  { label: 'Instagram', href: 'https://www.instagram.com/gyn_global' },
  { label: 'YouTube', href: 'https://www.youtube.com/@globalyouthnetwork/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/thegyn' },
]

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ContactUsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const topicParam = params.topic
  const topic: ContactTopic = isContactTopic(topicParam) ? topicParam : 'general'

  return (
    <main id="main">
      <PageBox
        id="contact-h1"
        kicker="Write to us"
        title="Get in *touch*"
        lead="Have a question, a partnership idea, or want to book for a group? We would love to hear from you."
      />

      <PageSection id="contact-details" kicker="Contact details" heading="Four ways to *reach* us">
        <div className={styles.stage}>
          <ul className={styles.tiles}>
            <li className="glass">
              <h3>Email</h3>
              <a href="mailto:contact@thegyn.org">contact@thegyn.org</a>
            </li>
            <li className="glass">
              <h3>Phone / WhatsApp</h3>
              <a href="https://wa.me/message/HGC6MW4HT5YJC1" target="_blank" rel="noopener noreferrer">+1 (302) 556-0064</a>
            </li>
            <li className="glass">
              <h3>Address</h3>
              <address>
                1001 S Main St STE 500<br />
                Kalispell, Montana 59901<br />
                United States
              </address>
            </li>
            <li className="glass">
              <h3>Follow us</h3>
              <ul aria-label="GYN social media links" className={styles.social}>
                {SOCIAL.map((x) => (
                  <li key={x.label}>
                    <a href={x.href} target="_blank" rel="noopener noreferrer">{x.label}</a>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </div>
      </PageSection>

      <PageSection id="contact-form" kicker="Contact form" heading="Send a *message*" glow>
        <div className={`glass-lite ${styles.formCard}`}>
          <ContactForm defaultTopic={topic} />
        </div>
      </PageSection>
    </main>
  )
}
