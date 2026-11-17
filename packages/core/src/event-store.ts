// Event storage. One Event row holds the details; page content is one EventSection row per section key
// (blockType = key, data = that section's JSON), the same pattern home-store.ts uses for the home page.
// Without DATABASE_URL the public readers serve content/event-pages/<slug>.json, so the site still builds and renders;
// with it, a failed read serves the seed only during `next build` (see read-fallback.ts). The admin writers need the database.

import type { Prisma, PrismaClient } from "@prisma/client";
import eventsJson from "../../../content/events.json" with { type: "json" };
import fmsThailandJson from "../../../content/event-pages/fms-thailand.json" with { type: "json" };
import sism2026Json from "../../../content/event-pages/sism-2026.json" with { type: "json" };
import { buildSeed, type SeedCategory } from "../../../prisma/seed-data.ts";
import { getPrisma } from "./db.ts";
import { seedOnReadError } from "./read-fallback.ts";
import {
  EVENT_SECTIONS,
  eventDetailsSchema,
  eventPageSchema,
  eventTiming,
  slugSchema,
  type EventDetails,
  type EventPageContent,
  type EventSectionKey,
  type EventTiming,
} from "./event-schema.ts";

export type EventStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type EventKind = "past" | "upcoming";
export type AuditMeta = { actor: string; userId?: string | null; ip: string | null };

/** What the navbar, the home page and the sitemap need. */
export interface EventSummary {
  slug: string;
  name: string;
  shortName: string;
  /** Short dropdown label; empty when unset, so show `navLabel || name`. */
  navLabel: string;
  startsAt: Date;
  endsAt: Date;
  city: string;
  country: string;
  timing: EventTiming;
}

export interface PublicCategory {
  slug: string;
  name: string;
  description: string;
  feeCents: number;
  currency: string;
  approvalMode: "AUTOMATIC" | "MANUAL_REVIEW";
  seatLimit: number | null;
  opensAt: Date | null;
  closesAt: Date | null;
  /** Active and inside its opens/closes window right now. A closed one is still listed, shown as "Closed". */
  open: boolean;
}

export interface PublicEvent extends EventSummary {
  details: EventDetails;
  content: EventPageContent;
  categories: PublicCategory[];
}

export interface AdminEventRow extends EventSummary {
  /** The event's own time zone: startsAt/endsAt are instants, so showing their calendar day needs it. */
  timezone: string;
  status: EventStatus;
  updatedAt: Date;
}

export interface EventForEdit extends AdminEventRow {
  details: EventDetails;
  content: EventPageContent;
}

