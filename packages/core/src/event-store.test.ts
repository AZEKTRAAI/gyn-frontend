// No database: with DATABASE_URL unset the store serves content/event-pages/*.json. The database paths are in tests/integration/events.test.ts.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { eventPageSchema, EVENT_SECTIONS } from './event-schema.ts'
import {
  EVENT_SEEDS, EventStoreError, dateToLocal, defaultEventContent, eventDates, localToDate, getPublicEvent, listExtras, listPublicEvents, mergeEventContent, sortEvents,
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
  assert.deepEqual(shown('upcoming'), ['highlights', 'overview', 'categories', 'lists', 'schedule', 'speakers', 'partners', 'faq', 'cta'])
})

test('without a database the public readers serve the seed', async () => {
  const list = await listPublicEvents()
  assert.deepEqual(list.map((e) => e.slug).sort(), ['fms-thailand', 'sism-2026'])
  assert.equal(list.find((e) => e.slug === 'fms-thailand')!.timing, 'past')
  assert.equal(await getPublicEvent('nope'), null)
  const sism0 = list.find((e) => e.slug === 'sism-2026')!
  assert.equal(sism0.cardImage?.src, EVENT_SEEDS['sism-2026'].content.hero.photos[0].src)
  assert.equal(sism0.lead, EVENT_SEEDS['sism-2026'].content.hero.lead)
  assert.equal(sism0.timezone, 'Asia/Kuala_Lumpur')
  assert.equal(sism0.featured, false)
  assert.equal(sism0.registration, 'open')
  assert.equal(list.find((e) => e.slug === 'fms-thailand')!.registration, null, 'no categories, nothing to say')
  const sism = (await getPublicEvent('sism-2026'))!
  assert.equal(sism.categories.find((c) => c.slug === 'fully-funded')!.open, false)
  assert.equal(sism.categories.find((c) => c.slug === 'forum-access')!.open, true)
  assert.equal((await getPublicEvent('fms-thailand'))!.categories.length, 0)
})

test('a local date and time survive the round trip in zones that change clocks at midnight', () => {
  const zones = ['Africa/Cairo', 'America/Godthab', 'America/Sao_Paulo', 'Asia/Beirut', 'America/Havana', 'Europe/London', 'Pacific/Auckland', 'Asia/Kuala_Lumpur']
  const pad = (n: number) => String(n).padStart(2, '0')
  let checked = 0
  for (const tz of zones) {
    for (let day = Date.UTC(2026, 0, 1); day < Date.UTC(2028, 0, 1); day += 86_400_000) {
      const d = new Date(day)
      const ymd = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
      for (const hm of ['00:00', '23:59']) {
        const back = dateToLocal(localToDate(ymd, hm, tz), tz)
        // a wall time a clock change skips (Cairo 00:00 on the day clocks jump forward) resolves to the nearest instant still on that day
        assert.equal(back, ymd, `${tz} ${ymd} ${hm} came back as ${back}`)
        checked++
      }
    }
  }
  assert.ok(checked > 10_000)
})

const ev = (slug: string, start: string, o: { featured?: boolean; timing?: 'upcoming' | 'past' } = {}) => ({
  slug, startsAt: new Date(start), featured: !!o.featured, timing: o.timing ?? 'upcoming',
}) as Parameters<typeof sortEvents>[0][number]

test('upcoming events run soonest first, past latest first, featured ones lead their group', () => {
  const list = [
    ev('late', '2027-05-01'), ev('soon', '2027-01-01'), ev('mid', '2027-03-01'),
    ev('old', '2024-01-01', { timing: 'past' }), ev('older', '2023-01-01', { timing: 'past' }), ev('newest-past', '2025-06-01', { timing: 'past' }),
  ]
  assert.deepEqual(sortEvents(list).map((e) => e.slug), ['soon', 'mid', 'late', 'newest-past', 'old', 'older'])
  const featured = [...list.slice(0, 3), ...list.slice(3)].map((e) => (e.slug === 'late' || e.slug === 'older' ? { ...e, featured: true } : e))
  assert.deepEqual(sortEvents(featured).map((e) => e.slug), ['late', 'soon', 'mid', 'older', 'newest-past', 'old'], 'featured first inside each group, never across groups')
  assert.deepEqual(sortEvents([ev('b', '2027-02-01', { featured: true }), ev('a', '2027-01-01', { featured: true })]).map((e) => e.slug), ['a', 'b'], 'two featured: by date')
})

test('the card fields: first hero photo, hero lead, and whether any category is open now', () => {
  const hero = { ...EVENT_SEEDS['sism-2026'].content.hero, lead: 'Hello', photos: [{ src: '/a.jpg', alt: 'a' }, { src: '/b.jpg', alt: 'b' }] }
  const now = new Date('2026-06-01T00:00:00Z')
  const cat = (o: { active?: boolean; opensAt?: string; closesAt?: string }) => ({ active: o.active ?? true, opensAt: o.opensAt ? new Date(o.opensAt) : null, closesAt: o.closesAt ? new Date(o.closesAt) : null })
  assert.deepEqual(listExtras(hero, [], now), { cardImage: hero.photos[0], lead: 'Hello', registration: null })
  assert.equal(listExtras(hero, [cat({ closesAt: '2026-01-01' }), cat({})], now).registration, 'open')
  assert.equal(listExtras(hero, [cat({ closesAt: '2026-01-01' }), cat({ active: false }), cat({ opensAt: '2026-07-01' })], now).registration, 'closed')
})
