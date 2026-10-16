'use client';

/**
 * TicketRail — ticket tiers as a scroll-snap rail on mobile,
 * static row on desktop (≥768px). Price stays the largest element.
 * Active-tier highlighted with a border in --yellow; neighbours peek.
 *
 * WAI-ARIA: list + listitem. No carousel role needed — static list on desktop,
 * scroll container on mobile (native browser scroll, no JS carousel).
 * Reduced-motion: no transition on indicator.
 *
 * Source: native CSS scroll-snap — no library needed.
 */

import { useRef, useState, useCallback } from 'react';
import { useReducedMotion } from 'motion/react';

export interface Tier {
  id: string;
  name: string;
  price: string;
  /** e.g. "$199" or "Fully funded" */
  priceLabel?: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  /** Highlight this tier as recommended */
  featured?: boolean;
  /** Tier is sold out / closed — disable CTA */
  closed?: boolean;
}

export interface TicketRailProps {
  tiers: Tier[];
  /** Index of initially active tier on mobile. Default: first featured or 0 */
  defaultActive?: number;
}

export function TicketRail({ tiers, defaultActive }: TicketRailProps) {
  const initialActive =
    defaultActive ??
    Math.max(
      0,
      tiers.findIndex((t) => t.featured),
    );
  const [active, setActive] = useState(initialActive);
  const railRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // Scroll the active card into view on mobile when active changes
  const scrollToCard = useCallback(
    (idx: number) => {
      setActive(idx);
      if (!railRef.current) return;
      const card = railRef.current.children[idx] as HTMLElement | undefined;
      if (!card) return;
      card.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    },
    [prefersReduced],
  );

  // Update active index when user scrolls (IntersectionObserver approach)
  // shortcut: uses scroll event only while dragging; good enough for a rail, upgrade to IO if needed
  const onScroll = useCallback(() => {
    if (!railRef.current) return;
    const rail = railRef.current;
    const cardWidth = rail.scrollWidth / tiers.length;
    const idx = Math.round(rail.scrollLeft / cardWidth);
    setActive(Math.min(Math.max(idx, 0), tiers.length - 1));
  }, [tiers.length]);

  return (
    <div>
      {/* ── Mobile: scroll-snap rail ── */}
      {/* Desktop: display:flex row via Tailwind md:hidden / md:flex  */}
      <div
        ref={railRef}
        role="list"
        aria-label="Participation tiers"
        onScroll={onScroll}
        style={{
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollPaddingInline: '1.5rem',
          paddingInline: '1.5rem',
          paddingBlock: '0.5rem',
          /* Hide scrollbar visually; still scrollable */
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
        className="md:overflow-x-visible md:flex-wrap md:justify-center"
      >
        {tiers.map((tier, i) => (
          <article
            key={tier.id}
            role="listitem"
            aria-current={i === active ? 'true' : undefined}
            style={{
              flex: '0 0 min(78vw, 320px)',
              scrollSnapAlign: 'center',
              border: `2px solid ${i === active ? 'var(--yellow, #FCC30B)' : 'var(--n-200, #DCDCD5)'}`,
              transition: prefersReduced
                ? 'none'
                : 'border-color 200ms cubic-bezier(0.23,1,0.32,1)',
              padding: '1.5rem',
              background: tier.featured ? 'var(--navy-900, #0E1530)' : 'var(--white, #fff)',
              color: tier.featured ? 'var(--white, #fff)' : 'var(--navy-900, #0E1530)',
            }}
            className="md:flex-1 md:min-w-[220px] md:max-w-xs"
            onClick={() => scrollToCard(i)}
          >
            <p
              style={{
                fontFamily: 'var(--fd)',
                fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                lineHeight: 1,
                marginBottom: '0.25rem',
                color: tier.featured ? 'var(--yellow, #FCC30B)' : 'inherit',
              }}
              aria-label={`Price: ${tier.price}`}
            >
              {tier.price}
            </p>
            {tier.priceLabel && (
              <p style={{ fontSize: '0.8125rem', opacity: 0.7, marginBottom: '0.75rem' }}>
                {tier.priceLabel}
              </p>
            )}
            <h3
              style={{
                fontFamily: 'var(--fd)',
                fontSize: '1.125rem',
                lineHeight: 1.2,
                marginBottom: '0.5rem',
              }}
            >
              {tier.name}
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1rem', opacity: 0.85 }}>
              {tier.description}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
              {tier.features.map((f, fi) => (
                <li
                  key={fi}
                  style={{
                    fontSize: '0.8125rem',
                    paddingBlock: '0.25rem',
                    borderTop: '1px solid currentColor',
                    opacity: 0.7,
                  }}
                >
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={tier.ctaHref}
              aria-disabled={tier.closed}
              tabIndex={tier.closed ? -1 : undefined}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '0.625rem 1rem',
                background: tier.closed
                  ? 'var(--n-200, #DCDCD5)'
                  : tier.featured
                    ? 'var(--yellow, #FCC30B)'
                    : 'var(--navy-900, #0E1530)',
                color: tier.closed
                  ? 'var(--n-600, #5A5A55)'
                  : tier.featured
                    ? 'var(--navy-900, #0E1530)'
                    : 'var(--white, #fff)',
                fontWeight: 600,
                fontSize: '0.9375rem',
                cursor: tier.closed ? 'default' : 'pointer',
                pointerEvents: tier.closed ? 'none' : 'auto',
                textDecoration: 'none',
                transition: 'background-color 160ms ease',
              }}
            >
              {tier.closed ? 'Closed' : tier.cta}
            </a>
          </article>
        ))}
      </div>

      {/* Active-tier dots — mobile only */}
      <div
        aria-hidden="true"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.375rem',
          marginTop: '0.75rem',
        }}
        className="md:hidden"
      >
        {tiers.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToCard(i)}
            style={{
              width: i === active ? '1.5rem' : '0.375rem',
              height: '0.375rem',
              borderRadius: '999px',
              background:
                i === active ? 'var(--blue-ocean, #0A97D9)' : 'var(--n-200, #DCDCD5)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: prefersReduced
                ? 'none'
                : 'width 240ms cubic-bezier(0.23,1,0.32,1), background-color 240ms ease',
            }}
            aria-label={`Go to tier ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
