/** CMS content types shared across adapters */

export interface PageMeta {
  title: string
  url: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  lastModified?: string
}

export interface NavItem {
  label: string
  href: string
  children?: NavItem[]
}

export interface SitemapData {
  nav: NavItem[]
  footer: FooterSection[]
  socials: SocialLink[]
  pages: PageEntry[]
}

export interface FooterSection {
  type?: string
  logo?: string
  text?: string
  heading?: string
  links?: { label: string; href: string }[]
  items?: { type: string; label: string; href?: string }[]
}

export interface SocialLink {
  label: string
  href: string
  where: string
}

export interface PageEntry {
  slug: string
  url: string
  title: string
  parent?: string
  linked?: boolean
}

/** Adapter interface — swap one line in lib/cms/index.ts to change backends */
export interface CmsAdapter {
  getPage(slug: string): Promise<{ meta: PageMeta; body: string }>
  getSitemap(): Promise<SitemapData>
  getEvents(): Promise<unknown>
  getMedia(): Promise<unknown>
}
