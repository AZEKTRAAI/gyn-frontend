import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PageHero } from '@/components/PageHero'
import { Network } from '@/components/home/Network'
import { Advisors } from '@/components/home/Advisors'
import { Partners } from '@/components/home/Partners'
import { getHome } from '@/features/home/store'
import { GALLERY } from '@/features/media/media'
import s from './page.module.css'

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

// The five objectives from thegyn.org, each on an SDG colour (ink text where white fails contrast)
const OBJECTIVES = [
  { title: 'Conferences', body: 'GYN hosts international forums, workshops and summits to promote dialogue on the Sustainable Development Goals.', bg: 'var(--sdg4)', fg: '#fff' },
  { title: 'Networking', body: 'A collaborative space of mentorship, technical support and resource sharing to address pressing global challenges.', bg: 'var(--sdg9)', fg: 'var(--ink)' },
  { title: 'Leadership', body: 'Building a new generation of leaders with the foresight, integrity and skills for measurable global impact.', bg: 'var(--navy)', fg: '#fff' },
  { title: 'Mentoring', body: 'Tailor-made, hands-on mentoring to help young people become effective leaders.', bg: 'var(--sdg13)', fg: '#fff' },
  { title: 'Training', body: 'Workshops that build leadership capacity and policy expertise for future-ready governance.', bg: 'var(--y)', fg: 'var(--ink)' },
]

// UN goal statements, verbatim from sdgs.un.org
const GOALS = [
  { n: '4', name: 'Quality Education', goal: 'Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.', bg: 'var(--sdg4)', fg: '#fff', poster: '/renders/r3/sdg4-books-poster.webp' },
  { n: '5', name: 'Gender Equality', goal: 'Achieve gender equality and empower all women and girls.', bg: 'var(--sdg5)', fg: 'var(--ink)', poster: '/renders/r3/sdg5-balance-poster.webp' },
  { n: '9', name: 'Industry, Innovation and Infrastructure', goal: 'Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation.', bg: 'var(--sdg9)', fg: 'var(--ink)', poster: '/renders/r3/sdg9-gears-poster.webp' },
  { n: '13', name: 'Climate Action', goal: 'Take urgent action to combat climate change and its impacts.', bg: 'var(--sdg13)', fg: '#fff', poster: '/renders/r3/sdg13-leaf-poster.webp' },
]

