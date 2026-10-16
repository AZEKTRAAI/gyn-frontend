'use client';

/**
 * DeckSlider — stack of photo cards for speakers / advisors.
 * Drag to throw with velocity-based dismiss; spring return if under threshold.
 * Next card rises from behind the active card.
 * Prev/Next buttons + keyboard (ArrowLeft/Right when focused).
 * List fallback via <ol> for screen readers.
 *
 * WAI-ARIA: region + aria-roledescription="carousel", slide labels.
 *
 * Technique: motion drag with dragConstraints + velocity check on dragEnd.
 *            Scale/y offset for stacked depth effect.
 * Source: Emil Kowalski drag/momentum pattern (animations.dev);
 *         velocity-based dismiss from Sonner/Vaul (own impl, MIT concept).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
  type PanInfo,
} from 'motion/react';

// Velocity threshold in px/s — fast flick counts as dismiss
const VELOCITY_THRESHOLD = 500;
const DRAG_THRESHOLD = 80;

export interface Speaker {
  id: string;
  name: string;
  role: string;
  organisation: string;
  imageSrc: string;
  imageAlt?: string;
  /** Short bio or talk title */
  topic?: string;
}

export interface DeckSliderProps {
  items: Speaker[];
  /** Heading above the deck */
  heading?: string;
}

// How many cards are visible in the stack (the ones behind)
const VISIBLE_BEHIND = 2;

export function DeckSlider({ items, heading }: DeckSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReduced = useReducedMotion();
  const regionRef = useRef<HTMLElement>(null);

  const total = items.length;

  const advance = useCallback(
    (dir: 1 | -1) => {
      setActiveIndex((i) => (i + dir + total) % total);
    },
    [total],
  );

  useEffect(() => {
    const el = regionRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); advance(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); advance(-1); }
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [advance]);

  // Build the visible stack: activeIndex is on top, then -1, -2, ...
  const visibleCards = Array.from({ length: VISIBLE_BEHIND + 1 }, (_, i) => {
    const idx = (activeIndex - i + total) % total;
    return { idx, depth: i };
  });

  const active = items[activeIndex];

  return (
    <section
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={heading ?? 'Speakers'}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {/* Screen-reader list fallback */}
      <ol className="sr-only" aria-label={heading ?? 'Speakers'}>
        {items.map((s, i) => (
          <li key={s.id} aria-current={i === activeIndex ? 'true' : undefined}>
            {s.name}, {s.role}, {s.organisation}
            {s.topic ? `. ${s.topic}` : ''}
          </li>
        ))}
      </ol>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {active.name}, {active.role}, slide {activeIndex + 1} of {total}
      </div>

      {/* ── Visual deck ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'relative',
          width: 'min(100%, 320px)',
          aspectRatio: '3/4',
          margin: '0 auto',
        }}
      >
        {/* Render stack from back to front so top card gets pointer events */}
        {[...visibleCards].reverse().map(({ idx, depth }) => (
          <DeckCard
            key={items[idx].id}
            item={items[idx]}
            depth={depth}
            isActive={depth === 0}
            prefersReduced={!!prefersReduced}
            onDismiss={() => advance(1)}
          />
        ))}
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
        <button
          onClick={() => advance(-1)}
          aria-label="Previous speaker"
          style={ctrlStyle}
        >
          ←
        </button>
        <span style={{ fontSize: '0.8125rem', opacity: 0.6 }}>
          {activeIndex + 1} / {total}
        </span>
        <button
          onClick={() => advance(1)}
          aria-label="Next speaker"
          style={ctrlStyle}
        >
          →
        </button>
      </div>
    </section>
  );
}

// ─── Individual card ──────────────────────────────────────────────────────────

interface DeckCardProps {
  item: Speaker;
  depth: number;
  isActive: boolean;
  prefersReduced: boolean;
  onDismiss: () => void;
}

function DeckCard({ item, depth, isActive, prefersReduced, onDismiss }: DeckCardProps) {
  const x = useMotionValue(0);
  // Subtle rotation tied to drag x
  const rotate = useTransform(x, [-200, 200], [-12, 12]);

  // Stack offset — each layer sits slightly lower and smaller behind the top
  const yOffset = depth * 12;
  const scale = 1 - depth * 0.045;
  const zIndex = 10 - depth;

  function handleDragEnd(_: unknown, info: PanInfo) {
    const { offset, velocity } = info;
    const shouldDismiss =
      Math.abs(offset.x) > DRAG_THRESHOLD ||
      Math.abs(velocity.x) > VELOCITY_THRESHOLD;
    if (shouldDismiss) {
      onDismiss();
    }
    // If not dismissed, motion's drag will spring back automatically
    // because we didn't set a final position
  }

  if (prefersReduced) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateY(${yOffset}px) scale(${scale})`,
          zIndex,
          background: 'var(--navy-800, #16204A)',
          overflow: 'hidden',
        }}
      >
        <CardContent item={item} isActive={isActive} />
      </div>
    );
  }

  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        x: isActive ? x : 0,
        rotate: isActive ? rotate : 0,
        y: yOffset,
        scale,
        background: 'var(--navy-800, #16204A)',
        overflow: 'hidden',
        cursor: isActive ? 'grab' : 'default',
        touchAction: 'none',
      }}
      initial={{ y: yOffset, scale, opacity: depth > VISIBLE_BEHIND ? 0 : 1 }}
      animate={{
        y: yOffset,
        scale,
        // New cards rising from behind: start more offset
        opacity: depth > VISIBLE_BEHIND ? 0 : 1,
      }}
      transition={{ type: 'spring', duration: 0.5, bounce: 0.18 }}
      drag={isActive ? 'x' : false}
      dragConstraints={{ left: -300, right: 300 }}
      dragElastic={0.15}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
    >
      <CardContent item={item} isActive={isActive} />
    </motion.div>
  );
}

function CardContent({ item, isActive }: { item: Speaker; isActive: boolean }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.imageSrc}
        alt={item.imageAlt ?? item.name}
        style={{
          width: '100%',
          height: '70%',
          objectFit: 'cover',
          objectPosition: 'center top',
          display: 'block',
          opacity: isActive ? 1 : 0.6,
          transition: 'opacity 240ms ease',
        }}
      />
      <div
        style={{
          padding: '1rem',
          color: 'var(--white, #fff)',
        }}
      >
        <p style={{ fontFamily: 'var(--fd)', fontSize: '1.0625rem', lineHeight: 1.2 }}>
          {item.name}
        </p>
        <p style={{ fontSize: '0.8125rem', opacity: 0.7, marginTop: '0.25rem' }}>
          {item.role} · {item.organisation}
        </p>
        {item.topic && isActive && (
          <p style={{ fontSize: '0.8125rem', marginTop: '0.5rem', opacity: 0.85 }}>
            {item.topic}
          </p>
        )}
      </div>
    </>
  );
}

const ctrlStyle: React.CSSProperties = {
  width: '2.25rem',
  height: '2.25rem',
  background: 'var(--navy-900, #0E1530)',
  color: 'var(--white, #fff)',
  border: '1px solid rgba(255,255,255,0.2)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1rem',
  transition: 'background-color 160ms ease',
  flexShrink: 0,
};
