'use client';

/**
 * SummitSwitcher — full-width slide set for multiple summits.
 * Switching mechanism:
 *   1. A colour-filled div animates clip-path from inset(0 100% 0 0) → inset(0 0 0 0)
 *      creating a horizontal wipe in the incoming summit's accent colour.
 *   2. The incoming image scales from 1.08 → 1.0 (zoom-settle).
 *   3. Title lines slide in from beneath a mask (SplitReveal technique inline).
 * Autoplay off by default. Keyboard: ArrowLeft/Right. Buttons.
 *
 * WAI-ARIA carousel pattern:
 *   region + aria-roledescription="carousel"
 *   slide labels "N of M"
 *   aria-live="polite" for auto-announce
 *
 * Technique: clip-path wipe + AnimatePresence directional variants.
 * Source: Emil Kowalski clip-path inset pattern; Codrops "Shape Slideshow"
 *         concept (own implementation, no code copied).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'motion/react';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const DUR = 0.62; // seconds

export interface Summit {
  id: string;
  /** Short name shown in the tab/button */
  label: string;
  /** Full headline — shown line by line */
  title: string[];
  /** Subtitle / location + date */
  meta: string;
  /** Hero image path */
  imageSrc: string;
  imageAlt: string;
  /** Accent colour used for the wipe curtain (one of our SDG palette colours) */
  accentColor: string;
  /** Text colour on accentColor background */
  accentText?: string;
  cta: { label: string; href: string };
  /** "Past" | "Next" | "Live" */
  status: string;
}

export interface SummitSwitcherProps {
  summits: Summit[];
  /** Enable autoplay. Default false. */
  autoplay?: boolean;
  /** Autoplay interval ms. Default 6000. */
  autoplayInterval?: number;
}

