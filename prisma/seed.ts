// Idempotent seed: SISM 2026 and FMS Thailand with their page content (content/event-pages) and registration categories.
// Run with: npm run db:seed (reads .env.local). Safe to run again: an existing event keeps whatever the admin edited,
// the seed only fills in what is missing (the dropdown label, page sections) and refreshes the categories.
// Roles, users and form definitions are seeded by their own phases (docs/backend-plan.md).

import { Pool } from "pg";
import { createPrismaClient } from "@gyn/core/prisma-client";
import eventsJson from "../content/events.json" with { type: "json" };
import { buildSeed, RENAMED_SLUGS } from "./seed-data.ts";
import { EVENT_SEEDS, eventRowFields, sectionRows } from "@gyn/core/event-store";
import { seedRoles, seedDemoUsers, DEMO_USERS, DEMO_PASSWORD } from "@gyn/core/access-seed";

async function seed(): Promise<void> {
  const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!url) throw new Error("seed: DATABASE_URL or DIRECT_URL must be set");

  const pool = new Pool({ connectionString: url, max: 1 });
  const prisma = createPrismaClient(pool);

  try {
    await seedRoles(prisma);
    console.log("seed: six admin roles");
    // Dummy accounts, development only (see packages/core/src/access-seed.ts).
    if (process.env.ALLOW_DEMO_ACCOUNTS === "1") {
      await seedDemoUsers(prisma);
      console.log(`seed: demo accounts, password ${DEMO_PASSWORD}`);
      for (const u of DEMO_USERS) console.log(`seed:   ${u.email}  (${u.role})`);
    }
    for (const [oldSlug, slug] of Object.entries(RENAMED_SLUGS)) {
      const renamed = await prisma.event.updateMany({ where: { slug: oldSlug }, data: { slug } });
      if (renamed.count) console.log(`seed: renamed event ${oldSlug} to ${slug}`);
    }
    for (const { categories, totalSeats, slug } of buildSeed(eventsJson)) {
      const page = EVENT_SEEDS[slug];
      if (!page) throw new Error(`seed: no content/event-pages/${slug}.json`);
      const found = await prisma.event.findUnique({ where: { slug }, include: { sections: { select: { blockType: true } } } });
      const event =
        found ??
        (await prisma.event.create({ data: { slug, status: "PUBLISHED", totalSeats, ...eventRowFields(page.details, page.content.seo) }, include: { sections: { select: { blockType: true } } } }));
      if (found && !found.navLabel) await prisma.event.update({ where: { id: found.id }, data: { navLabel: page.details.navLabel } });
      const have = new Set(event.sections.map((s) => s.blockType));
      const missing = sectionRows(event.id, page.content).filter((r) => !have.has(r.blockType));
      await prisma.eventSection.createMany({ data: missing });
      console.log(`seed: event ${event.slug} (${found ? "kept" : "created"}, ${missing.length} sections added)`);

      for (const c of categories) {
        await prisma.registrationCategory.upsert({
          where: { eventId_slug: { eventId: event.id, slug: c.slug } },
          update: { ...c },
          create: { ...c, eventId: event.id },
        });
        console.log(`seed:   category ${c.slug} (${c.approvalMode}, ${c.feeCents} cents)`);
      }
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});
