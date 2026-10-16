// Idempotent seed: upserts the SISM 2026 Event and its TicketType rows.
// Prices come from TICKETS in features/registration/schema.ts (single source of truth).
// Run with: node --experimental-strip-types prisma/seed.ts
// Or: npx prisma db seed (wired via package.json "prisma.seed")

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { TICKETS } from "../features/registration/schema.ts";
import eventsJson from "../content/events.json" with { type: "json" };

async function seed(): Promise<void> {
  const sism = eventsJson.events.find((e) => e.id === "sism-2026");
  if (!sism) throw new Error("seed: sism-2026 not found in content/events.json");

  const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!url) throw new Error("seed: DATABASE_URL or DIRECT_URL must be set");

  const pool = new Pool({ connectionString: url, max: 1 });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const startDate = new Date(sism.dates.start + "T00:00:00+08:00");
    const endDate = new Date(sism.dates.end + "T23:59:00+08:00");

    const event = await prisma.event.upsert({
      where: { slug: "sism-2026" },
      update: {
        name: sism.name,
        shortName: sism.shortName,
        startDate,
        endDate,
        venue: sism.venue,
        city: sism.city,
        country: sism.country,
        totalSeats: sism.seats,
        status: "OPEN",
      },
      create: {
        slug: "sism-2026",
        name: sism.name,
        shortName: sism.shortName,
        startDate,
        endDate,
        venue: sism.venue,
        city: sism.city,
        country: sism.country,
        totalSeats: sism.seats,
        status: "OPEN",
      },
    });

    console.log(`seed: event upserted — ${event.slug} (id: ${event.id})`);

    // Upsert TicketTypes using prices from TICKETS (single source of truth).
    for (const [slug, ticket] of Object.entries(TICKETS) as [keyof typeof TICKETS, (typeof TICKETS)[keyof typeof TICKETS]][]) {
      if (ticket.eventId !== "sism-2026") continue;

      const evTicket = sism.ticketTypes.find((t) => t.id === slug);
      const category =
        ticket.form === "invitation"
          ? ("INVITATION_LETTER" as const)
          : ("CONFIRMED_SEAT" as const);

      const originalPriceCents =
        evTicket?.originalPrice != null
          ? Math.round(evTicket.originalPrice * 100)
          : null;

      const tt = await prisma.ticketType.upsert({
        where: { eventId_slug: { eventId: event.id, slug } },
        update: {
          name: ticket.name,
          category,
          priceCents: ticket.amountCents,       // TICKETS is the price source of truth
          originalPriceCents,
          status: "OPEN",
        },
        create: {
          eventId: event.id,
          slug,
          name: ticket.name,
          category,
          priceCents: ticket.amountCents,
          originalPriceCents,
          status: "OPEN",
        },
      });

      console.log(`seed: ticket upserted — ${tt.slug} $${(tt.priceCents / 100).toFixed(2)}`);
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