export function SummitSwitcher({
  summits,
  autoplay = false,
  autoplayInterval = 6000,
}: SummitSwitcherProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const prefersReduced = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const regionRef = useRef<HTMLElement>(null);

  const go = useCallback(
    (next: number, dir: 1 | -1) => {
      setDirection(dir);
      setCurrent((next + summits.length) % summits.length);
    },
    [summits.length],
  );

  const prev = useCallback(() => go(current - 1, -1), [current, go]);
  const next = useCallback(() => go(current + 1, 1), [current, go]);

  // Keyboard navigation — only when the carousel region is focused
  useEffect(() => {
    const el = regionRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [prev, next]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || prefersReduced) return;
    timerRef.current = setTimeout(() => go(current + 1, 1), autoplayInterval);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [autoplay, autoplayInterval, current, go, prefersReduced]);

  const summit = summits[current];

  // Variants for the full slide (reduced-motion: just opacity)
  const slideVariants = prefersReduced
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        // Slide enters from the right (or left when direction=-1)
        enter: (d: number) => ({
          clipPath: d > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)',
          opacity: 0,
        }),
        center: { clipPath: 'inset(0 0 0 0%)', opacity: 1 },
        exit: (d: number) => ({
          clipPath: d > 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)',
          opacity: 0,
        }),
      };

  const titleLineVariants = prefersReduced
    ? {
        hidden: { opacity: 0 },
        visible: (i: number) => ({ opacity: 1, transition: { delay: i * 0.05 } }),
      }
    : {
        hidden: { y: '105%', opacity: 0 },
        visible: (i: number) => ({
          y: '0%',
          opacity: 1,
          transition: { duration: 0.44, delay: 0.22 + i * 0.07, ease: EASE },
        }),
      };

  return (
    <section
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Summit overview"
      // Makes the region focusable for keyboard nav
      tabIndex={0}
      style={{ position: 'relative', width: '100%', overflow: 'hidden', outline: 'none' }}
      // Focus ring only on keyboard focus
      onFocus={(e) => {
        if (e.target === e.currentTarget) {
          e.currentTarget.style.outline = '3px solid var(--yellow, #FCC30B)';
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      {/* Live region for screen-reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {summit.title.join(' ')}, {summit.meta}, slide {current + 1} of {summits.length}
      </div>

      {/* ── Slide stack ── */}
      <div style={{ position: 'relative', aspectRatio: '16/7', minHeight: '480px' }}>
        <AnimatePresence custom={direction} initial={false} mode="sync">
          <motion.div
            key={summit.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: DUR, ease: EASE }}
            style={{
              position: 'absolute',
              inset: 0,
              background: summit.accentColor,
            }}
            aria-roledescription="slide"
            aria-label={`${current + 1} of ${summits.length}: ${summit.label}`}
          >
            {/* Background image with scale-settle */}
            <motion.div
              initial={{ scale: prefersReduced ? 1 : 1.07 }}
              animate={{ scale: 1 }}
              transition={{ duration: DUR * 1.2, ease: EASE }}
              style={{ position: 'absolute', inset: 0 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={summit.imageSrc}
                alt={summit.imageAlt}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* Photo scrim — one per slide, left-to-right */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  /* scrim */
                  background:
                    'linear-gradient(90deg, rgba(14,21,48,0.82) 0%, rgba(14,21,48,0.35) 60%, transparent 100%)',
                }}
              />
            </motion.div>

            {/* Content */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: 'clamp(1.5rem, 5vw, 4rem)',
                color: 'var(--white, #fff)',
              }}
            >
              <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', opacity: 0.8 }}>
                {summit.status}
              </p>
              {/* Title lines — mask reveal */}
              <h2
                style={{
                  fontFamily: 'var(--fd)',
                  fontSize: 'clamp(1.75rem, 4vw, 3.5rem)',
                  lineHeight: 1.06,
                  marginBottom: '1rem',
                }}
                aria-label={summit.title.join(' ')}
              >
                {summit.title.map((line, i) => (
                  <span
                    key={i}
                    style={{ display: 'block', overflow: 'hidden', lineHeight: 'inherit' }}
                    aria-hidden="true"
                  >
                    <motion.span
                      style={{ display: 'block' }}
                      custom={i}
                      variants={titleLineVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {line}
                    </motion.span>
                  </span>
                ))}
              </h2>
              <p style={{ fontSize: '1rem', opacity: 0.75, marginBottom: '1.5rem' }}>{summit.meta}</p>
              <a
                href={summit.cta.href}
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.625rem 1.5rem',
                  background: 'var(--yellow, #FCC30B)',
                  color: 'var(--navy-900, #0E1530)',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  textDecoration: 'none',
                  transition: 'background-color 160ms ease',
                }}
              >
                {summit.cta.label}
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Controls ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem clamp(1.5rem, 5vw, 4rem)',
          background: 'var(--navy-900, #0E1530)',
        }}
      >
        {/* Summit tab buttons */}
        <div role="tablist" aria-label="Select summit" style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
          {summits.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === current}
              aria-controls={`summit-slide-${s.id}`}
              onClick={() => go(i, i > current ? 1 : -1)}
              style={{
                padding: '0.375rem 0.875rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                background: i === current ? 'var(--yellow, #FCC30B)' : 'transparent',
                color: i === current ? 'var(--navy-900, #0E1530)' : 'var(--white, #fff)',
                border: `1px solid ${i === current ? 'var(--yellow, #FCC30B)' : 'rgba(255,255,255,0.25)'}`,
                cursor: 'pointer',
                transition: 'background-color 160ms ease, color 160ms ease, border-color 160ms ease',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        {/* Prev / Next */}
        <button
          onClick={prev}
          aria-label="Previous summit"
          style={navBtnStyle}
        >
          ←
        </button>
        <button
          onClick={next}
          aria-label="Next summit"
          style={navBtnStyle}
        >
          →
        </button>
      </div>
    </section>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: '2.25rem',
  height: '2.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  color: 'var(--white, #fff)',
  border: '1px solid rgba(255,255,255,0.25)',
  cursor: 'pointer',
  fontSize: '1rem',
  transition: 'background-color 160ms ease',
  flexShrink: 0,
};