export default async function AboutUsPage() {
  // network, advisors, partners and the Bangkok facts come from the home content, so admin edits show here too
  const c = await getHome()
  const bangkok = c.past.editions[0]
  const fact = (label: string) => bangkok?.facts.find((f) => f.label === label)?.n
  const countries = new Set(c.network.people.map((p) => p.country)).size

  const numbers = [
    { n: fact('participants') ?? '70', text: 'delegates at our first summit, Bangkok 2026', bg: 'var(--sdg4)', fg: '#fff' },
    { n: String(c.network.people.length), text: `ambassadors in ${countries} countries`, bg: 'var(--navy)', fg: '#fff' },
    { n: String(c.advisors.people.length), text: 'advisors on the global advisory board', bg: 'var(--sdg13)', fg: '#fff' },
    { n: fact('speakers') ?? '12', text: 'speakers on the Bangkok stage', bg: 'var(--sdg9)', fg: 'var(--ink)' },
    { n: '4', text: 'Sustainable Development Goals we work on', bg: 'var(--y)', fg: 'var(--ink)' },
  ]

  return (
    <main id="main">
      <PageHero
        id="about-h1"
        kicker="About GYN"
        title="One network for *young* leaders"
        lead="The Global Youth Network connects students, professionals, innovators and community leaders from around the world through international summits and leadership programs."
        chips={['Focus: SDGs 4, 5, 9 and 13', 'US-based, global reach', `${c.network.people.length} ambassadors in ${countries} countries`]}
        actions={
          <>
            <Link href="/sism-2026" className="btn btn-y">Join us in Kuala Lumpur <span aria-hidden="true">&#8594;</span></Link>
            <Link href="#story" className="btn btn-g">Our story</Link>
          </>
        }
        media={
          <Image
            src="/media/gallery/fmst-dsc02172-1.webp"
            alt="Delegates together at the FutureMinds Summit in Bangkok"
            width={768}
            height={512}
            sizes="(max-width: 900px) 100vw, 40vw"
            priority
          />
        }
      />

      {/* WHO WE ARE: the thegyn.org text, with the people the mission names */}
      <section aria-labelledby="who-hd" data-name="Who we are" className={s.band} style={{ background: '#fff' }}>
        <div className={`wrap ${s.who}`}>
          <div>
            <span className="kick">Who we are</span>
            <h2 id="who-hd" className="d2">Connecting youth across <span className="accent">borders</span>.</h2>
            <p className={`rise ${s.lede}`}>
              The Global Youth Network (GYN) is a US-based organization that gives young people the chance to connect with people from different backgrounds and every part of the world.
            </p>
            <p className={`rise ${s.body}`}>
              Through our international conferences and leadership programs, students, professionals, innovators and community leaders share their ideas and work together on global challenges in interactive forums. With our focus on four SDGs (4, 5, 9 and 13), we hope to bring sustainable change from local communities to global outreach.
            </p>
            <p className={s.forLabel}>GYN is for</p>
            <ul className={s.chips}>
              {WHO_FOR.map((w) => <li key={w}>{w}</li>)}
              <li className={s.chipMore}>and you</li>
            </ul>
          </div>
          <div className={s.photoStack} aria-hidden="true">
            <figure className="pol"><Image src="/media/gallery/fmst-dsc01894-1.webp" alt="" width={768} height={512} sizes="(max-width: 900px) 80vw, 30vw" /><figcaption>Policy workshop, Bangkok</figcaption></figure>
            <figure className="pol"><Image src="/media/gallery/fmst-dsc02159-1.webp" alt="" width={768} height={512} sizes="(max-width: 900px) 80vw, 30vw" /><figcaption>World Got a Problem challenge</figcaption></figure>
          </div>
        </div>
      </section>

      {/* GYN IN NUMBERS */}
      <section aria-labelledby="num-hd" data-name="GYN in numbers" className={s.band} style={{ background: 'var(--field)' }}>
        <div className="wrap">
          <span className="kick">GYN in numbers</span>
          <h2 id="num-hd" className="d2">Young, and already <span className="accent">global</span>.</h2>
          <ul className={s.numbers}>
            {numbers.map((x) => (
              <li key={x.text} className="tile" style={{ background: x.bg, color: x.fg }}>
                <span className={s.bigN}>{x.n}</span>
                <span className={s.numText}>{x.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* MISSION AND VISION: both verbatim from thegyn.org */}
      <section aria-labelledby="mv-hd" data-name="Mission and vision" className={`${s.band} band-navy on-navy`}>
        <div className="wrap">
          <span className="kick">Why we exist</span>
          <h2 id="mv-hd" className="d2">Mission and vision</h2>
          <div className={s.mv}>
            <figure className={s.mission}>
              <figcaption className={s.mvLabel}>Our mission</figcaption>
              <blockquote>
                <p>&ldquo;Empowering youth by cultivating leadership skills via a goal-driven network of GYN, the dedicated platform bringing sustainable change in communities via global interactions through cross-functional ideas ranging from, but not limited to, students, scientists, researchers, policymakers, legal professionals, volunteers, and entrepreneurs.&rdquo;</p>
              </blockquote>
            </figure>
            <figure className={s.vision}>
              <figcaption className={s.mvLabel}>Our vision</figcaption>
              <blockquote>
                <p>&ldquo;Mitigating change through small and sustainable efforts in a world driven by AI&rdquo;</p>
              </blockquote>
            </figure>
          </div>
        </div>
      </section>

      {/* WHAT WE DO: the five objectives */}
      <section aria-labelledby="do-hd" data-name="What we do" className={s.band} style={{ background: '#fff' }}>
        <div className="wrap">
          <span className="kick">What we do</span>
          <h2 id="do-hd" className="d2">Five ways GYN <span className="accent">works</span></h2>
          <p className={`rise ${s.body}`}>
            GYN is a global platform for young people. It organizes collaborative activities where people use their skills, communicate and learn from a diverse, knowledge-based network, to inspire the young and responsible leaders of tomorrow.
          </p>
          <ol className={s.objectives}>
            {OBJECTIVES.map((o, i) => (
              <li key={o.title} className="tile" style={{ background: o.bg, color: o.fg }}>
                <span className={s.objN} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3 className={s.objTitle}>{o.title}</h3>
                <p className={s.objBody}>{o.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* THE FOUR GOALS */}
      <section aria-labelledby="sdg-hd" data-name="Our four goals" className={s.band} style={{ background: 'var(--field)' }}>
        <div className="wrap">
          <span className="kick">Our focus</span>
          <h2 id="sdg-hd" className="d2">Four goals. <span className="accent">Every</span> summit.</h2>
          <p className={`rise ${s.body}`}>
            Every GYN programme, workshop and pitch is built around four of the United Nations Sustainable Development Goals.
          </p>
          <ul className={s.goals}>
            {GOALS.map((g) => (
              <li key={g.n} className="tile" style={{ background: g.bg, color: g.fg, padding: 0 }}>
                <Image src={g.poster} alt="" width={400} height={280} className={s.goalImg} />
                <div className={s.goalText}>
                  <span className={s.goalN}>SDG {g.n}</span>
                  <h3 className={s.goalName}>{g.name}</h3>
                  <p className={s.goalBody}>{g.goal}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* OUR STORY: the summits so far and next */}
      <section id="story" aria-labelledby="story-hd" data-name="Our story" className={s.band} style={{ background: '#fff' }}>
        <div className="wrap">
          <span className="kick">Our story so far</span>
          <h2 id="story-hd" className="d2">From Bangkok to <span className="accent">Kuala Lumpur</span></h2>
          <ol className={s.timeline}>
            {bangkok && (
              <li className={`card ${s.stop}`}>
                <span className={s.stamp}>{bangkok.edition}</span>
                <h3 className={s.stopName}>FutureMinds Summit Thailand</h3>
                <p className={s.stopWhen}>{bangkok.dates}</p>
                <p className={s.body}>{bangkok.text}</p>
                <ul className={s.stopFacts}>
                  {bangkok.facts.map((f) => <li key={f.label}><b>{f.n}</b> {f.label}</li>)}
                </ul>
                <Link href="/fms-thailand" className="btn btn-g">See the Bangkok summit</Link>
              </li>
            )}
            <li className={`tile ${s.stop} ${s.next}`}>
              <span className={`${s.stamp} ${s.stampNext}`}>Edition 02, next</span>
              <h3 className={s.stopName}>{c.strip.eventName}</h3>
              <p className={s.stopWhen}>{c.strip.dateVenue}</p>
              <p className={s.nextBody}>{c.strip.cohost}. 100 seats for young leaders, innovators and changemakers, with a $1,000 seed grant for the best project.</p>
              <Link href="/sism-2026" className="btn btn-y">Explore SISM 2026 <span aria-hidden="true">&#8594;</span></Link>
            </li>
          </ol>
          {/* Bangkok photos as a row of polaroids that scrolls sideways */}
          <ul className={s.strip} aria-label="Photos from the FutureMinds Summit in Bangkok" tabIndex={0}>
            {GALLERY.map((g) => (
              <li key={g.src}>
                <figure className="pol">
                  <Image src={g.src} alt={g.alt} width={g.width} height={g.height} sizes="260px" loading="lazy" />
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {c.network.people.length > 0 && <Network data={c.network} />}
      {c.advisors.people.length > 0 && <Advisors data={{ ...c.advisors, cta: { label: 'Apply for SISM 2026', href: '/sism-2026' } }} />}
      <Partners data={c.partners} />

      {/* CLOSING */}
      <section aria-labelledby="close-hd" data-name="Join GYN" className={`${s.band} band-y`}>
        <div className={`wrap ${s.close}`}>
          <div>
            <span className="kick">Be part of it</span>
            <h2 id="close-hd" className={s.closeHd}>Your first global stage is in Kuala Lumpur.</h2>
            <p className={s.closeBody}>
              Come as a delegate, or bring your organization in as a partner. GYN works with youth leaders, researchers and organizations that share our commitment to the Sustainable Development Goals.
            </p>
            <div className={s.closeBtns}>
              <Link href="/sism-2026" className="btn btn-n">Apply for SISM 2026 <span aria-hidden="true">&#8594;</span></Link>
              <Link href="/contact-us?topic=partnership" className="btn btn-g">Partner with us</Link>
            </div>
          </div>
          <div className={s.closePols} aria-hidden="true">
            <figure className="pol">
              <Image src="/media/gallery/fmst-dsc02172-1.webp" alt="" width={768} height={512} sizes="(max-width: 900px) 55vw, 20vw" loading="lazy" />
              <figcaption>Bangkok, July 2026</figcaption>
            </figure>
            <figure className="pol">
              <Image src="/media/gallery/fmst-dsc02159-1.webp" alt="" width={768} height={512} sizes="(max-width: 900px) 55vw, 20vw" loading="lazy" />
              <figcaption>FutureMinds Summit Thailand</figcaption>
            </figure>
            <figure className="pol">
              <Image src="/media/gallery/fmst-dsc01894-1.webp" alt="" width={768} height={512} sizes="(max-width: 900px) 55vw, 20vw" loading="lazy" />
              <figcaption>Panel session, Bangkok</figcaption>
            </figure>
          </div>
        </div>
      </section>
    </main>
  )
}
