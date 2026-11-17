import { test } from 'node:test'
import assert from 'node:assert/strict'
import { blankCategory, categoryFormSchema, centsToFee, feeToCents } from './category-schema.ts'

test('fees are entered as an amount and stored in cents without rounding trouble', () => {
  assert.equal(feeToCents('150'), 15000)
  assert.equal(feeToCents('150.5'), 15050)
  assert.equal(feeToCents('0.10'), 10)
  assert.equal(feeToCents('0'), 0)
  assert.equal(feeToCents(' 19.99 '), 1999)
  for (const bad of ['', '-1', '1,500', '12.345', 'abc', '1e3', '.5', '10.', '9999999']) assert.equal(feeToCents(bad), null, bad)
  assert.equal(centsToFee(15000), '150.00')
  assert.equal(centsToFee(5), '0.05')
  for (const c of [0, 1, 99, 100, 1999, 99999999]) assert.equal(feeToCents(centsToFee(c)), c)
})

const ok = { ...blankCategory, name: 'Forum Access', slug: 'forum-access', fee: '299' }

test('a valid form becomes cents, a seat number or null, and null dates', () => {
  const r = categoryFormSchema.parse({ ...ok, seatLimit: '120', opensAt: '2027-01-01', closesAt: '2027-02-01' })
  assert.deepEqual(r, { name: 'Forum Access', slug: 'forum-access', description: '', feeCents: 29900, currency: 'USD', approvalMode: 'AUTOMATIC', seatLimit: 120, active: true, opensAt: '2027-01-01', closesAt: '2027-02-01' })
  const open = categoryFormSchema.parse(ok)
  assert.equal(open.seatLimit, null)
  assert.equal(open.opensAt, null)
  assert.equal(open.closesAt, null)
})

test('bad values are refused with a message for the right field', () => {
  const field = (over: object) => {
    const r = categoryFormSchema.safeParse({ ...ok, ...over })
    return r.success ? null : r.error.issues[0].path[0]
  }
  assert.equal(field({ name: 'A' }), 'name')
  for (const slug of ['', 'Has Caps', 'two--dashes', '-lead', 'trail-', 'a/b']) assert.equal(field({ slug }), 'slug', slug)
  assert.equal(categoryFormSchema.safeParse({ ...ok, slug: 'about-us' }).success, true, 'no reserved-word rule for categories')
  assert.equal(field({ fee: '-5' }), 'fee')
  assert.equal(field({ currency: 'XXX' }), 'currency')
  assert.equal(field({ approvalMode: 'SOMETIMES' }), 'approvalMode')
  for (const seatLimit of ['0', '-3', '1.5', 'many']) assert.equal(field({ seatLimit }), 'seatLimit', seatLimit)
  assert.equal(field({ opensAt: '2027-02-30' }), 'opensAt')
  assert.equal(field({ closesAt: '14 March' }), 'closesAt')
  assert.equal(field({ opensAt: '2027-03-02', closesAt: '2027-03-01' }), 'closesAt')
  assert.equal(categoryFormSchema.safeParse({ ...ok, opensAt: '2027-03-01', closesAt: '2027-03-01' }).success, true, 'the same day is fine')
})
