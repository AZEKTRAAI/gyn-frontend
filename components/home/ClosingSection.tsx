import Link from 'next/link'
import type { HomeContent } from '@/features/home/schema'
import { WordBuild } from '@/components/WordBuild'
import { LoopVideo } from '@/components/LoopVideo'

interface Props {
  closing: HomeContent['closing']
}

export function ClosingSection({ closing }: Props) {
  return (
    <section
      style={{ background: '#0E1530', color: '#fff', paddingTop: 'clamp(56px,7vw,112px)', paddingBottom: 'clamp(80px,9vw,144px)', overflow: 'hidden', textAlign: 'center' }}
      aria-labelledby="closing-hd"
    >
      {/* Hands video */}
      <div
        aria-hidden="true"
        style={{
          width: 'clamp(260px,55vw,760px)',
          margin: '0 auto clamp(28px,3vw,48px)',
          aspectRatio: '16/9',
        }}
      >
        <LoopVideo
          base="/renders/r3/hands-wheel"
          style={{
            /* edge scrim as mask — arms fade into the dark background */
            maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 70%, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 70%, transparent)',
          }}
        />
      </div>

      {/* Poster headline */}
      <div className="wrap">
        <p
          id="closing-hd"
          style={{
            fontFamily: 'var(--font-host-grotesk, var(--fb))',
            fontSize: 'clamp(3.5rem,12vw,11rem)',
            whiteSpace: 'pre-line', // editors set line breaks in the admin
            lineHeight: 0.92,
            letterSpacing: '-0.03em',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '2.25rem',
            textAlign: 'center',
          }}
        >
          <WordBuild text={closing.headline} accent="#FCC30B" />
        </p>
        <Link
          href={closing.cta.href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#FCC30B',
            color: '#0E1530',
            fontSize: '1rem',
            fontWeight: 600,
            padding: '0.875rem 1.75rem',
            borderRadius: '999px',
            transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)',
          }}
        >
          {closing.cta.label} <span aria-hidden="true">&#8594;</span>
        </Link>
      </div>
    </section>
  )
}
