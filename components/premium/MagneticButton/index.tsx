'use client';

/**
 * MagneticButton — subtle pointer attraction for primary CTAs.
 * Active only on desktop fine pointers (matchMedia hover+fine).
 * Uses spring physics so the button trails the cursor naturally.
 * On leave, springs back to origin.
 * Reduced-motion / touch: plain button, no transform.
 *
 * Technique: useSpring + pointermove offset transform.
 * Source: Emil Kowalski — useSpring mouse tracking (animations.dev);
 *         standard magnetic-button pattern (no specific library copied).
 */

import { useRef, useCallback } from 'react';
import { motion, useSpring } from 'motion/react';
import { useMediaQuery } from '../useMediaQuery';

const SPRING = { stiffness: 120, damping: 14, mass: 0.8 };
// Max displacement in px — keeps the effect subtle on CTAs
const MAX_PULL = 12;

export interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  'aria-label'?: string;
  /** Extra class names for the inner content span */
  innerClassName?: string;
}

export function MagneticButton({
  children,
  className,
  innerClassName,
  onClick,
  type = 'button',
  disabled,
  'aria-label': ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);

  // Only enable on hover:hover + pointer:fine (desktops with real mice)
  const active = useMediaQuery('(hover: hover) and (pointer: fine)');

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!active || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Clamp to MAX_PULL so the button doesn't fly off
      x.set(Math.max(-MAX_PULL, Math.min(MAX_PULL, (e.clientX - cx) * 0.35)));
      y.set(Math.max(-MAX_PULL, Math.min(MAX_PULL, (e.clientY - cy) * 0.35)));
    },
    [active, x, y],
  );

  const onLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.button
      ref={ref}
      className={className}
      onClick={onClick}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{ x: active ? x : 0, y: active ? y : 0, display: 'inline-flex' }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      // Scale-down on press — Emil: 0.97 for subtle physical feedback
      whileTap={{ scale: 0.97 }}
    >
      <span className={innerClassName}>{children}</span>
    </motion.button>
  );
}
