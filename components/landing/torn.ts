/**
 * A CSS clip-path polygon with slightly ragged edges, for torn-paper photo frames.
 * Seeded, so the server and every visit draw the same shape (no hydration mismatch, no layout change).
 */
export function tornPolygon(seed: number, steps = 14, depth = 2.4): string {
  let x = seed % 233280
  const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280
  const p = (a: number, b: number) => `${a.toFixed(1)}% ${b.toFixed(1)}%`
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) pts.push(p((i / steps) * 100, rnd() * depth))
  for (let i = 1; i <= steps; i++) pts.push(p(100 - rnd() * depth, (i / steps) * 100))
  for (let i = steps - 1; i >= 0; i--) pts.push(p((i / steps) * 100, 100 - rnd() * depth))
  for (let i = steps - 1; i >= 1; i--) pts.push(p(rnd() * depth, (i / steps) * 100))
  return `polygon(${pts.join(', ')})`
}
