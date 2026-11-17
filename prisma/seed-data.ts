// Pure mapping from content/events.json to the rows the seed writes. Kept apart from seed.ts so it can be unit-tested without a database.
// Event details and page sections come from content/event-pages/*.json (see packages/core/src/event-store.ts);
// this file only supplies the registration categories and the seat total.
// This is our own content (the summit pages we built), not data from the old WordPress site.

import type { ApprovalMode } from "@prisma/client";

type EventsJson = {
  events: Array<{
    id: string;
    seats?: number | null;
    deadline?: { countdownTarget?: string } | null;
    ticketTypes: Array<{ id: string; name: string; price: number; status: string; seats?: number | null }>;
  }>;
};

export interface SeedCategory {
  slug: string;
  name: string;
  feeCents: number;
  approvalMode: ApprovalMode;
  seatLimit: number | null;
  sortOrder: number;
  active: boolean;
  closesAt: Date | null;
}

export interface SeedEvent {
  slug: string;
  totalSeats: number | null;
  categories: SeedCategory[];
}

// FMST's page lives at /fms-thailand, so that is its slug. The seed renames a row still called fmst-2026.
export const RENAMED_SLUGS: Record<string, string> = { "fmst-2026": "fms-thailand" };

// Scholarship applications are reviewed by hand. Self-Funded, Forum Access and Invitation Letter are accepted when payment is verified.
const REVIEW_CATEGORIES = new Set(["fully-funded", "partially-funded"]);
// The unlisted discounted form is not a public category; the team adds it from the admin if they want it.
const SKIPPED = new Set(["forum-access-discounted"]);

const NAMES: Record<string, string> = {
  "fully-funded": "Fully Funded Scholarship",
  "partially-funded": "Partially Funded Scholarship",
  "forum-access": "Forum Access",
  "self-funded": "Self-Funded",
  "invitation-letter": "Invitation Letter",
};

export function buildSeed(json: EventsJson): SeedEvent[] {
  return json.events.map((e) => {
    const categories = e.ticketTypes
      .filter((t) => !SKIPPED.has(t.id))
      .map((t, i): SeedCategory => ({
        slug: t.id,
        name: NAMES[t.id] ?? t.name,
        feeCents: Math.round(t.price * 100),
        approvalMode: REVIEW_CATEGORIES.has(t.id) ? "MANUAL_REVIEW" : "AUTOMATIC",
        seatLimit: t.seats ?? null,
        sortOrder: i + 1,
        active: t.status === "open",
        // Applications closed on the scholarship deadline.
        closesAt: t.status === "closed" && e.deadline?.countdownTarget ? new Date(e.deadline.countdownTarget) : null,
      }));
    return { slug: RENAMED_SLUGS[e.id] ?? e.id, totalSeats: e.seats ?? null, categories };
  });
}
