'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './panel.module.css'

export function NavLinks({ items }: { items: { href: string; label: string; built: boolean }[] }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin sections">
      <ul className={styles.nav}>
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? 'page' : undefined} className={active ? styles.active : undefined}>
                {item.label}
                {!item.built && <span className={styles.soon}>soon</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
