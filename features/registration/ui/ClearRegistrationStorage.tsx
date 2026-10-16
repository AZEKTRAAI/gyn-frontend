'use client'

import { useEffect } from 'react'
import type { TicketId } from '@/features/registration/schema'

/**
 * Clears the saved registration form from localStorage when the user reaches
 * the confirmation page. Import and render in /sism-2026/registered/page.tsx.
 * Must receive the ticket id from the URL search param.
 */
export function ClearRegistrationStorage({ ticket }: { ticket: TicketId | null }) {
  useEffect(() => {
    if (!ticket) return
    try {
      localStorage.removeItem(`sism-reg-${ticket}`)
    } catch { /* private browsing / quota */ }
  }, [ticket])

  return null
}
