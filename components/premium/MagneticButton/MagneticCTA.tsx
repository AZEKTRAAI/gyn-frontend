'use client'

/**
 * MagneticCTA — server renders a plain <a>, then upgrades to the magnetic
 * spring version after requestIdleCallback on (hover:hover) and (pointer:fine)
 * devices only. Phones never load motion/react.
 *
 * Usage: load this file via next/dynamic({ ssr: false }) in page.tsx.
 * A plain <a> SSR fallback must be rendered alongside in the server component.
 */
import { useState, useEffect } from 'react'
import type { MagneticButtonProps } from './index'

interface Props extends MagneticButtonProps {
  href: string
  children: React.ReactNode
  className?: string
}

export default function MagneticCTA({ href, children, className, ...rest }: Props) {
  const [Mag, setMag] = useState<React.ComponentType<MagneticButtonProps> | null>(null)

  useEffect(() => {
    // Only worth loading on fine-pointer devices (desktops with a real mouse)
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return

    const load = () =>
      import('./index').then((m) => setMag(() => m.MagneticButton))

    if ('requestIdleCallback' in window) {
      requestIdleCallback(load)
    } else {
      setTimeout(load, 300)
    }
  }, [])

  if (Mag) return <Mag href={href} className={className} {...rest}>{children}</Mag>
  // Plain anchor while motion chunk is not yet loaded
  return <a href={href} className={className}>{children}</a>
}
