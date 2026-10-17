'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LoopVideo } from '@/components/LoopVideo'
import { accentRuns } from '@/features/home/schema'
import type { HomeContent } from '@/features/home/schema'

/** Split headline on \n, render each line's words with stagger reveal. */
function ClosingHeadline({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null)
  const [phase, setPhase] = useState<'idle' | 'armed' | 'go'>('idle')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase('go')
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase('armed')
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPhase('go')
          obs.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  let wordIdx = 0
  const lines = text.split('\n').map((line, li) => {
    const segments = accentRuns(line)
    const lineContent = segments.flatMap((seg, si) =>
      seg.text.split(/(\s+)/).map((tok, ti) => {
        if (!tok.trim()) return tok
        const i = wordIdx++
        return (
          <span
            key={`${li}-${si}-${ti}`}
            className={`cl-w${seg.italic ? ' cl-acc' : ''}`}
            style={{ '--i': i } as React.CSSProperties}
          >
            {seg.italic ? <em className="accent">{tok}</em> : tok}
          </span>
        )
      }),
    )
    return (
      <span key={li} className="cl-line">
        {lineContent}
        {li < text.split('\n').length - 1 && <br />}
      </span>
    )
  })

  return (
    <h2
      ref={ref}
      id="cl-hd"
      className={`cl-h2${phase === 'go' ? ' cl-go' : ''}${phase === 'armed' ? ' cl-armed' : ''}`}
    >
      {lines}
    </h2>
  )
}

/** Render `data.text` with *highlights* in yellow using accentRuns. Italic runs become yellow <mark>. */
function HighlightText({ text }: { text: string }) {
  return (
    <>
      {accentRuns(text).map((seg, i) =>
        seg.italic ? (
          <mark key={i} style={{ background: 'none', color: 'var(--yellow)', fontWeight: 600 }}>
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  )
}

export function Closing({ data }: { data: HomeContent['closing'] }) {
  return (
    <section
      id="closing"
      aria-labelledby="cl-hd"
      style={{
        background: 'var(--navy)',
        color: '#fff',
        textAlign: 'center',
        paddingBlock: 'clamp(72px,9vw,136px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="wrap" style={{ display: 'grid', justifyItems: 'center', gap: '24px' }}>
        {/* Hands loop video with radial mask so the arms fade into the navy band */}
        <div
          style={{
            width: 'min(100%, 760px)',
            aspectRatio: '16/9',
            /* mask: the arms fade into the band */
            WebkitMaskImage:
              'radial-gradient(ellipse 55% 55% at 50% 50%, #000 60%, transparent)',
            maskImage:
              'radial-gradient(ellipse 55% 55% at 50% 50%, #000 60%, transparent)',
          }}
        >
          <LoopVideo base="/renders/r3/hands-wheel" />
        </div>

        <ClosingHeadline text={data.headline} />

        <p
          style={{
            fontSize: 'clamp(1rem,1.4vw,1.125rem)',
            maxWidth: '56ch',
            lineHeight: 1.65,
            color: 'rgba(255,255,255,.88)',
          }}
        >
          <HighlightText text={data.text} />
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          <Link href={data.primaryCta.href} className="btn btn-y">
            {data.primaryCta.label} <span aria-hidden="true">&#8594;</span>
          </Link>
          {data.secondaryCta.label && (
            <Link href={data.secondaryCta.href} className="btn btn-ow">
              {data.secondaryCta.label}
            </Link>
          )}
        </div>
      </div>

      <style>{`
        .cl-h2 {
          font-family: var(--fd);
          font-size: clamp(3rem,10vw,8.5rem);
          font-weight: 800;
          line-height: .92;
          letter-spacing: -.035em;
          text-wrap: balance;
          overflow-wrap: break-word;
        }
        .cl-w {
          display: inline-block;
        }
        .cl-acc em { color: var(--yellow); }
        /* words hidden until go */
        .cl-armed .cl-w { opacity: 0; transform: translateY(.4em); }
        .cl-go .cl-w {
          animation: cl-land 420ms cubic-bezier(.2,.9,.25,1.15) both;
          animation-delay: calc(var(--i) * 140ms);
        }
        @keyframes cl-land {
          from { opacity: 0; transform: translateY(.4em); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </section>
  )
}