export class EventStoreUnavailable extends Error {}
export class EventStoreError extends Error {
  code: "SLUG_TAKEN" | "NOT_FOUND" | "INVALID" | "STALE";
  constructor(code: EventStoreError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Seeds (the no-database fallback and the source for prisma/seed.ts)
// ---------------------------------------------------------------------------

function parseSeed(j: { details: unknown; content: unknown }) {
  return { details: eventDetailsSchema.parse(j.details), content: eventPageSchema.parse(j.content) };
}
export const EVENT_SEEDS: Record<string, { details: EventDetails; content: EventPageContent }> = {
  "fms-thailand": parseSeed(fmsThailandJson),
  "sism-2026": parseSeed(sism2026Json),
};
const seedCategories = Object.fromEntries(buildSeed(eventsJson).map((e) => [e.slug, e.categories]));

// ---------------------------------------------------------------------------
// Dates: details hold YYYY-MM-DD in the event's own time zone; the database holds instants.
// ---------------------------------------------------------------------------

const zoneParts = (at: Date, tz: string) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(at)
      .map((p) => [p.type, Number(p.value)]),
  );

function zoneOffsetMs(at: Date, tz: string): number {
  const p = zoneParts(at, tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - at.getTime();
}

/** The instant when the clock in `tz` shows `ymd` `hm`. The offsets a day either side are the candidates (a clock change moves
 * the offset at most once in that span); the one that reads back as the same wall time wins (an ambiguous time gets its earlier
 * occurrence). A time a clock change skips resolves to the nearest instant that is still on `ymd`. */
export function localToDate(ymd: string, hm: string, tz: string): Date {
  const wall = new Date(`${ymd}T${hm}:00Z`).getTime();
  const day = 86_400_000;
  const candidates = [...new Set([zoneOffsetMs(new Date(wall - day), tz), zoneOffsetMs(new Date(wall + day), tz)])].map((o) => wall - o).sort((a, b) => a - b);
  const exact = candidates.find((c) => c + zoneOffsetMs(new Date(c), tz) === wall);
  return new Date(exact ?? candidates.reverse().find((c) => dateToLocal(new Date(c), tz) === ymd) ?? candidates[0]);
}

export function dateToLocal(at: Date, tz: string): string {
  const p = zoneParts(at, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** An event runs from 00:00 on its first day to 23:59 on its last, local time. */
export function eventDates(d: Pick<EventDetails, "startsAt" | "endsAt" | "timezone">): { startsAt: Date; endsAt: Date } {
  try {
    return { startsAt: localToDate(d.startsAt, "00:00", d.timezone), endsAt: localToDate(d.endsAt, "23:59", d.timezone) };
  } catch {
    throw new EventStoreError("INVALID", `Unknown time zone "${d.timezone}". Use a name like Asia/Kuala_Lumpur.`);
  }
}

/** The Event columns that come from the details form. */
export function eventRowFields(d: EventDetails, seo: EventPageContent["seo"]) {
  return {
    name: d.name,
    shortName: d.shortName || null,
    theme: d.theme || null,
    ...eventDates(d),
    timezone: d.timezone,
    venue: d.venue || null,
    city: d.city || null,
    country: d.country || null,
    navLabel: d.navLabel || null,
    timingOverride: d.timingOverride || null,
    seoTitle: seo.title || null,
    seoDescription: seo.description || null,
  };
}

type EventRow = Prisma.EventGetPayload<Record<string, never>>;

function rowToDetails(r: EventRow): EventDetails {
  return {
    name: r.name,
    shortName: r.shortName ?? "",
    theme: r.theme ?? "",
    startsAt: dateToLocal(r.startsAt, r.timezone),
    endsAt: dateToLocal(r.endsAt, r.timezone),
    timezone: r.timezone,
    venue: r.venue ?? "",
    city: r.city ?? "",
    country: r.country ?? "",
    navLabel: r.navLabel ?? "",
    timingOverride: r.timingOverride ?? "",
  };
}

function summary(slug: string, d: EventDetails, dates: { startsAt: Date; endsAt: Date }, now = new Date()): EventSummary {
  return {
    slug,
    name: d.name,
    shortName: d.shortName,
    navLabel: d.navLabel,
    ...dates,
    city: d.city,
    country: d.country,
    timing: eventTiming({ endsAt: dates.endsAt, timingOverride: d.timingOverride || null }, now),
  };
}

const rowSummary = (r: EventRow, now = new Date()) => summary(r.slug, rowToDetails(r), { startsAt: r.startsAt, endsAt: r.endsAt }, now);

/** Upcoming first (soonest start), then past (latest start first). */
function sortEvents<T extends EventSummary>(list: T[]): T[] {
  const up = list.filter((e) => e.timing === "upcoming").sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const past = list.filter((e) => e.timing === "past").sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
  return [...up, ...past];
}

// ---------------------------------------------------------------------------
// Default content for a new event, and merging stored sections over defaults
// ---------------------------------------------------------------------------

const PAST_SECTIONS: EventSectionKey[] = ["highlights", "overview", "ambassadors", "chapters", "schedule", "speakers", "gallery", "videos", "stories", "cta"];
const UPCOMING_SECTIONS: EventSectionKey[] = ["highlights", "overview", "categories", "lists", "schedule", "speakers", "partners", "faq", "cta"];

function dateRange(d: Pick<EventDetails, "startsAt" | "endsAt">): string {
  const f = (ymd: string) => new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return d.startsAt === d.endsAt ? f(d.startsAt) : `${f(d.startsAt)} to ${f(d.endsAt)}`;
}

/** A valid starting page for a new event. The team fills it in from the admin; nothing here claims facts about the event. */
export function defaultEventContent(kind: EventKind, details: EventDetails): EventPageContent {
  const shown = new Set<EventSectionKey>(kind === "past" ? PAST_SECTIONS : UPCOMING_SECTIONS);
  const v = (k: EventSectionKey) => shown.has(k);
  // A stand-in until the team uploads real photos.
  const placeholder = { src: "/media/logos/gyn-logo.png", alt: "Global Youth Network" };
  const none = { kicker: "", heading: "" };
  const cta = kind === "upcoming" ? { label: "Register", href: "#categories" } : { label: "Contact us", href: "/contact-us" };
  const place = [details.venue, details.city].filter(Boolean).join(", ");
  return {
    seo: { title: details.name, description: details.theme },
    hero: {
      kicker: details.shortName,
      headline: details.name,
      lead: details.theme,
      chips: [{ label: dateRange(details) }, ...(place ? [{ label: place }] : [])],
      photos: [placeholder],
      primaryCta: cta,
      secondaryCta: { label: "", href: "/" },
    },
    highlights: { visible: v("highlights"), items: [] },
    overview: { visible: v("overview"), kicker: "About the event", heading: "About *this event*", text: details.theme, image: placeholder },
    categories: { visible: v("categories"), kicker: "Registration", heading: "Choose how you *join*", intro: "", note: "" },
    steps: { visible: v("steps"), kicker: "How to apply", heading: "How to *apply*", items: [] },
    lists: { visible: v("lists"), kicker: "Eligibility", heading: "Who can *apply*", intro: "", groups: [] },
    ambassadors: {
      visible: v("ambassadors"),
      kicker: "GYN ambassadors",
      heading: "Our *ambassadors*",
      intro: "",
      hub: { label: details.city, lon: 0, lat: 0 },
      people: [],
      primaryCta: { label: "", href: "/" },
      secondaryCta: { label: "", href: "/" },
    },
    chapters: { visible: v("chapters"), ...none, items: [] },
    schedule: { visible: v("schedule"), kicker: "Schedule", heading: "The *programme*", days: [] },
    speakers: { visible: v("speakers"), kicker: "Speakers", heading: "Our *speakers*", people: [] },
    partners: { visible: v("partners"), kicker: "Partners", heading: "Our *partners*", items: [] },
    gallery: { visible: v("gallery"), kicker: "Gallery", heading: "Photos from *the event*", photos: [] },
    videos: { visible: v("videos"), kicker: "Videos", heading: "Watch *the highlights*", items: [] },
    stories: { visible: v("stories"), kicker: "Stories", heading: "Delegate *stories*", quotes: [] },
    faq: { visible: v("faq"), kicker: "Questions", heading: "Frequently asked *questions*", items: [] },
    cta: { visible: v("cta"), heading: "Be part of the *next one*", text: "", primaryCta: cta, secondaryCta: { label: "", href: "/" } },
  };
}

/** Any stored section that no longer fits the schema falls back to the default, so one bad block never blanks the page. */
export function mergeEventContent(defaults: EventPageContent, stored: Partial<Record<string, unknown>>, label = "event"): EventPageContent {
  const out = { ...defaults } as Record<string, unknown>;
  for (const key of EVENT_SECTIONS) {
    if (!(key in stored)) continue;
    const parsed = eventPageSchema.shape[key].safeParse(stored[key]);
    if (parsed.success) out[key] = parsed.data;
    else console.error(`[events] ${label}: stored section "${key}" is invalid, using default`, parsed.error.issues[0]);
  }
  return out as EventPageContent;
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

type Db = PrismaClient | Prisma.TransactionClient;

function defaultsFor(slug: string, details: EventDetails, timing: EventTiming): EventPageContent {
  return EVENT_SEEDS[slug]?.content ?? defaultEventContent(timing, details);
}

async function loadContent(db: Db, row: EventRow): Promise<EventPageContent> {
  const sections = await db.eventSection.findMany({ where: { eventId: row.id } });
  const details = rowToDetails(row);
  return mergeEventContent(defaultsFor(row.slug, details, rowSummary(row).timing), Object.fromEntries(sections.map((s) => [s.blockType, s.data])), row.slug);
}

const seedSummaries = () => Object.entries(EVENT_SEEDS).map(([slug, s]) => summary(slug, s.details, eventDates(s.details)));

/** Published events, upcoming first then past. A failed database read serves the seed only during the build (read-fallback.ts); at runtime it throws so ISR keeps the last good page. */
export async function listPublicEvents(): Promise<EventSummary[]> {
  const prisma = getPrisma();
  if (!prisma) return sortEvents(seedSummaries());
  try {
    const now = new Date();
    const rows = await prisma.event.findMany({ where: { status: "PUBLISHED", deletedAt: null } });
    return sortEvents(rows.map((r) => rowSummary(r, now)));
  } catch (err) {
    if (!seedOnReadError()) throw err;
    console.error("[events] database read failed during the build, using seed", err instanceof Error ? err.message : err);
    return sortEvents(seedSummaries());
  }
}

function fromSeed(slug: string): PublicEvent | null {
  const s = EVENT_SEEDS[slug];
  if (!s) return null;
  const now = new Date();
  const open = (c: SeedCategory) => c.active && (!c.closesAt || c.closesAt >= now);
  return {
    ...summary(slug, s.details, eventDates(s.details), now),
    details: s.details,
    content: s.content,
    categories: (seedCategories[slug] ?? []).map((c) => ({ ...c, description: "", currency: "USD", opensAt: null, open: open(c) })),
  };
}

/** A published event with its page content, or null (unknown, draft, archived or deleted: the page should 404). */
export async function getPublicEvent(slug: string): Promise<PublicEvent | null> {
  const prisma = getPrisma();
  if (!prisma) return fromSeed(slug);
  try {
    const row = await prisma.event.findFirst({
      where: { slug, status: "PUBLISHED", deletedAt: null },
      include: { categories: { where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }] } },
    });
    if (!row) return null;
    const now = new Date();
    const details = rowToDetails(row);
    return {
      ...rowSummary(row, now),
      details,
      content: await loadContent(prisma, row),
      categories: row.categories.map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description ?? "",
        feeCents: c.feeCents,
        currency: c.currency,
        approvalMode: c.approvalMode,
        seatLimit: c.seatLimit,
        opensAt: c.opensAt,
        closesAt: c.closesAt,
        open: c.active && (!c.opensAt || c.opensAt <= now) && (!c.closesAt || c.closesAt >= now),
      })),
    };
  } catch (err) {
    if (!seedOnReadError()) throw err;
    console.error(`[events] database read failed for "${slug}" during the build, using seed`, err instanceof Error ? err.message : err);
    return fromSeed(slug);
  }
}

