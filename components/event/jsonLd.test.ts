import { test } from 'node:test'
import assert from 'node:assert/strict'
import { eventJsonLd, jsonLdString } from './jsonLd.ts'
import type { PublicEvent } from '@gyn/core/event-store'

const ev = {
  slug: 'sism-2026', name: 'SISM </script><b>2026', city: 'Kuala Lumpur', country: 'Malaysia', timing: 'upcoming',
  details: { startsAt: '2026-11-19', endsAt: '2026-11-22', venue: 'APU' },
  content: { hero: { photos: [{ src: '/media/a.jpg', alt: '' }] } },
  categories: [
    { name: 'Forum Access', feeCents: 19900, currency: 'USD', open: true, closesAt: new Date('2026-11-10T00:00:00Z') },
    { name: 'Closed one', feeCents: 100, currency: 'USD', open: false, closesAt: null },
  ],
} as unknown as PublicEvent

test('event JSON-LD has the required fields and offers only for open categories', () => {
  const ld = eventJsonLd(ev, 'https://thegyn.org') as Record<string, any>
  assert.equal(ld['@type'], 'Event')
  assert.equal(ld.startDate, '2026-11-19')
  assert.equal(ld.image[0], 'https://thegyn.org/media/a.jpg')
  assert.equal(ld.offers.length, 1)
  assert.equal(ld.offers[0].price, '199.00')
  assert.equal(ld.url, 'https://thegyn.org/sism-2026')
})

test('past events have no offers', () => {
  const ld = eventJsonLd({ ...ev, timing: 'past' }, 'https://thegyn.org')
  assert.equal('offers' in ld, false)
})

test('the script text never contains "<" and parses back to the same data', () => {
  const ld = eventJsonLd(ev, 'https://thegyn.org')
  const text = jsonLdString(ld)
  assert.ok(!text.includes('<'))
  assert.deepEqual(JSON.parse(text), JSON.parse(JSON.stringify(ld)))
})
