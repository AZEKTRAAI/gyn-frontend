// Test: seed prices match TICKETS (the source of truth).
// Run with: node --experimental-strip-types prisma/seed.test.ts

import assert from "node:assert/strict";
import { test } from "node:test";
import { TICKETS } from "../features/registration/schema.ts";

type EventsJson = { events: Array<{ id: string; ticketTypes: Array<{ id: string; price: number; status: string }> }> };
// eslint-disable-next-line @typescript-eslint/no-var-requires
const eventsJson = (await import("../content/events.json", { with: { type: "json" } })).default as EventsJson;

test("seed ticket prices match TICKETS source of truth", () => {
  const sism = eventsJson.events.find((e) => e.id === "sism-2026");
  assert.ok(sism, "sism-2026 must exist in content/events.json");

  for (const [slug, ticket] of Object.entries(TICKETS)) {
    if (ticket.eventId !== "sism-2026") continue;

    // TICKETS prices must match events.json so the two sources don't silently diverge.
    const evTicket = sism.ticketTypes.find((t) => t.id === slug);
    assert.ok(evTicket, `events.json must have a ticketType for ${slug}`);

    const jsonCents = Math.round(evTicket.price * 100);
    assert.equal(
      ticket.amountCents,
      jsonCents,
      `TICKETS["${slug}"].amountCents (${ticket.amountCents}) must equal events.json price × 100 (${jsonCents})`
    );
  }
});

test("seed covers all open tickets in events.json", () => {
  const sism = eventsJson.events.find((e) => e.id === "sism-2026");
  assert.ok(sism);

  for (const t of sism.ticketTypes.filter((t) => t.status === "open")) {
    assert.ok(
      t.id in TICKETS,
      `Open ticket "${t.id}" in events.json must have an entry in TICKETS`
    );
  }
});
