// No database: with DATABASE_URL unset the store serves content/event-pages/*.json. The database paths are in tests/integration/events.test.ts.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { eventPageSchema, EVENT_SECTIONS } from './event-schema.ts'
import {
  EVENT_SEEDS, EventStoreError, defaultEventContent, eventDates, getPublicEvent, listPublicEvents, mergeEventContent,
} from './event-store.ts'

delete process.env.DATABASE_URL

test('the seeded event files validate and every image in them exists', () => {
  assert.deepEqual(Object.keys(EVENT_SEEDS).sort(), ['fms-thailand', 'sism-2026'])
  for (const slug of Object.keys(EVENT_SEEDS)) {
    const text = fs.readFileSync(`content/event-pages/${slug}.json`, 'utf8')
    for (const m of text.matchAll(/"src": "([^"]+)"/g)) assert.ok(fs.existsSync(`public${m[1]}`), `${slug}: ${m[1]} is missing from public/`)
  }
  assert.equal(EVENT_SEEDS['fms-thailand'].content.ambassadors.hub.label, 'Bangkok')
  assert.equal(EVENT_SEEDS['sism-2026'].content.ambassadors.hub.label, 'Kuala Lumpur')
})

test('details are read as local dates: 00:00 on the first day, 23:59 on the last', () => {
  const kl = eventDates({ startsAt: '2026-11-19', endsAt: '2026-11-22', timezone: 'Asia/Kuala_Lumpur' })
  assert.equal(kl.startsAt.toISOString(), '2026-11-18T16:00:00.000Z')
  assert.equal(kl.endsAt.toISOString(), '2026-11-22T15:59:00.000Z')
  assert.equal(eventDates({ startsAt: '2026-07-16', endsAt: '2026-07-19', timezone: 'Asia/Bangkok' }).startsAt.toISOString(), '2026-07-15T17:00:00.000Z')
  assert.equal(eventDates({ startsAt: '2026-07-01', endsAt: '2026-07-01', timezone: 'Europe/London' }).startsAt.toISOString(), '2026-06-30T23:00:00.000Z') // summer time
  assert.throws(() => eventDates({ startsAt: '2026-07-01', endsAt: '2026-07-01', timezone: 'Mars/Olympus' }), EventStoreError)
})

test('a section that no longer fits falls back to the default; the others still load', () => {
  const defaults = EVENT_SEEDS['sism-2026'].content
  const log = console.error
  console.error = () => {}
  try {
    const merged = mergeEventContent(defaults, {
      cta: { visible: true, heading: 'Edited', text: '', primaryCta: { label: 'Go', href: '/x' }, secondaryCta: { label: '', href: '/' } },
      faq: { visible: 'yes please' },
      nonsense: 1,
    })
    assert.equal(merged.cta.heading, 'Edited')
    assert.deepEqual(merged.faq, defaults.faq)
    assert.ok(eventPageSchema.safeParse(merged).success)
  } finally {
    console.error = log
  }
})

test('new events start with the right sections showing', () => {
  const d = { ...EVENT_SEEDS['sism-2026'].details, navLabel: '' }
  const shown = (kind: 'past' | 'upcoming') => {
    const c = defaultEventContent(kind, d)
    assert.ok(eventPageSchema.safeParse(c).success)
    return EVENT_SECTIONS.filter((k) => 'visible' in c[k] && c[k].visible)
  }
  assert.deepEqual(shown('past'), ['highlights', 'overview', 'ambassadors', 'chapters', 'schedule', 'speakers', 'gallery', 'videos', 'stories', 'cta'])
  assert.deepEqual(shown('upcoming'), ['highlights', 'overview', 'categories', 'schedule', 'speakers', 'faq', 'cta'])
})

test('without a database the public readers serve the seed', async () => {
  const list = await listPublicEvents()
  assert.deepEqual(list.map((e) => e.slug).sort(), ['fms-thailand', 'sism-2026'])
  assert.equal(list.find((e) => e.slug === 'fms-thailand')!.timing, 'past')
  assert.equal(await getPublicEvent('nope'), null)
  const sism = (await getPublicEvent('sism-2026'))!
  assert.equal(sism.categories.find((c) => c.slug === 'fully-funded')!.open, false)
  assert.equal(sism.categories.find((c) => c.slug === 'forum-access')!.open, true)
  assert.equal((await getPublicEvent('fms-thailand'))!.categories.length, 0)
})
