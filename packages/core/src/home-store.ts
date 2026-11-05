// Home page content storage.
// With DATABASE_URL: Page "home" + one PageSection per section (blockType = section key).
// Without it, readers get the bundled seed (content/home.json) and saving is refused.
// The public website reads (getHome); only the admin app saves (saveHome).

import seed from "../../../content/home.json" with { type: "json" };
import { getPrisma } from "./db.ts";
import { homeSchema, HOME_SECTIONS, type HomeContent } from "./home-schema.ts";

const SLUG = "home";
const seedContent = homeSchema.parse(seed);

/** Any stored section that no longer fits the schema falls back to the seed, so one bad block never blanks the page. */
function mergeOverSeed(stored: Partial<Record<string, unknown>>): HomeContent {
  const out = { ...seedContent } as Record<string, unknown>;
  for (const key of HOME_SECTIONS) {
    if (!(key in stored)) continue;
    const parsed = homeSchema.shape[key].safeParse(stored[key]);
    if (parsed.success) out[key] = parsed.data;
    else console.error(`[home] stored section "${key}" is invalid, using seed`, parsed.error.issues[0]);
  }
  return out as HomeContent;
}

export async function getHome(): Promise<HomeContent> {
  const prisma = getPrisma();
  if (!prisma) return seedContent;
  const page = await prisma.page.findUnique({
    where: { slug: SLUG },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
  if (!page) return seedContent;
  return mergeOverSeed(Object.fromEntries(page.sections.map((b) => [b.blockType, b.data])));
}

export class HomeStoreUnavailable extends Error {}

/** Caller must validate with homeSchema and check the admin's permission first. */
export async function saveHome(content: HomeContent, meta: { actor: string; userId?: string | null; ip: string | null }): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) throw new HomeStoreUnavailable("Saving needs a database. Set DATABASE_URL.");

  const previous = await getHome();
  await prisma.$transaction(async (tx) => {
    const page = await tx.page.upsert({
      where: { slug: SLUG },
      create: { slug: SLUG, title: "Home", status: "PUBLISHED", isSystem: true, publishedAt: new Date() },
      update: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await tx.pageSection.deleteMany({ where: { pageId: page.id } });
    await tx.pageSection.createMany({
      data: HOME_SECTIONS.map((key, sortOrder) => ({ pageId: page.id, blockType: key, sortOrder, data: content[key] })),
    });
    // Old and new versions are kept so a bad edit can be rolled back by hand.
    await tx.auditLog.create({
      data: {
        userId: meta.userId ?? null,
        userEmail: meta.actor,
        action: "HOME_PAGE_UPDATED",
        entityType: "Page",
        entityId: page.id,
        oldValue: { content: previous },
        newValue: content,
        ip: meta.ip,
      },
    });
  });
}
