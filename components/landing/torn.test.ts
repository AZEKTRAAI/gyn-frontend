import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tornPolygon } from './torn.ts'

test('torn polygon is stable for a seed and stays inside the box', () => {
  const a = tornPolygon(7)
  assert.equal(a, tornPolygon(7))
  assert.notEqual(a, tornPolygon(8))
  const nums = [...a.matchAll(/(-?[\d.]+)%/g)].map((m) => Number(m[1]))
  assert.equal(nums.length, 2 * (15 + 14 + 14 + 13))
  assert.ok(nums.every((n) => n >= 0 && n <= 100))
})
