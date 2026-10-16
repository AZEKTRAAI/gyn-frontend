'use client';

/**
 * PageTransition — vertical curtain in SDG blue/yellow on route change.
 * Mechanism: injects ::view-transition CSS once, then wraps Next Link
 * in startViewTransition where available. No-op on unsupported browsers.
 *
 * Two exports:
 *   <ViewTransitionStyles />  — place once in root layout, inside <head> or adjacent.
 *   <TransitionLink />        — drop-in replacement for next/link.
 *
 * Source: MDN View Transitions API; Next.js App Router navigation pattern.
 * No third-party code used.
 */

import { useCallback, useEffect } from 'react';
import Link, { type LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';

// ─── CSS ─────────────────────────────────────────────────────────────────────

const TRANSITION_CSS = `
  /* Outgoing page: wipe upward */
  @keyframes gyn-page-out {
    from { clip-path: inset(0 0 0 0); }
    to   { clip-path: inset(100% 0 0 0); }
  }
  /* Incoming page: reveal downward */
  @keyframes gyn-page-in {
    from { clip-path: inset(0 0 100% 0); }
    to   { clip-path: inset(0 0 0 0); }
  }
  ::view-transition-old(root) {
    animation: gyn-page-out 380ms cubic-bezier(0.23, 1, 0.32, 1) both;
    /* SDG-14 ocean blue as curtain colour */
    background: #0A97D9;
  }
  ::view-transition-new(root) {
    animation: gyn-page-in 380ms cubic-bezier(0.23, 1, 0.32, 1) both;
  }
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation: none;
    }
  }
`;

/**
 * Inject the view-transition CSS into <head> once per mount.
 * Place in the root layout.
 */
export function ViewTransitionStyles() {
  useEffect(() => {
    const id = 'gyn-vt-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = TRANSITION_CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
  return null;
}

// ─── TransitionLink ───────────────────────────────────────────────────────────

type TransitionLinkProps = LinkProps & {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
};

/**
 * Drop-in for <Link>. Calls document.startViewTransition when supported,
 * then pushes the route. Falls back to plain navigation on unsupported browsers.
 */
export function TransitionLink({
  href,
  children,
  className,
  ...rest
}: TransitionLinkProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Let browser handle modifier-key clicks (open in tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // External links: let the browser handle normally
      const target = typeof href === 'string' ? href : href.pathname ?? '';
      if (target.startsWith('http') || target.startsWith('//')) return;

      e.preventDefault();
      const dest = typeof href === 'string' ? href : String(href.pathname ?? '/');

      // Read reduced-motion preference fresh in the handler — avoids a state subscription
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (
        !prefersReduced &&
        typeof document !== 'undefined' &&
        'startViewTransition' in document
      ) {
        document.startViewTransition(() => {
          router.push(dest);
        });
      } else {
        router.push(dest);
      }
    },
    [href, router],
  );

  return (
    <Link href={href} {...rest} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
