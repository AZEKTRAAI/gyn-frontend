'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { accentRuns, SDG_COLOURS } from '@/features/home/schema'
import type { HomeContent } from '@/features/home/schema'

/** Clip-path wipe: Chrome reports zero intersection for clip-path elements, so use threshold 0 with rootMargin. */
function useWipeReveal() {
  const ref = useRef<HTMLHeadingElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true)
      return
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold: 0, rootMargin: '0px 0px -12% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return { ref, inView }
}

interface SpeakerBadgeProps {
  person: HomeContent['speakers']['people'][0]
  /** CSS animation-delay offset so badges sway out of sync. */
  delay: number
}

function SpeakerBadge({ person, delay }: SpeakerBadgeProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const colour = SDG_COLOURS[person.sdg]

  // 3D tilt toward pointer; CSS transition springs it back on leave.
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const card = cardRef.current
    if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = card.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    card.style.animationPlayState = 'paused'
    card.style.transform = `perspective(600px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateY(-10px) scale(1.03)`
    card.style.boxShadow = '0 24px 60px rgba(14,21,48,.22)'
  }

  function handlePointerLeave() {
    const card = cardRef.current
    if (!card) return
    card.style.animationPlayState = ''
    card.style.transform = ''
    card.style.boxShadow = ''
  }

  return (
    <div
      className="spk-badge"
      style={{ '--c': colour.bg, '--d': `${-delay}s` } as React.CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* The lanyard strap, aria-hidden because it's purely decorative */}
      <span className="spk-lan" aria-hidden="true" />
      <div ref={cardRef} className="spk-cardb">
        {/* Coloured clip bar at the top of the card */}
        <div className="spk-clip" style={{ background: colour.bg }} aria-hidden="true" />
        <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
          <Image
            src={person.photo.src}
            alt={person.photo.alt || person.name}
            fill
            sizes="(max-width:480px) 45vw, (max-width:900px) 22vw, 14vw"
            style={{ objectFit: 'cover', objectPosition: 'top' }}
            loading="lazy"
          />
        </div>
        <div className="spk-txt">
          <p className="spk-nm">{person.name}</p>
          <p className="spk-org">
            <strong>{person.org}</strong>
            {person.role}
          </p>
          <p className="spk-role">
            <em>Speaker</em>
          </p>
        </div>
      </div>
    </div>
  )
}

export function Speakers({ data }: { data: HomeContent['speakers'] }) {
  const { ref, inView } = useWipeReveal()

  return (
    <section
      id="speakers"
      data-name={data.kicker}
      aria-labelledby="spk-hd"
      style={{ background: 'var(--field)', paddingBlock: 'clamp(72px,9vw,136px)' }}
    >
      <div className="wrap">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '16px 32px',
            marginBottom: 'clamp(28px,4vw,48px)',
          }}
        >
          <div>
            <p className="spk-kicker">{data.kicker}</p>
            <h2
              ref={ref}
              id="spk-hd"
              className={`d2 spk-wipe${inView ? ' spk-wipe-in' : ''}`}
              style={{ color: 'var(--ink)', marginTop: '10px' }}
            >
              {accentRuns(data.heading).map((seg, i) =>
                seg.italic ? (
                  <em key={i} className="accent">
                    {seg.text}
                  </em>
                ) : (
                  <span key={i}>{seg.text}</span>
                ),
              )}
            </h2>
          </div>
          {data.intro && (
            <p
              style={{
                fontSize: 'clamp(1rem,1.4vw,1.125rem)',
                color: 'var(--n-600)',
                lineHeight: 1.65,
                maxWidth: '52ch',
              }}
            >
              {data.intro}
            </p>
          )}
        </div>

        <div className="spk-grid">
          {data.people.map((person, i) => (
            <SpeakerBadge key={person.name} person={person} delay={i * 0.6} />
          ))}
        </div>
      </div>

      <style>{`
        .spk-kicker {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--sdg4);
        }
        .spk-wipe {
          clip-path: inset(0 100% 0 0);
          transition: clip-path 1s cubic-bezier(.2,.8,.2,1);
        }
        .spk-wipe-in { clip-path: inset(0 0 0 0); }

        .spk-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 22px 18px;
        }
        @media (max-width: 900px) { .spk-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .spk-grid { grid-template-columns: 1fr 1fr; gap: 16px 12px; } }

        .spk-badge {
          display: grid;
          justify-items: center;
          min-width: 0;
        }
        .spk-lan {
          width: 14px;
          height: 54px;
          border-radius: 0 0 4px 4px;
          background: var(--c);
          transform-origin: top;
          animation: spk-sway 5s ease-in-out infinite;
          animation-delay: var(--d, 0s);
          display: block;
        }
        .spk-cardb {
          width: 100%;
          background: #fff;
          border-radius: 16px;
          border: 1px solid #D3DAE6;
          overflow: hidden;
          transform-origin: top center;
          animation: spk-sway 5s ease-in-out infinite;
          animation-delay: var(--d, 0s);
          transition: box-shadow 0.3s, transform 0.4s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes spk-sway {
          0%, 100% { transform: rotate(-1.2deg); }
          50%       { transform: rotate(1.2deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .spk-lan, .spk-cardb { animation: none !important; transform: none !important; }
        }
        .spk-clip { height: 10px; }
        .spk-txt { padding: 14px 14px 16px; display: grid; gap: 4px; }
        .spk-nm { font-weight: 800; font-size: 16px; line-height: 1.15; letter-spacing: -.01em; color: var(--ink); }
        .spk-org { font-size: 13px; color: var(--n-500); line-height: 1.3; }
        .spk-org strong { display: block; color: var(--ink); font-weight: 600; }
        .spk-role { font-family: var(--fs); font-style: italic; font-size: 14px; color: var(--n-500); }
      `}</style>
    </section>
  )
}
