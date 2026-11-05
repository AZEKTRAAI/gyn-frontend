// Pure mapping from content/events.json to the rows the seed writes. Kept apart from seed.ts so it can be unit-tested without a database.
// This is our own content (the summit pages we built), not data from the old WordPress site.

import type { ApprovalMode } from "@prisma/client";

type EventsJson = {
  events: Array<{
    id: string;
    name: string;
    shortName: string;
    dates: { start: string; end: string };
    venue: string;
    city: string;
    country: string;
    seats?: number | null;
    theme?: string;
    summitTheme?: string;
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
  name: string;
  shortName: string;
  theme: string | null;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  venue: string;
  city: string;
  country: string;
  totalSeats: number | null;
  categories: SeedCategory[];
}

const TIMEZONES: Record<string, string> = { Malaysia: "Asia/Kuala_Lumpur", Thailand: "Asia/Bangkok" };
const OFFSETS: Record<string, string> = { "Asia/Kuala_Lumpur": "+08:00", "Asia/Bangkok": "+07:00" };

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
    const timezone = TIMEZONES[e.country] ?? "UTC";
    const offset = OFFSETS[timezone] ?? "+00:00";
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
    return {
      slug: e.id,
      name: e.name,
      shortName: e.shortName,
      theme: e.theme ?? e.summitTheme ?? null,
      startsAt: new Date(`${e.dates.start}T00:00:00${offset}`),
      endsAt: new Date(`${e.dates.end}T23:59:00${offset}`),
      timezone,
      venue: e.venue,
      city: e.city,
      country: e.country,
      totalSeats: e.seats ?? null,
      categories,
    };
  });
}
