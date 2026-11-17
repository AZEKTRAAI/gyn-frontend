import { test } from 'node:test'
import assert from 'node:assert/strict'
import { seedOnReadError } from './read-fallback.ts'

test('the seed stands in for a failed database read only while building', () => {
  assert.equal(seedOnReadError('phase-production-build'), true)
  for (const phase of [undefined, 'phase-production-server', 'phase-development-server']) assert.equal(seedOnReadError(phase), false, String(phase))
})

test('event readers: build falls back to the seed, runtime rethrows, no DATABASE_URL serves the seed', async () => {
  // nothing listens on port 1, so every query fails
  process.env.DATABASE_URL = 'postgresql://x:x@127.0.0.1:1/x'
  const { getPublicEvent, listPublicEvents } = await import('./event-store.ts')
  const was = process.env.NEXT_PHASE
  try {
    process.env.NEXT_PHASE = 'phase-production-server'
    await assert.rejects(getPublicEvent('sism-2026'))
    await assert.rejects(listPublicEvents())
    process.env.NEXT_PHASE = 'phase-production-build'
    assert.equal((await getPublicEvent('sism-2026'))?.slug, 'sism-2026')
    assert.ok((await listPublicEvents()).length >= 2)
  } finally {
    if (was === undefined) delete process.env.NEXT_PHASE
    else process.env.NEXT_PHASE = was
    delete process.env.DATABASE_URL
  }
})
