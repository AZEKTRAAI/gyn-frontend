'use client';

/**
 * SplitReveal — line-by-line mask reveal for section H2s.
 * Triggers once on first entry (IntersectionObserver via useInView).
 * Each line slides up from an overflow-hidden container ("curtain" pattern).
 * Reduced-motion: immediate opacity fade only.
 *
 * Technique: overflow-hidden wrapper + translateY reveal.
 * Inspired by: Codrops "Text Reveal on Scroll" patterns;
 *              Emil Kowalski clip-path inset approach (animations.dev).
 */

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';

// Strong ease-out — Emil skill: cubic-bezier(0.23, 1, 0.32, 1)
const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

export interface SplitRevealProps {
  /** Text to reveal. Separate lines with the newline character \n */
  lines: string[];
  /** HTML tag to render the wrapper as. Default: h2 */
  as?: 'h1' | 'h2' | 'h3' | 'p';
  /** Delay before animation starts (ms). Default 0 */
  delay?: number;
  /** Per-line stagger delay (ms). Default 70 */
  stagger?: number;
  className?: string;
}

export function SplitReveal({
  lines,
  as: Tag = 'h2',
  delay = 0,
  stagger = 70,
  className,
}: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);
  // once:true — fires exactly once per section mount, not per paragraph
  const inView = useInView(ref as React.RefObject<Element>, {
    once: true,
    margin: '-8% 0px',
  });
  const prefersReduced = useReducedMotion();

  const hiddenState = prefersReduced
    ? { opacity: 0 }
    : { opacity: 0, y: '100%' };

  const visibleState = prefersReduced
    ? { opacity: 1 }
    : { opacity: 1, y: '0%' };

  // Tag cast — motion wraps the same element via asChild pattern isn't needed;
  // we render Tag normally and wrap inner spans with motion.
  return (
    // @ts-expect-error — dynamic tag; ref type is narrowed at runtime
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        <span
          key={i}
          // overflow:hidden creates the mask; display:block required for height
          style={{ display: 'block', overflow: 'hidden', lineHeight: 'inherit' }}
          // Screen readers get the full text from the parent tag
          aria-hidden="true"
        >
          <motion.span
            style={{ display: 'block' }}
            initial={hiddenState}
            animate={inView ? visibleState : hiddenState}
            transition={{
              duration: prefersReduced ? 0.2 : 0.52,
              delay: (delay + i * stagger) / 1000,
              ease: EASE,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
      {/* Invisible full text for screen readers */}
      <span className="sr-only">{lines.join(' ')}</span>
    </Tag>
  );
}
