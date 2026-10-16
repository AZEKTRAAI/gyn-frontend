'use client';

/**
 * HorizontalGallery — sticky section where vertical scroll drives a horizontal
 * image track. A progress bar fills as you scroll through.
 * Each photo has a subtle inner parallax (image moves slower than the track).
 * On mobile (< 768 px) and with prefers-reduced-motion: native scroll-snap row.
 *
 * Technique: useScroll({ target, offset }) → useTransform for the track x.
 *            Inner-image parallax via a second useTransform.
 * Source: Motion official "Scroll pinning" tutorial (motion.dev/tutorials/js-scroll-pinning);
 *         own implementation with parallax layer added.
 *         No library code copied; MIT concept.
 */

import { useRef, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
} from 'motion/react';
import { useMediaQuery } from '../useMediaQuery';
import Image from 'next/image';

export interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  /** Optional caption shown on hover */
  caption?: string;
}

export interface HorizontalGalleryProps {
  photos: GalleryPhoto[];
  /** Section heading (visible above gallery) */
  heading?: string;
}

const CARD_W_VW = 55; // card width as vw
const CARD_GAP = 24; // px

export function HorizontalGallery({ photos, heading }: HorizontalGalleryProps) {
  const prefersReduced = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (isMobile || prefersReduced) {
    return <NativeScrollRow photos={photos} heading={heading} />;
  }
  return <StickyScrollGallery photos={photos} heading={heading} />;
}

// ─── Desktop: sticky scroll-driven ───────────────────────────────────────────

function StickyScrollGallery({ photos, heading }: HorizontalGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Each card is CARD_W_VW vw + gap; total track width minus one viewport
  // We can't know exact pixel values at render; useTransform handles it dynamically.
  // shortcut: track width computed from card count × assumed card size; recalculates on scroll
  const cardCount = photos.length;
  // The container height drives the scroll distance
  // = 100vh (sticky) + total horizontal scroll distance
  const scrollDistance = `calc(${cardCount} * (${CARD_W_VW}vw + ${CARD_GAP}px) - 100vw + ${CARD_GAP * 2}px)`;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // ResizeObserver-backed motion value so the track x recalculates on resize
  // (window.innerWidth read at render time never updates — this fixes it)
  const windowWidthMv = useMotionValue(typeof window !== 'undefined' ? window.innerWidth : 1440);
  useEffect(() => {
    const ro = new ResizeObserver(() => windowWidthMv.set(window.innerWidth));
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [windowWidthMv]);

  const trackX = useTransform(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [scrollYProgress, windowWidthMv] as any,
    ([progress, w]: number[]) =>
      -(progress) * (cardCount - 1) * ((w) * (CARD_W_VW / 100) + CARD_GAP),
  );

  // For the progress bar
  const barScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div
      ref={containerRef}
      style={{
        // Height = sticky viewport + the amount we need to scroll horizontally
        height: `calc(100vh + ${scrollDistance})`,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          background: 'var(--navy-900, #0E1530)',
        }}
      >
        {heading && (
          <div style={{ padding: '2rem clamp(1.5rem, 5vw, 4rem) 1rem', color: 'var(--white, #fff)' }}>
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(1.25rem, 2.5vw, 2rem)', lineHeight: 1.1 }}>
              {heading}
            </h2>
          </div>
        )}

        {/* Progress bar */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'rgba(255,255,255,0.12)',
          }}
        >
          <motion.div
            style={{
              height: '100%',
              background: 'var(--yellow, #FCC30B)',
              transformOrigin: 'left',
              scaleX: barScaleX,
            }}
          />
        </div>

        {/* Scrolling track */}
        <motion.div
          ref={trackRef}
          style={{
            display: 'flex',
            gap: `${CARD_GAP}px`,
            paddingInline: 'clamp(1.5rem, 5vw, 4rem)',
            alignItems: 'center',
            height: '100%',
            x: trackX,
            willChange: 'transform',
          }}
        >
          {photos.map((photo, i) => (
            <GalleryCard
              key={photo.id}
              photo={photo}
              scrollYProgress={scrollYProgress}
              index={i}
              total={photos.length}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Individual card with inner parallax ─────────────────────────────────────

function GalleryCard({
  photo,
  scrollYProgress,
  index,
  total,
}: {
  photo: GalleryPhoto;
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress'];
  index: number;
  total: number;
}) {
  // Each card's parallax window is a slice of the total scroll range
  const start = index / total;
  const end = (index + 1) / total;
  // Image moves slightly slower than the card → depth illusion
  const imgX = useTransform(scrollYProgress, [start, end], ['5%', '-5%']);

  return (
    <div
      style={{
        flex: `0 0 ${CARD_W_VW}vw`,
        height: '65vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <motion.div style={{ x: imgX, width: '110%', height: '100%', left: '-5%', position: 'absolute' }}>
        <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 768px) 60vw, 100vw" style={{ objectFit: 'cover' }} />
      </motion.div>
      {photo.caption && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '0.75rem 1rem',
            background: 'rgba(14,21,48,0.72)', /* scrim */
            color: 'var(--white, #fff)',
            fontSize: '0.8125rem',
            opacity: 0,
            transition: 'opacity 200ms ease',
          }}
          className="gallery-caption"
        >
          {photo.caption}
        </div>
      )}
    </div>
  );
}

// ─── Mobile / reduced-motion: native scroll-snap ──────────────────────────────

function NativeScrollRow({ photos, heading }: HorizontalGalleryProps) {
  return (
    <section style={{ background: 'var(--navy-900, #0E1530)', paddingBlock: '2rem' }}>
      {heading && (
        <h2
          style={{
            fontFamily: 'var(--fd)',
            fontSize: 'clamp(1.25rem, 5vw, 2rem)',
            color: 'var(--white, #fff)',
            marginBottom: '1rem',
            paddingInline: '1.5rem',
            lineHeight: 1.1,
          }}
        >
          {heading}
        </h2>
      )}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollPaddingInline: '1.5rem',
          paddingInline: '1.5rem',
          paddingBottom: '0.5rem',
          scrollbarWidth: 'none',
        }}
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            style={{
              flex: '0 0 78vw',
              aspectRatio: '4/3',
              scrollSnapAlign: 'start',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* phones get a right-sized file instead of the 1600px original (RT-056) */}
            <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 767px) 85vw, 400px" style={{ objectFit: 'cover' }} />
            {photo.caption && (
              <p style={{ fontSize: '0.75rem', color: 'var(--n-400, #9A9A93)', padding: '0.5rem 0' }}>
                {photo.caption}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