// ---------------------------------------------------------------------------
// Admin: needs the database
// ---------------------------------------------------------------------------

function needDb(): PrismaClient {
  const prisma = getPrisma();
  if (!prisma) throw new EventStoreUnavailable("Events need a database. Set DATABASE_URL.");
  return prisma;
}

const adminRow = (r: EventRow): AdminEventRow => ({ ...rowSummary(r), timezone: r.timezone, status: r.status, updatedAt: r.updatedAt });

/** Every event that is not deleted, drafts and archived included: upcoming first, then past. */
export async function listAllEvents(): Promise<AdminEventRow[]> {
  const rows = await needDb().event.findMany({ where: { deletedAt: null } });
  return sortEvents(rows.map(adminRow));
}

async function readForEdit(db: Db, slug: string): Promise<EventForEdit | null> {
  const row = await db.event.findFirst({ where: { slug, deletedAt: null } });
  return row ? { ...adminRow(row), details: rowToDetails(row), content: await loadContent(db, row) } : null;
}

export async function getEventForEdit(slug: string): Promise<EventForEdit | null> {
  return readForEdit(needDb(), slug);
}

export const sectionRows = (eventId: string, content: EventPageContent) =>
  EVENT_SECTIONS.map((key, sortOrder) => {
    const data = content[key];
    return { eventId, blockType: key, sortOrder, visible: "visible" in data ? data.visible : true, data };
  });

