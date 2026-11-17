import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PageBox } from '@/components/pages/PageBox'
import { PageSection } from '@/components/pages/PageSection'
import { PageClosing } from '@/components/pages/PageClosing'
import { TornPhoto } from '@/components/pages/TornPhoto'
import p from '@/components/pages/pages.module.css'
import { Network } from '@/components/home/Network'
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

// Everyone the GYN mission statement names, shown as chips
const WHO_FOR = ['Students', 'Scientists', 'Researchers', 'Policymakers', 'Legal professionals', 'Volunteers', 'Entrepreneurs']

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
  // network, advisors, partners and the Bangkok facts come from the home content, so admin edits show here too
  const c = await getHome()
  const bangkok = c.past.editions[0]
  const fact = (label: string) => bangkok?.facts.find((f) => f.label === label)?.n
  const countries = new Set(c.network.people.map((x) => x.country)).size

  const numbers = [
    { n: fact('participants') ?? '70', text: 'delegates at our first summit, Bangkok 2026' },
    { n: String(c.network.people.length), text: `ambassadors in ${countries} countries` },
    { n: String(c.advisors.people.length), text: 'advisors on the global advisory board' },
    { n: fact('speakers') ?? '12', text: 'speakers on the Bangkok stage' },
    { n: '4', text: 'Sustainable Development Goals we work on' },
  ]

  return (
    <main id="main">
      <PageBox
        id="about-h1"
        kicker="About GYN"
        title="One network for *young* leaders"
        lead="The Global Youth Network connects students, professionals, innovators and community leaders from around the world through international summits and leadership programs."
        facts={['Focus: SDGs 4, 5, 9 and 13', 'US-based, global reach', `${c.network.people.length} ambassadors in ${countries} countries`]}
        photos={HERO_PHOTOS}
      >
        <Link href="/sism-2026" className="btn btn-y">Join us in Kuala Lumpur <span aria-hidden="true">&rarr;</span></Link>
        <Link href="#story" className={`btn glass-dark ${p.btnGlass}`}>Our story</Link>
      </PageBox>

      {/* WHO WE ARE: the thegyn.org text, with the people the mission names */}
      <PageSection
        id="who"
        kicker="Who we are"
        heading="Connecting youth across *borders*."
        intro="The Global Youth Network (GYN) is a US-based organization that gives young people the chance to connect with people from different backgrounds and every part of the world."
      >
        <div className={s.who}>
          <TornPhoto src={GALLERY[1].src} alt="Policy workshop at the FutureMinds Summit in Bangkok" seed={61} className={s.whoLeft} caption="Policy workshop, Bangkok" />
          <div className={s.whoText}>
            <p className={p.body}>
              Through our international conferences and leadership programs, students, professionals, innovators and community leaders share their ideas and work together on global challenges in interactive forums. With our focus on four SDGs (4, 5, 9 and 13), we hope to bring sustainable change from local communities to global outreach.
            </p>
            <p className={s.forLabel}>GYN is for</p>
            <ul className={s.chips}>
              {WHO_FOR.map((w) => <li key={w}>{w}</li>)}
              <li className={s.chipMore}>and you</li>
            </ul>
          </div>
          <TornPhoto src={GALLERY[8].src} alt="The World Got a Problem challenge at the FutureMinds Summit in Bangkok" seed={97} className={s.whoRight} caption="World Got a Problem challenge" />
        </div>
      </PageSection>

      {/* GYN IN NUMBERS */}
      <PageSection id="numbers" kicker="GYN in numbers" heading="Young, and already *global*." glow>
        <ul className={s.numbers}>
          {numbers.map((x) => (
            <li key={x.text} className="glass-lite">
              <b>{x.n}</b>
              <span>{x.text}</span>
            </li>
          ))}
        </ul>
      </PageSection>

      {/* MISSION AND VISION: both verbatim from thegyn.org */}
      <PageSection id="mission" kicker="Why we exist" heading="Mission and *vision*">
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
      <PageSection
        id="do"
        kicker="What we do"
        heading="Five ways GYN *works*"
        intro="GYN is a global platform for young people. It organizes collaborative activities where people use their skills, communicate and learn from a diverse, knowledge-based network, to inspire the young and responsible leaders of tomorrow."
        glow
      >
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
      <PageSection
        id="goals"
        kicker="Our focus"
        heading="Four goals. *Every* summit."
        intro="Every GYN programme, workshop and pitch is built around four of the United Nations Sustainable Development Goals."
      >
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

      {/* OUR STORY: the summits so far and next */}
      <PageSection id="story" kicker="Our story so far" heading="From Bangkok to *Kuala Lumpur*" glow>
        <ol className={s.timeline}>
          {bangkok && (
            <li className={`glass-lite ${s.stop}`}>
              <span className={s.stamp}>{bangkok.edition}</span>
              <h3>FutureMinds Summit Thailand</h3>
              <p className={s.when}>{bangkok.dates}</p>
              <p className={s.text}>{bangkok.text}</p>
              <ul className={s.facts}>
                {bangkok.facts.map((f) => <li key={f.label}><b>{f.n}</b> {f.label}</li>)}
              </ul>
              <Link href="/fms-thailand" className="btn btn-g">See the Bangkok summit</Link>
            </li>
          )}
          <li className={`${s.stop} ${s.next}`}>
            <span className={`${s.stamp} ${s.stampNext}`}>Edition 02, next</span>
            <h3>{c.strip.eventName}</h3>
            <p className={s.when}>{c.strip.dateVenue}</p>
            <p className={s.text}>{c.strip.cohost}. 100 seats for young leaders, innovators and changemakers, with a $1,000 seed grant for the best project.</p>
            <Link href="/sism-2026" className="btn btn-y">Explore SISM 2026 <span aria-hidden="true">&rarr;</span></Link>
          </li>
        </ol>
      </PageSection>

      {/* Bangkok photos in a row that scrolls sideways */}
      <PageSection id="photos" kicker="Bangkok 2026" heading="The first summit, in *photos*">
        <ul className={s.strip} aria-label="Photos from the FutureMinds Summit in Bangkok" tabIndex={0}>
          {GALLERY.map((g) => (
            <li key={g.src}>
              <Image src={g.src} alt={g.alt} width={g.width} height={g.height} sizes="300px" loading="lazy" />
            </li>
          ))}
        </ul>
      </PageSection>

      {c.network.people.length > 0 && <Network data={c.network} tone="light" />}

      {c.advisors.people.length > 0 && (
        <PageSection
          id="advisors"
          kicker={c.advisors.kicker}
          heading={c.advisors.heading}
          intro={c.advisors.intro}
          link={{ label: 'Apply for SISM 2026', href: '/sism-2026' }}
          glow
        >
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

      <PageSection id="partners" kicker="Partners" heading={c.partners.heading.replace(/(\S+)$/, '*$1*')} intro={c.partners.cohost.text}>
        <div className={s.cohost}>
          <Image src={c.partners.cohost.logo.src} alt={c.partners.cohost.logo.alt} width={160} height={64} />
          <p>{c.partners.cohost.note}</p>
        </div>
        <ul className={s.logos}>
          {c.partners.logos.map((l) => {
            const img = <Image src={l.logo} alt={l.name || 'Partner logo'} width={140} height={48} className={s.logo} />
            return <li key={l.logo}>{l.href ? <a href={l.href} target="_blank" rel="noopener noreferrer">{img}</a> : img}</li>
          })}
        </ul>
      </PageSection>

      {/* CLOSING */}
      <PageClosing
        id="close"
        name="Join GYN"
        heading="Your first global stage is in *Kuala Lumpur*."
        text="Come as a delegate, or bring your organization in as a partner. GYN works with youth leaders, researchers and organizations that share our commitment to the Sustainable Development Goals."
      >
        <Link href="/sism-2026" className="btn btn-y">Apply for SISM 2026 <span aria-hidden="true">&rarr;</span></Link>
        <Link href="/contact-us?topic=partnership" className="btn btn-ow">Partner with us</Link>
      </PageClosing>
    </main>
  )
}
