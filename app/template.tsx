import { ViewTransition } from 'react'

// A template remounts on every navigation, so this boundary gets an exit/enter pair on each route change.
// The animation (new page opens as a circle from the centre, header stays put) lives in globals.css.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  )
}
