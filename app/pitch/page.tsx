import type { Metadata } from 'next'
import fs from 'node:fs'
import path from 'node:path'
import { PitchClient } from './PitchClient'

export const metadata: Metadata = {
  title: 'thegyn.org – Redesign Demo',
  description: 'Pitch demo for the thegyn.org redesign.',
  robots: { index: false, follow: false },
}

interface LhScores { perf: number; a11y: number; bp: number; seo: number; date: string }

function readLhScores(name: string): LhScores {
  // read at build time from docs/lighthouse/*.report.json
  const jsonPath = path.join(process.cwd(), 'docs', 'lighthouse', `${name}.report.json`)
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    const cats = data.categories ?? {}
    return {
      perf: Math.round((cats.performance?.score ?? 0) * 100),
      a11y: Math.round((cats.accessibility?.score ?? 0) * 100),
      bp: Math.round((cats['best-practices']?.score ?? 0) * 100),
      seo: Math.round((cats.seo?.score ?? 0) * 100),
      date: new Date(data.fetchTime ?? Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    }
  } catch {
    return { perf: 0, a11y: 0, bp: 0, seo: 0, date: 'unknown' }
  }
}

export default function PitchPage() {
  const homeMobile = readLhScores('home-mobile')
  const homeDesktop = readLhScores('home-desktop')
  return <PitchClient lhHomeMobile={homeMobile} lhHomeDesktop={homeDesktop} />
}
