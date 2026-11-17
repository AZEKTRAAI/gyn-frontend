import { test } from 'node:test'
import assert from 'node:assert/strict'
import { eventDetailsSchema, eventPageSchema, eventTiming, slugSchema } from './event-schema.ts'

test('an event is upcoming until its end date passes; the override wins', () => {
  const endsAt = new Date('2026-11-22T15:59:00Z')
  assert.equal(eventTiming({ endsAt }, new Date('2026-11-22T15:58:00Z')), 'upcoming')
  assert.equal(eventTiming({ endsAt }, new Date('2026-11-22T16:00:00Z')), 'past')
  assert.equal(eventTiming({ endsAt, timingOverride: 'UPCOMING' }, new Date('2027-01-01')), 'upcoming')
  assert.equal(eventTiming({ endsAt, timingOverride: 'PAST' }, new Date('2026-01-01')), 'past')
})

test('slugs are lower-case words with single dashes and never take a fixed page address', () => {
  for (const ok of ['sis-dubai-2027', 'fms-thailand', 'abc']) assert.ok(slugSchema.safeParse(ok).success, ok)
  for (const bad of ['', 'ab', 'Has-Caps', 'two--dashes', '-lead', 'trail-', 'with space', 'a/b', 'about-us', 'admin', 'api', 'sism-forum-access', 'pitch']) {
    assert.equal(slugSchema.safeParse(bad).success, false, bad)
  }
})

test('details need real dates in order', () => {
  const d = { name: 'Test summit', shortName: '', theme: '', startsAt: '2027-01-02', endsAt: '2027-01-01', timezone: 'UTC', venue: '', city: '', country: '', navLabel: '', timingOverride: '' }
  assert.equal(eventDetailsSchema.safeParse(d).success, false)
  assert.ok(eventDetailsSchema.safeParse({ ...d, endsAt: '2027-01-02' }).success)
  assert.equal(eventDetailsSchema.safeParse({ ...d, startsAt: '2 Jan 2027' }).success, false)
})

test('the video link rejects protocol-relative and backslash addresses', () => {
  const url = (u: string) => eventPageSchema.shape.videos.safeParse({ visible: true, kicker: '', heading: '', items: [{ url: u, title: 't', poster: { src: '/media/x.png', alt: '' } }] }).success
  for (const ok of ['https://youtu.be/x', '/media/v.mp4', '#x']) assert.ok(url(ok), ok)
  for (const bad of ['//evil.com', '/\\evil.com']) assert.equal(url(bad), false, bad)
})