const isUniqueViolation = (err: unknown) => typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";

/** New events start as drafts. The slug is the page's address and never changes afterwards. */
export async function createEvent(input: { slug: string; details: EventDetails; kind: EventKind }, meta: AuditMeta): Promise<void> {
  const prisma = needDb();
  const slug = slugSchema.safeParse(input.slug);
  const details = eventDetailsSchema.safeParse(input.details);
  if (!slug.success || !details.success) throw new EventStoreError("INVALID", (slug.error ?? details.error)!.issues[0].message);
  const content = defaultEventContent(input.kind, details.data);
  try {
    await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({ data: { slug: slug.data, status: "DRAFT", ...eventRowFields(details.data, content.seo) } });
      await tx.eventSection.createMany({ data: sectionRows(event.id, content) });
      await tx.auditLog.create({
        data: {
          userId: meta.userId ?? null,
          userEmail: meta.actor,
          action: "EVENT_CREATED",
          entityType: "Event",
          entityId: event.id,
          newValue: { slug: slug.data, kind: input.kind, details: details.data },
          ip: meta.ip,
        },
      });
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw new EventStoreError("SLUG_TAKEN", `The address /${slug.data} is already used by another event.`);
    throw err;
  }
}

/**
 * Replaces the details and every section. Old and new versions go to the audit log so a bad edit can be rolled back by hand.
 * `expectedUpdatedAt` is the event's `updatedAt` (ISO string) from when the editor loaded it; if the row has changed since, nothing is
 * written and the error code is 'STALE'. Returns the new `updatedAt`, to send with the next save.
 */
