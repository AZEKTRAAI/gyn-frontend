'use client'

import { useState, useEffect, useId } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { accentRuns } from '@/features/home/schema'
import type { HomeContent } from '@/features/home/schema'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'

// Rotations and top offsets match the concept's staggered polaroid layout.
const ROTATIONS = [-3, 2, -1.5, 3, 2.5, -2, 1.5, -3]
const OFFSETS   = [0, 28, 0, 18, -10, 0, 22, 0]

type GalleryItem = HomeContent['gallery']['items'][0]

/**
 * Polaroid card for items with a videoUrl.
 * Uses a 16:9 photo box so the youtube-nocookie player fits without black bars.
 * Disables hover lift while the video is playing (hover on a playing card is distracting).
 */
function VideoPolaroid({ item, rot, mt, idx }: { item: GalleryItem; rot: number; mt: number; idx: number }) {
  const id = useId()
  const [isPlaying, setIsPlaying] = useState(false)

  // Another video started — reset our visual state (YouTubeEmbed resets itself via the same event)
  useEffect(() => {
    function h(e: Event) {
      if ((e as CustomEvent<string>).detail !== id) setIsPlaying(false)
    }
    window.addEventListener('yt:play', h)
    return () => window.removeEventListener('yt:play', h)
  }, [id])

  const label = `${item.title}${item.caption ? `, ${item.caption}` : ''}`

  return (
    <div style={{ marginTop: mt }}>
      <motion.div
        className="wall-pol"
        initial={{ opacity: 0, y: -30, rotate: 0 }}
        whileInView={{ opacity: 1, y: 0, rotate: rot }}
        viewport={{ once: true }}
        transition={{ type: 'spring', bounce: 0.28, delay: idx * 0.07 }}
        // No lift/tilt while the video plays
        whileHover={isPlaying ? undefined : { rotate: 0, y: -10, scale: 1.04, zIndex: 4, boxShadow: '0 30px 70px rgba(0,0,0,.45)' }}
      >
        {/* 16:9 box — fits the YouTube player cleanly; non-video polaroids keep aspectRatio 1 */}
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#2a3560' }}>
          <YouTubeEmbed
            videoUrl={item.videoUrl!}
            posterSrc={item.image.src}
            posterAlt={label}
            instanceId={id}
            onPlay={() => setIsPlaying(true)}
            overlayClassName="wall-play-overlay"
            playBtnClassName="wall-play-btn"
          />
        </div>
        <span className="wall-cap">
          {item.title || item.caption}
          {item.caption && item.title && (
            <small className="wall-cap-small">{item.caption}</small>
          )}
        </span>
      </motion.div>
    </div>
  )
}

export function Wall({ data }: { data: HomeContent['gallery'] }) {
  return (
    <section
      id="gallery"
      aria-labelledby="gal-hd"
      data-name="The wall"
      style={{ background: 'var(--navy)', color: '#fff', paddingBlock: 'clamp(72px,9vw,136px)' }}
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
            <p
              style={{
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--yellow)',
              }}
            >
              {data.kicker}
            </p>
            <h2 id="gal-hd" className="d2" style={{ color: '#fff', marginTop: '10px' }}>
              {accentRuns(data.heading).map((seg, i) =>
                seg.italic ? (
                  <em key={i} className="accent" style={{ color: 'var(--yellow)' }}>
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
                color: 'rgba(255,255,255,.85)',
                lineHeight: 1.65,
                maxWidth: '52ch',
              }}
            >
              {data.intro}
            </p>
          )}
        </div>

        {/* Polaroid grid */}
        <div className="wall-grid">
          {data.items.map((item, i) => {
            const rot = ROTATIONS[i % ROTATIONS.length]
            const mt = OFFSETS[i % OFFSETS.length]
            const isVideo = !!item.videoUrl

            if (isVideo) {
              return (
                <VideoPolaroid key={item.image.src} item={item} rot={rot} mt={mt} idx={i} />
              )
            }

            // Non-video polaroid — unchanged
            return (
              <div key={item.image.src} style={{ marginTop: mt }}>
                <motion.div
                  className="wall-pol"
                  initial={{ opacity: 0, y: -30, rotate: 0 }}
                  whileInView={{ opacity: 1, y: 0, rotate: rot }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', bounce: 0.28, delay: i * 0.07 }}
                  whileHover={{ rotate: 0, y: -10, scale: 1.04, zIndex: 4, boxShadow: '0 30px 70px rgba(0,0,0,.45)' }}
                >
                  <div
                    style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#2a3560' }}
                  >
                    <Image
                      src={item.image.src}
                      alt={item.image.alt || ''}
                      fill
                      sizes="(max-width: 760px) 45vw, 22vw"
                      style={{ objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>
                  <span className="wall-cap">
                    {item.title || item.caption}
                    {item.caption && item.title && (
                      <small className="wall-cap-small">{item.caption}</small>
                    )}
                  </span>
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        .wall-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: clamp(14px, 2.5vw, 28px);
          padding-top: 10px;
        }
        @media (max-width: 760px) {
          .wall-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .wall-pol {
          background: #fff;
          color: var(--ink);
          padding: 10px 10px 14px;
          border-radius: 6px;
          box-shadow: 0 14px 40px rgba(0,0,0,.35);
          display: block;
          min-width: 0;
          position: relative;
          will-change: transform;
          cursor: default;
        }
        .wall-cap {
          display: block;
          padding-top: 10px;
          font-size: 15px;
          line-height: 1.2;
        }
        .wall-cap-small {
          display: block;
          font-family: var(--fd);
          font-style: normal;
          font-size: 11.5px;
          color: var(--n-500);
          margin-top: 3px;
        }
        .wall-play-overlay {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
        }
        .wall-play-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--yellow);
          display: grid;
          place-items: center;
        }
      `}</style>
    </section>
  )
}
