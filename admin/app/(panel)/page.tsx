import type { Metadata } from 'next'
import { requirePrisma } from '@gyn/core/db'
import { can } from '@gyn/core/permissions'
import { requireSession } from '@/lib/auth'
import { Forbidden } from './Forbidden'
import styles from './panel.module.css'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default async function DashboardPage() {
  const session = await requireSession()
  if (!can(session.permissions, 'dashboard.view')) return <Forbidden />

  const prisma = requirePrisma()
  const now = new Date()
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const day = 24 * 3600 * 1000
  const ranges = [
    { label: 'Today', from: new Date(today), to: new Date(today + day) },
    { label: 'Yesterday', from: new Date(today - day), to: new Date(today) },
    { label: 'Last 30 days', from: new Date(now.getTime() - 30 * day), to: new Date(now.getTime() + 1) },
    { label: 'Total', from: undefined, to: undefined },
  ]
  // Only verified payments count (status PAID). Money is in USD for now; other currencies are reported separately in phase 9.
  const stats = await Promise.all(
    ranges.map(async (r) => {
      const agg = await prisma.payment.aggregate({
        where: { status: 'PAID', currency: 'USD', ...(r.from ? { paidAt: { gte: r.from, lt: r.to } } : {}) },
        _sum: { amountCents: true },
        _count: true,
      })
      return { ...r, revenue: (agg._sum.amountCents ?? 0) / 100, paid: agg._count }
    }),
  )
  const [registrations, events] = await Promise.all([prisma.registration.count(), prisma.event.count({ where: { deletedAt: null } })])

  return (
    <>
      <h1>Dashboard</h1>
      <p className={styles.small}>Signed in as {session.user.email}. Days are shown in UTC until the site time zone setting is added (phase 9).</p>
      <section aria-label="Revenue" className={styles.cards}>
        {stats.map((s) => (
          <div key={s.label} className={styles.card}>
            <h2>{s.label}</h2>
            <div className={styles.big}>{usd.format(s.revenue)}</div>
            <div className={styles.small}>{s.paid} paid {s.paid === 1 ? 'registration' : 'registrations'}</div>
          </div>
        ))}
      </section>
      <div className={styles.box}>
        <p>
          {registrations === 0
            ? 'No registrations yet. The numbers above are real: they read the payments table, which is empty until forms and payments are built (phases 5 to 7).'
            : `${registrations} registrations across ${events} events.`}
        </p>
        <p className={styles.small}>Your role: {session.roleName}. The menu on the left shows only what this role may open.</p>
      </div>
    </>
  )
}
