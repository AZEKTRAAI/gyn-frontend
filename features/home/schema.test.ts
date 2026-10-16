import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { homeSchema, accentRuns, countdownTarget } from './schema.ts'

const seed = () => JSON.parse(fs.readFileSync('content/home.json', 'utf8'))

test('seed content/home.json passes the schema', () => {
  const r = homeSchema.safeParse(seed())
  assert.ok(r.success, JSON.stringify(r.error?.issues.slice(0, 3)))
})

test('links and images reject script and foreign origins', () => {
  const s = seed()
  s.hero.primaryCta.href = 'javascript:alert(1)'
  assert.equal(homeSchema.safeParse(s).success, false)
  s.hero.primaryCta.href = '/sism-2026'
  for (const bad of ['https://evil.example/x.png', '//evil.example/x.png', 'data:image/png;base64,AAAA']) {
    s.advisors.people[0].photo.src = bad
    assert.equal(homeSchema.safeParse(s).success, false, bad)
  }
})

test('accent runs and countdown target', () => {
  assert.deepEqual(accentRuns('*Four* in our hands.'), [
    { text: 'Four', italic: true },
    { text: ' in our hands.', italic: false },
  ])
  assert.equal(countdownTarget({ countdownTo: '2026-11-19T00:00', utcOffset: '+08:00' }), Date.parse('2026-11-18T16:00:00Z'))
  assert.equal(countdownTarget({ countdownTo: '', utcOffset: '+08:00' }), null)
})
