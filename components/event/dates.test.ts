import { test } from 'node:test'
import assert from 'node:assert/strict'
import { eventRange } from './dates.ts'
import { eventDates } from '@gyn/core/event-store'

const range = (startsAt: string, endsAt: string, timezone: string) => {
  const d = eventDates({ startsAt, endsAt, timezone })
  return eventRange(d.startsAt, d.endsAt, timezone)
}

test('the range is read in the event time zone, not the server one', () => {
  assert.equal(range('2026-11-19', '2026-11-22', 'Asia/Kuala_Lumpur'), '19 to 22 Nov 2026')
  assert.equal(range('2026-11-19', '2026-11-19', 'Asia/Kuala_Lumpur'), '19 Nov 2026')
  assert.equal(range('2026-11-28', '2026-12-02', 'Asia/Bangkok'), '28 Nov to 2 Dec 2026')
  assert.equal(range('2026-12-30', '2027-01-02', 'Pacific/Auckland'), '30 Dec 2026 to 2 Jan 2027')
})
