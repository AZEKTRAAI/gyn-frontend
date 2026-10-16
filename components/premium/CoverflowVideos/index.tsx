'use client';

/**
 * CoverflowVideos — centred video-thumbnail carousel with 3D perspective.
 * Side items rotate on Y-axis and recede (scale + z). The active item is
 * full-size and flat. Drag + snap to next/prev. Enter key fires onOpen.
 *
 * Transform per card:
 *   offset = index - active
 *   rotateY = clamp(offset × 45, -60, 60) deg
 *   x      = offset × (CARD_W + GAP)
 *   scale  = 1 - |offset| × 0.12
 *   z      = -|offset| × 80 (recede)
 *   opacity = 1 - |offset| × 0.3
 *
 * WAI-ARIA: region + aria-roledescription="carousel". Active item shows
 * title + category. Enter / Space opens the player modal via onOpen callback.
 *
 * Technique: CSS perspective on container + rotateY/translateZ per card.
 * Source: Coverflow pattern (CSS 3D transforms — no library);
 *         Emil Kowalski 3D transform-style: preserve-3d notes (animations.dev).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  motion,
  useReducedMotion,
  type PanInfo,
} from 'motion/react';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const CARD_W = 280; // px
const CARD_GAP = 40; // px between card centres
const DRAG_THRESHOLD = 60;

export interface VideoItem {
  id: string;
  title: string;
  category: string;
  thumbnailSrc: string;
  thumbnailAlt?: string;
  /** Duration string e.g. "4:32" */
  duration?: string;
}

export interface CoverflowVideosProps {
  items: VideoItem[];
  /** Called when user activates an item (Enter/click on active card) */
  onOpen: (item: VideoItem) => void;
  heading?: string;
}

export function CoverflowVideos({ items, onOpen, heading }: CoverflowVideosProps) {
  const [active, setActive] = useState(0);
  const prefersReduced = useReducedMotion();
  const regionRef = useRef<HTMLElement>(null);

  const total = items.length;

  const go = useCallback(
    (dir: 1 | -1) => setActive((i) => (i + dir + total) % total),
    [total],
  );

  useEffect(() => {
    const el = regionRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen(items[active]);
      }
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [active, go, items, onOpen]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -DRAG_THRESHOLD) go(1);
    else if (info.offset.x > DRAG_THRESHOLD) go(-1);
  }

  const activeItem = items[active];

  return (
    <section
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={heading ?? 'Videos'}
      tabIndex={0}
      style={{ outline: 'none', userSelect: 'none' }}
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {activeItem.title}, {activeItem.category}, item {active + 1} of {total}
      </div>

      {/* 3D stage */}
      <div
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
          height: `${CARD_W * 0.58 + 80}px`,
          position: 'relative',
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transformStyle: 'preserve-3d',
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
        >
          {items.map((item, i) => {
            const offset = i - active;
            const absOff = Math.abs(offset);
            const isActive = offset === 0;

            const rotateY = prefersReduced ? 0 : Math.max(-60, Math.min(60, offset * 40));
            const translateX = offset * (CARD_W + CARD_GAP);
            const translateZ = prefersReduced ? 0 : -absOff * 90;
            const scale = 1 - absOff * 0.1;
            const opacity = Math.max(0, 1 - absOff * 0.35);

            return (
              <motion.div
                key={item.id}
                style={{
                  position: 'absolute',
                  width: CARD_W,
                  transformStyle: 'preserve-3d',
                  cursor: isActive ? 'pointer' : 'default',
                }}
                animate={{
                  x: translateX,
                  rotateY,
                  z: translateZ,
                  scale,
                  opacity,
                }}
                transition={{ duration: 0.4, ease: EASE }}
                onClick={isActive ? () => onOpen(item) : () => go(offset > 0 ? 1 : -1)}
                role={isActive ? 'button' : undefined}
                aria-label={isActive ? `Play: ${item.title}` : undefined}
                tabIndex={isActive ? 0 : -1}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnailSrc}
                    alt={item.thumbnailAlt ?? item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {item.duration && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '0.375rem',
                        right: '0.375rem',
                        background: 'rgba(14,21,48,0.85)',
                        color: 'var(--white, #fff)',
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.375rem',
                      }}
                    >
                      {item.duration}
                    </span>
                  )}
                  {/* Play icon on active */}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(14,21,48,0.22)',
                        transition: 'background 160ms ease',
                      }}
                    >
                      <div
                        style={{
                          width: 0,
                          height: 0,
                          borderTop: '14px solid transparent',
                          borderBottom: '14px solid transparent',
                          borderLeft: '24px solid var(--white, #fff)',
                          marginLeft: '4px',
                        }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Active item info */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '1.25rem',
          color: 'var(--navy-900, #0E1530)',
        }}
      >
        <p style={{ fontSize: '0.8125rem', opacity: 0.6, marginBottom: '0.25rem' }}>
          {activeItem.category}
        </p>
        <p style={{ fontFamily: 'var(--fd)', fontSize: '1.0625rem', lineHeight: 1.2 }}>
          {activeItem.title}
        </p>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        <button onClick={() => go(-1)} aria-label="Previous video" style={ctrlStyle}>←</button>
        <span style={{ fontSize: '0.8125rem', opacity: 0.55 }}>{active + 1} / {total}</span>
        <button onClick={() => go(1)} aria-label="Next video" style={ctrlStyle}>→</button>
      </div>
    </section>
  );
}

const ctrlStyle: React.CSSProperties = {
  width: '2rem',
  height: '2rem',
  background: 'var(--navy-900, #0E1530)',
  color: 'var(--white, #fff)',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.9375rem',
  transition: 'background-color 160ms ease',
};
