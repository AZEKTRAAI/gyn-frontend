import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { homeSchema, accentRuns, countdownTarget, imageSchema, linkSchema } from './home-schema.ts'

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

test('link and image paths: site paths and https pass, protocol-relative and backslash forms do not', () => {
  const link = (href: string) => linkSchema.safeParse({ label: 'x', href }).success
  const image = (src: string) => imageSchema.safeParse({ src, alt: '' }).success
  for (const ok of ['/about-us', '/media/x.png', 'https://example.com/a', '#x', 'mailto:a@b.co', 'tel:+60123']) assert.ok(link(ok), ok)
  for (const bad of ['//evil.com', '/\\evil.com', 'javascript:alert(1)']) assert.equal(link(bad), false, bad)
  assert.ok(image('/media/x.png'))
  for (const bad of ['//evil.com/x.png', '/\\evil.com/x.png', 'https://evil.example/x.png']) assert.equal(image(bad), false, bad)
})
