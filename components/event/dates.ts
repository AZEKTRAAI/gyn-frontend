// "19 to 22 Nov 2026": the event's days as the event's own time zone shows them (startsAt/endsAt are instants).
import { dateToLocal } from '@gyn/core/event-store'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function eventRange(startsAt: Date, endsAt: Date, timeZone: string): string {
  const [a, b] = [dateToLocal(startsAt, timeZone), dateToLocal(endsAt, timeZone)].map((ymd) => {
    const [y, m, d] = ymd.split('-').map(Number)
    return { y, m: MONTHS[m - 1], d }
  })
  if (a.y === b.y && a.m === b.m) return a.d === b.d ? `${a.d} ${a.m} ${a.y}` : `${a.d} to ${b.d} ${b.m} ${b.y}`
  if (a.y === b.y) return `${a.d} ${a.m} to ${b.d} ${b.m} ${b.y}`
  return `${a.d} ${a.m} ${a.y} to ${b.d} ${b.m} ${b.y}`
}
