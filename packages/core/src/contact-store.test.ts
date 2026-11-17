// Pure parts only. The database paths are exercised by posting to /api/contact and using the admin inbox.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanIp, firstLine, parseFilters, saveContactMessage, ContactStoreUnavailable } from './contact-store.ts'

delete process.env.DATABASE_URL

test('cleanIp keeps a real address and drops the "unknown" placeholder', () => {
  assert.equal(cleanIp(' 203.0.113.9 '), '203.0.113.9')
  assert.equal(cleanIp('unknown'), null)
  assert.equal(cleanIp(''), null)
  assert.equal(cleanIp(undefined), null)
  assert.equal(cleanIp('x'.repeat(200))?.length, 64)
})

test('firstLine skips blank lines and shortens long ones', () => {
  assert.equal(firstLine('\n  \n Hello there\nsecond'), 'Hello there')
  assert.equal(firstLine('a'.repeat(100), 10), 'aaaaaaaaa…')
  assert.equal(firstLine(''), '')
})

test('parseFilters accepts only known values', () => {
  assert.deepEqual(parseFilters({ status: 'new', topic: 'media' }), { status: 'NEW', topic: 'media' })
  assert.deepEqual(parseFilters({ status: ['READ', 'NEW'], topic: 'bogus' }), { status: 'READ', topic: undefined })
  assert.deepEqual(parseFilters({ status: "'; DROP TABLE" }), { status: undefined, topic: undefined })
})

test('saving without a database throws, so the website can never report a lost message as sent', async () => {
  await assert.rejects(saveContactMessage({ name: 'A B', email: 'a@b.co', topic: 'general', message: 'hello world!' }), ContactStoreUnavailable)
})
