import { notFound } from 'next/navigation'
import { can } from '@gyn/core/permissions'
import { requireSession } from '@/lib/auth'
import { MODULES } from '@/lib/modules'
import { Forbidden } from '../Forbidden'
import styles from '../panel.module.css'

export const dynamic = 'force-dynamic'

// Every module that is planned but not built yet. It says what will be here and in which phase, instead of a blank page or a 404.
export default async function ComingSoonPage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params
  const mod = MODULES.find((m) => m.href === `/${module}` && !m.built)
  if (!mod) notFound()
  const session = await requireSession()
  if (!can(session.permissions, mod.permission)) return <Forbidden />
  return (
    <div className={styles.box}>
      <h1>{mod.label}</h1>
      <p>{mod.about}</p>
      <p className={styles.small}>Not built yet. It is part of phase {mod.phase} in docs/backend-plan.md.</p>
    </div>
  )
}
