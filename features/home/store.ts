// Home page content storage.
// With DATABASE_URL: Page "home" + one ContentBlock per section (blockType = section key).
// Without it: content/home.json, which is also the seed and the per-section fallback.
// Saving without a database only works in development (it rewrites content/home.json).
import fs from 'node:fs/promises'
import path from 'node:path'
import seed from '@/content/home.json'
import { getPrisma } from '@/lib/db'
import { homeSchema, HOME_SECTIONS, type HomeContent } from './schema'

const SEED_FILE = path.join(process.cwd(), 'content', 'home.json')
const SLUG = 'home'

const seedContent = homeSchema.parse(seed)

/** Any stored section that no longer fits the schema falls back to the seed, so one bad block never blanks the page. */
function mergeOverSeed(stored: Partial<Record<string, unknown>>): HomeContent {
  const out = { ...seedContent } as Record<string, unknown>
  for (const key of HOME_SECTIONS) {
    if (!(key in stored)) continue
    const parsed = homeSchema.shape[key].safeParse(stored[key])
    if (parsed.success) out[key] = parsed.data
    else console.error(`[home] stored section "${key}" is invalid, using seed`, parsed.error.issues[0])
  }
  return out as HomeContent
}

export async function getHome(): Promise<HomeContent> {
  const prisma = getPrisma()
  if (prisma) {
    const page = await prisma.page.findUnique({
      where: { slug: SLUG },
      include: { contentBlocks: { orderBy: { order: 'asc' } } },
    })
    if (!page) return seedContent
    return mergeOverSeed(Object.fromEntries(page.contentBlocks.map((b) => [b.blockType, b.data])))
  }
  if (process.env.NODE_ENV !== 'production') {
    return mergeOverSeed(JSON.parse(await fs.readFile(SEED_FILE, 'utf8')))
  }
  return seedContent
}

export class HomeStoreUnavailable extends Error {}

/** Caller must validate with homeSchema and check admin auth first. */
export async function saveHome(content: HomeContent, meta: { actor: string; ip: string | null }): Promise<void> {
  const prisma = getPrisma()
  if (!prisma) {
    if (process.env.NODE_ENV === 'production') {
      throw new HomeStoreUnavailable('Saving needs a database. Set DATABASE_URL on the server.')
    }
    await fs.writeFile(SEED_FILE, JSON.stringify(content, null, 2) + '\n', 'utf8')
    return
  }

  const previous = await getHome()
  await prisma.$transaction(async (tx) => {
    const page = await tx.page.upsert({
      where: { slug: SLUG },
      create: { slug: SLUG, title: 'Home', publishedAt: new Date() },
      update: { publishedAt: new Date() },
    })
    await tx.contentBlock.deleteMany({ where: { pageId: page.id } })
    await tx.contentBlock.createMany({
      data: HOME_SECTIONS.map((key, order) => ({ pageId: page.id, blockType: key, order, data: content[key] })),
    })
    // Old and new versions are kept so a bad edit can be rolled back by hand.
    await tx.auditLog.create({
      data: {
        action: 'HOME_PAGE_UPDATED',
        entityType: 'Page',
        entityId: page.id,
        oldValue: { actor: meta.actor, content: previous },
        newValue: content,
        ipAddress: meta.ip,
      },
    })
  })
}
