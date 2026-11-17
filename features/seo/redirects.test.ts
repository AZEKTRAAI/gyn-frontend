import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import nextConfig, { OLD_URL_REDIRECTS } from '../../next.config.ts'

const sitemap = JSON.parse(readFileSync('content/sitemap.json', 'utf8')) as { pages: { slug: string }[] }
const eventSlugs = readdirSync('content/event-pages').map((f) => f.replace(/\.json$/, ''))

test('every old WordPress page resolves: a real route, an event page, or a permanent redirect', () => {
  const redirected = new Set(OLD_URL_REDIRECTS.map((r) => r.source.slice(1)))
  for (const { slug } of sitemap.pages) {
    if (slug === 'home') assert.ok(redirected.has('home'), '/home must redirect to /')
    else assert.ok(
      existsSync(`app/${slug}/page.tsx`) || eventSlugs.includes(slug) || redirected.has(slug),
      `old page /${slug} has no new home`,
    )
  }
})

test('redirect table is clean: unique sources, no loops, no chains, targets exist', () => {
  const sources = OLD_URL_REDIRECTS.map((r) => r.source)
  assert.equal(new Set(sources).size, sources.length)
  for (const { source, destination } of OLD_URL_REDIRECTS) {
    const path = destination.split('#')[0]
    assert.notEqual(path, source)
    assert.ok(!sources.includes(path), `${source} -> ${destination} is a redirect chain`)
    const slug = path.slice(1)
    assert.ok(path === '/' || existsSync(`app/${slug}/page.tsx`) || eventSlugs.includes(slug), `${destination} does not exist`)
  }
})

test('redirects() serves them as permanent', async () => {
  const out = await nextConfig.redirects!()
  assert.equal(out.length, OLD_URL_REDIRECTS.length)
  assert.ok(out.every((r) => r.permanent === true))
})
