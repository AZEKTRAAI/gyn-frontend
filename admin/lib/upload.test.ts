import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sniffImage } from './upload.ts'

const bytes = (...parts: (string | number[])[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p)))

test('sniffImage accepts real image headers only', () => {
  assert.equal(sniffImage(bytes([0x89], 'PNG', [13, 10, 26, 10, 0, 0, 0, 0])), 'png')
  assert.equal(sniffImage(bytes([0xff, 0xd8, 0xff, 0xe0], 'JFIF\0\0\0\0')), 'jpg')
  assert.equal(sniffImage(bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8 ')), 'webp')
  assert.equal(sniffImage(bytes([0, 0, 0, 28], 'ftypavif', [0, 0, 0, 0])), 'avif')
  // SVG and HTML disguised as images are refused
  assert.equal(sniffImage(bytes('<svg xmlns="http://www.w3.org/2000/svg">')), null)
  assert.equal(sniffImage(bytes('<html><script>alert(1)</script>')), null)
  assert.equal(sniffImage(bytes('RIFF')), null)
})
