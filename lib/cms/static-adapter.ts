import path from 'path'
import fs from 'fs'
import matter from 'gray-matter'
import type { CmsAdapter, PageMeta, SitemapData } from './types'

const ROOT = path.join(process.cwd(), 'content')

/** Reads content/*.json and content/pages/*.md at build time. */
export class StaticAdapter implements CmsAdapter {
  async getPage(slug: string) {
    const file = path.join(ROOT, 'pages', `${slug}.md`)
    const raw = fs.readFileSync(file, 'utf8')
    const { data, content } = matter(raw)
    return {
      meta: data as PageMeta,
      body: content,
    }
  }

  async getSitemap(): Promise<SitemapData> {
    const raw = fs.readFileSync(path.join(ROOT, 'sitemap.json'), 'utf8')
    return JSON.parse(raw) as SitemapData
  }

  async getEvents() {
    const raw = fs.readFileSync(path.join(ROOT, 'events.json'), 'utf8')
    return JSON.parse(raw)
  }

  async getMedia() {
    const raw = fs.readFileSync(path.join(ROOT, 'media.json'), 'utf8')
    return JSON.parse(raw)
  }
}