export async function saveEvent(slug: string, input: { details: EventDetails; content: EventPageContent; expectedUpdatedAt: string }, meta: AuditMeta): Promise<string> {
  const prisma = needDb();
  const expected = new Date(input.expectedUpdatedAt);
  if (Number.isNaN(expected.getTime())) throw new EventStoreError("INVALID", "Missing the version this edit started from. Reload the page.");
  const details = eventDetailsSchema.safeParse(input.details);
  const content = eventPageSchema.safeParse(input.content);
  if (!details.success || !content.success) throw new EventStoreError("INVALID", (details.error ?? content.error)!.issues[0].message);
  return prisma.$transaction(async (tx) => {
    const previous = await readForEdit(tx, slug);
    if (!previous) throw new EventStoreError("NOT_FOUND", `No event at /${slug}.`);
    // The version check is part of the UPDATE, so two saves that read the same version cannot both win (the second waits on the row, then matches nothing).
    const changed = await tx.event.updateMany({ where: { slug, deletedAt: null, updatedAt: expected }, data: eventRowFields(details.data, content.data.seo) });
    if (changed.count === 0) throw new EventStoreError("STALE", "Someone else saved this event since you opened it. Reload to see their changes.");
    const event = await tx.event.findFirstOrThrow({ where: { slug } });
    await tx.eventSection.deleteMany({ where: { eventId: event.id } });
    await tx.eventSection.createMany({ data: sectionRows(event.id, content.data) });
    await tx.auditLog.create({
      data: {
        userId: meta.userId ?? null,
        userEmail: meta.actor,
        action: "EVENT_UPDATED",
        entityType: "Event",
        entityId: event.id,
        oldValue: { details: previous.details, content: previous.content },
        newValue: { details: details.data, content: content.data },
        ip: meta.ip,
      },
    });
    return event.updatedAt.toISOString();
  });
}

/** Publish, unpublish (back to DRAFT) or archive. */
export async function setEventStatus(slug: string, status: EventStatus, meta: AuditMeta): Promise<void> {
  const prisma = needDb();
  await prisma.$transaction(async (tx) => {
    const event = await tx.event.findFirst({ where: { slug, deletedAt: null } });
    if (!event) throw new EventStoreError("NOT_FOUND", `No event at /${slug}.`);
    if (event.status === status) return;
    await tx.event.update({ where: { id: event.id }, data: { status } });
    await tx.auditLog.create({
      data: {
        userId: meta.userId ?? null,
        userEmail: meta.actor,
        action: "EVENT_STATUS_CHANGED",
        entityType: "Event",
        entityId: event.id,
        oldValue: { status: event.status },
        newValue: { status },
        ip: meta.ip,
      },
    });
  });
}
