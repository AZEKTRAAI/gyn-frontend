import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PageBox } from '@/components/pages/PageBox'
import { PageSection } from '@/components/pages/PageSection'
import { PageClosing } from '@/components/pages/PageClosing'
import { TornPhoto } from '@/components/pages/TornPhoto'
import p from '@/components/pages/pages.module.css'
import { getHome } from '@gyn/core/home-store'
import { GALLERY } from '@/features/media/media'
import s from './page.module.css'

// The admin app tells this site to refresh when content is published; this is the safety net if that call is missed.
export const revalidate = 300

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'The Global Youth Network (GYN) is a US-based organization connecting youth with people from various backgrounds. Through international conferences and leadership programs we target students, professionals, innovators, and community leaders.',
  openGraph: {
    title: 'About Us | Global Youth Network',
    description:
      'GYN provides youth with an opportunity to connect with people from various backgrounds and collaborate on global challenges via interactive forums.',
  },
}

// The five objectives from thegyn.org
const OBJECTIVES = [
  { title: 'Conferences', body: 'GYN hosts international forums, workshops and summits to promote dialogue on the Sustainable Development Goals.' },
  { title: 'Networking', body: 'A collaborative space of mentorship, technical support and resource sharing to address pressing global challenges.' },
  { title: 'Leadership', body: 'Building a new generation of leaders with the foresight, integrity and skills for measurable global impact.' },
  { title: 'Mentoring', body: 'Tailor-made, hands-on mentoring to help young people become effective leaders.' },
  { title: 'Training', body: 'Workshops that build leadership capacity and policy expertise for future-ready governance.' },
]

// UN goal statements, verbatim from sdgs.un.org
const GOALS = [
  { n: '4', name: 'Quality Education', goal: 'Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.', poster: '/renders/r3/sdg4-books-poster.webp' },
  { n: '5', name: 'Gender Equality', goal: 'Achieve gender equality and empower all women and girls.', poster: '/renders/r3/sdg5-balance-poster.webp' },
  { n: '9', name: 'Industry, Innovation and Infrastructure', goal: 'Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation.', poster: '/renders/r3/sdg9-gears-poster.webp' },
  { n: '13', name: 'Climate Action', goal: 'Take urgent action to combat climate change and its impacts.', poster: '/renders/r3/sdg13-leaf-poster.webp' },
]

// photos down the sides of the box, and beside the "who we are" text (Bangkok summit)
const HERO_PHOTOS = [9, 6, 5, 10].map((i) => ({ src: GALLERY[i].src, alt: GALLERY[i].alt }))

export default async function AboutUsPage() {
  // the advisory board comes from the home content, so admin edits show here too
  const c = await getHome()

  return (
    <main id="main">
      <PageBox
        id="about-h1"
        kicker="About GYN"
        title="One network for *young* leaders"
        lead="The Global Youth Network connects students, professionals, innovators and community leaders from around the world through international summits and leadership programs."
        facts={['Focus: SDGs 4, 5, 9 and 13', 'US-based, global reach']}
        photos={HERO_PHOTOS}
      >
        <Link href="/sism-2026" className="btn btn-y">Join us in Kuala Lumpur <span aria-hidden="true">&rarr;</span></Link>
      </PageBox>

      {/* WHO WE ARE: the thegyn.org text */}
      <PageSection id="who" heading="Connecting youth across *borders*.">
        <div className={s.who}>
          <TornPhoto src={GALLERY[1].src} alt="Policy workshop at the FutureMinds Summit in Bangkok" seed={61} className={s.whoLeft} caption="Policy workshop, Bangkok" />
          <p className={`${p.body} ${s.whoText}`}>
            GYN is a US-based organization that connects young people with peers from every background and region. Through international conferences and leadership programs they share ideas and work on global challenges in interactive forums, with a focus on four SDGs (4, 5, 9 and 13).
          </p>
          <TornPhoto src={GALLERY[8].src} alt="The World Got a Problem challenge at the FutureMinds Summit in Bangkok" seed={97} className={s.whoRight} caption="World Got a Problem challenge" />
        </div>
      </PageSection>

      {/* MISSION AND VISION: both verbatim from thegyn.org */}
      <PageSection id="mission" heading="Mission and *vision*">
        <div className={s.mvPanel}>
          <figure className="glass-dark">
            <figcaption>Our mission</figcaption>
            <blockquote>
              <p>&ldquo;Empowering youth by cultivating leadership skills via a goal-driven network of GYN, the dedicated platform bringing sustainable change in communities via global interactions through cross-functional ideas ranging from, but not limited to, students, scientists, researchers, policymakers, legal professionals, volunteers, and entrepreneurs.&rdquo;</p>
            </blockquote>
          </figure>
          <figure className={`glass-dark ${s.vision}`}>
            <figcaption>Our vision</figcaption>
            <blockquote>
              <p>&ldquo;Mitigating change through small and sustainable efforts in a world driven by AI&rdquo;</p>
            </blockquote>
          </figure>
        </div>
      </PageSection>

      {/* WHAT WE DO: the five objectives */}
      <PageSection id="do" heading="Five ways GYN *works*" glow>
        <ol className={s.objectives}>
          {OBJECTIVES.map((o, i) => (
            <li key={o.title} className="glass-lite">
              <span className={s.objN} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <h3>{o.title}</h3>
              <p>{o.body}</p>
            </li>
          ))}
        </ol>
      </PageSection>

      {/* THE FOUR GOALS */}
      <PageSection id="goals" heading="Four goals. *Every* summit.">
        <ul className={s.goals}>
          {GOALS.map((g) => (
            <li key={g.n}>
              <Image src={g.poster} alt="" width={400} height={225} className={s.goalImg} />
              <div className={s.goalText}>
                <span className={s.goalN}>SDG {g.n}</span>
                <h3>{g.name}</h3>
                <p>{g.goal}</p>
              </div>
            </li>
          ))}
        </ul>
      </PageSection>

      {c.advisors.people.length > 0 && (
        <PageSection id="advisors" heading="Global *advisory board*" glow>
          <ul className={s.advisors}>
            {c.advisors.people.map((a) => (
              <li key={a.name} className="glass-lite">
                <Image src={a.photo.src} alt={a.photo.alt || a.name} width={96} height={96} sizes="96px" loading="lazy" />
                <h3>{a.name}</h3>
                <span className={s.where}>{a.where}</span>
                {a.bio && <p>{a.bio}</p>}
              </li>
            ))}
          </ul>
        </PageSection>
      )}

      {/* CLOSING */}
      <PageClosing
        id="close"
        name="Join GYN"
        heading="Your first global stage is in *Kuala Lumpur*."
        text="Come as a delegate, or bring your organization in as a partner."
      >
        <Link href="/sism-2026" className="btn btn-y">Apply for SISM 2026 <span aria-hidden="true">&rarr;</span></Link>
        <Link href="/contact-us?topic=partnership" className="btn btn-ow">Partner with us</Link>
      </PageClosing>
    </main>
  )
}
