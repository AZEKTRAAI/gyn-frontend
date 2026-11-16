import { Fragment } from 'react'
import { accentRuns } from '@gyn/core/home-schema'

/** Renders "global *stage*." with the starred words highlighted: a lime marker on light backgrounds, lime text on dark ones. */
export function Accent({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <>
      {accentRuns(text).map((r, i) =>
        r.italic ? <em key={i} className={dark ? 'hl-dark' : 'hl'}>{r.text}</em> : <Fragment key={i}>{r.text}</Fragment>,
      )}
    </>
  )
}
