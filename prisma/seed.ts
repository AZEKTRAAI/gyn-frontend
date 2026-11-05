// Idempotent seed: upserts SISM 2026 and FMST 2026 with their registration categories.
// Run with: npm run db:seed (reads .env.local). Safe to run again; it only updates rows it created.
// Roles, users and form definitions are seeded by their own phases (docs/backend-plan.md).

import { Pool } from "pg";
import { createPrismaClient } from "../lib/server/prisma-client.ts";
import eventsJson from "../content/events.json" with { type: "json" };
import { buildSeed } from "./seed-data.ts";

async function seed(): Promise<void> {
  const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!url) throw new Error("seed: DATABASE_URL or DIRECT_URL must be set");

  const pool = new Pool({ connectionString: url, max: 1 });
  const prisma = createPrismaClient(pool);

  try {
    for (const e of buildSeed(eventsJson)) {
      const { categories, ...fields } = e;
      const event = await prisma.event.upsert({
        where: { slug: e.slug },
        update: { ...fields },
        create: { ...fields, status: "PUBLISHED" },
      });
      console.log(`seed: event ${event.slug}`);

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
