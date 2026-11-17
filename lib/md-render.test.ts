import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { renderMd } from './md-render.ts'

test('quotes in a link cannot break out of the href attribute', () => {
  const { html } = renderMd('[x](/" onmouseover="alert(1))')
  assert.match(html, /^<p><a href="[^"]*">x<\/a>/, html)
  assert.ok(html.includes('&quot;'), html)
  assert.ok(renderMd(`it's **"q"**`).html.includes('it&#39;s'))
})

test('protocol-relative and backslash links fall back to #', () => {
  for (const bad of ['//evil.com', '/\\evil.com']) assert.ok(renderMd(`[x](${bad})`).html.includes('href="#"'), bad)
  assert.ok(renderMd('[x](/about-us)').html.includes('href="/about-us"'))
})

test('headings never skip a level: the distinct levels below the h1 become h2, h3, ...', () => {
  const { html, toc } = renderMd('# Title\n\n#### A\n\ntext\n\n###### B\n\n#### C')
  assert.deepEqual([...html.matchAll(/<h(\d)/g)].map((m) => m[1]), ['1', '2', '3', '2'])
  assert.deepEqual(toc.map((t) => t.text), ['A', 'C'])
})

for (const page of ['privacy-policy', 'refund-policy', 'terms-conditions']) {
  test(`${page}: no skipped heading levels and a table of contents`, () => {
    const { html, toc } = renderMd(readFileSync(`content/pages/${page}.md`, 'utf8'))
    const levels = [...html.matchAll(/<h(\d)/g)].map((m) => Number(m[1]))
    let max = 1
    for (const l of levels) {
      assert.ok(l <= max + 1, `${page}: h${l} after h${max}`)
      max = Math.max(max, l)
    }
    assert.ok(toc.length > 0)
  })
}
