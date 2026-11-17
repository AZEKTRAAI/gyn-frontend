// Registration categories of an event, as the admin edits them. Never hard-deleted: registrations point at categories, so
// "remove" sets deletedAt (the public page and this list stop showing it, the registrations keep their category).
// Every write is one transaction with an AuditLog row. Dates are calendar days in the event's own time zone.

import type { Prisma, PrismaClient } from "@prisma/client";
import { categoryFormSchema, centsToFee, type CategoryData, type CategoryFormValues } from "./category-schema.ts";
import { getPrisma } from "./db.ts";
import { dateToLocal, EventStoreError, EventStoreUnavailable, localToDate, type AuditMeta } from "./event-store.ts";

/** open: taking registrations now. off: switched off by the team. not-yet / ended: outside its opens/closes window. */
export type CategoryPhase = "open" | "off" | "not-yet" | "ended";

export interface CategoryRow {
  id: string;
  values: CategoryFormValues;
  sortOrder: number;
  /** Registrations (any status) that point at this category. While there are any, the address cannot change. */
  registrations: number;
  phase: CategoryPhase;
}

type Db = PrismaClient | Prisma.TransactionClient;
type Row = Prisma.RegistrationCategoryGetPayload<Record<string, never>>;

function needDb(): PrismaClient {
  const prisma = getPrisma();
  if (!prisma) throw new EventStoreUnavailable("Events need a database. Set DATABASE_URL.");
  return prisma;
}

const isUniqueViolation = (err: unknown) => typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";

export function categoryPhase(c: Pick<Row, "active" | "opensAt" | "closesAt">, now = new Date()): CategoryPhase {
  if (!c.active) return "off";
  if (c.opensAt && c.opensAt > now) return "not-yet";
  if (c.closesAt && c.closesAt < now) return "ended";
  return "open";
}

function toValues(c: Row, tz: string): CategoryFormValues {
  return {
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    fee: centsToFee(c.feeCents),
    currency: c.currency,
    approvalMode: c.approvalMode,
    seatLimit: c.seatLimit === null ? "" : String(c.seatLimit),
    active: c.active,
    opensAt: c.opensAt ? dateToLocal(c.opensAt, tz) : "",
    closesAt: c.closesAt ? dateToLocal(c.closesAt, tz) : "",
  };
}

/** What the audit log keeps: the stored fields, in a stable shape. */
const snapshot = (c: Row) => ({
  slug: c.slug,
  name: c.name,
  description: c.description,
  feeCents: c.feeCents,
  currency: c.currency,
  approvalMode: c.approvalMode,
  seatLimit: c.seatLimit,
  sortOrder: c.sortOrder,
  active: c.active,
  opensAt: c.opensAt?.toISOString() ?? null,
  closesAt: c.closesAt?.toISOString() ?? null,
});

/** The event's live (not removed) categories in page order, with what the editor shows. Null when the event does not exist. */
export async function listCategoriesForEdit(eventSlug: string): Promise<CategoryRow[] | null> {
  const event = await needDb().event.findFirst({
    where: { slug: eventSlug, deletedAt: null },
    include: {
      categories: { where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }], include: { _count: { select: { registrations: true } } } },
    },
  });
  if (!event) return null;
  const now = new Date();
  return event.categories.map((c) => ({
    id: c.id,
    values: toValues(c, event.timezone),
    sortOrder: c.sortOrder,
    registrations: c._count.registrations,
    phase: categoryPhase(c, now),
  }));
}

function parse(input: unknown): CategoryData {
  const r = categoryFormSchema.safeParse(input);
  if (!r.success) throw new EventStoreError("INVALID", r.error.issues[0].message);
  return r.data;
}

const liveEvent = async (tx: Db, slug: string) => {
  const event = await tx.event.findFirst({ where: { slug, deletedAt: null } });
  if (!event) throw new EventStoreError("NOT_FOUND", "This event no longer exists. Go back to the events list.");
  return event;
};

const liveCategory = async (tx: Db, eventId: string, id: string) => {
  const c = await tx.registrationCategory.findFirst({ where: { id, eventId, deletedAt: null } });
  if (!c) throw new EventStoreError("NOT_FOUND", "This category no longer exists. Refresh the page to see the current list.");
  return c;
};

/** Keeps the stored instant when its calendar day is unchanged, so saving a form never shifts a time that was set elsewhere (the seed). */
function pickDate(next: string | null, old: Date | null | undefined, hm: string, tz: string): Date | null {
  if (!next) return null;
  return old && dateToLocal(old, tz) === next ? old : localToDate(next, hm, tz);
}

const audit = (meta: AuditMeta, action: string, eventSlug: string, entityId: string, oldValue: Prisma.InputJsonValue | undefined, newValue: Prisma.InputJsonValue | undefined, extra?: object) => ({
  data: {
    userId: meta.userId ?? null,
    userEmail: meta.actor,
    action,
    entityType: "RegistrationCategory",
    entityId,
    oldValue,
    newValue,
    meta: { eventSlug, ...extra },
    ip: meta.ip,
  },
});

const takenMessage = (slug: string) => `Another category of this event already uses the address "${slug}" (a removed category keeps its address). Choose a different one.`;

/** Added at the end of the list. */
export async function createCategory(eventSlug: string, input: unknown, meta: AuditMeta): Promise<void> {
  const prisma = needDb();
  const d = parse(input);
  try {
    await prisma.$transaction(async (tx) => {
      const event = await liveEvent(tx, eventSlug);
      const last = await tx.registrationCategory.aggregate({ where: { eventId: event.id, deletedAt: null }, _max: { sortOrder: true } });
      const created = await tx.registrationCategory.create({
        data: {
          eventId: event.id,
          slug: d.slug,
          name: d.name,
          description: d.description || null,
          feeCents: d.feeCents,
          currency: d.currency,
          approvalMode: d.approvalMode,
          seatLimit: d.seatLimit,
          active: d.active,
          sortOrder: (last._max.sortOrder ?? 0) + 1,
          opensAt: pickDate(d.opensAt, null, "00:00", event.timezone),
          closesAt: pickDate(d.closesAt, null, "23:59", event.timezone),
        },
      });
      await tx.auditLog.create(audit(meta, "CATEGORY_CREATED", eventSlug, created.id, undefined, snapshot(created)));
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw new EventStoreError("SLUG_TAKEN", takenMessage(d.slug));
    throw err;
  }
}

export async function updateCategory(eventSlug: string, id: string, input: unknown, meta: AuditMeta): Promise<void> {
  const prisma = needDb();
  const d = parse(input);
  try {
    await prisma.$transaction(async (tx) => {
      const event = await liveEvent(tx, eventSlug);
      const before = await liveCategory(tx, event.id, id);
      if (d.slug !== before.slug) {
        const n = await tx.registration.count({ where: { categoryId: id } });
        if (n > 0) throw new EventStoreError("INVALID", `${n} registration${n === 1 ? " uses" : "s use"} this category, so its address "${before.slug}" cannot change.`);
      }
      const after = await tx.registrationCategory.update({
        where: { id },
        data: {
          slug: d.slug,
          name: d.name,
          description: d.description || null,
          feeCents: d.feeCents,
          currency: d.currency,
          approvalMode: d.approvalMode,
          seatLimit: d.seatLimit,
          active: d.active,
          opensAt: pickDate(d.opensAt, before.opensAt, "00:00", event.timezone),
          closesAt: pickDate(d.closesAt, before.closesAt, "23:59", event.timezone),
        },
      });
      if (JSON.stringify(snapshot(before)) === JSON.stringify(snapshot(after))) return; // nothing changed: no audit row
      await tx.auditLog.create(audit(meta, "CATEGORY_UPDATED", eventSlug, id, snapshot(before), snapshot(after)));
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw new EventStoreError("SLUG_TAKEN", takenMessage(d.slug));
    throw err;
  }
}

/** Swaps the category with its neighbour. Normally the two sort numbers just trade places, so other categories are untouched. */
export async function moveCategory(eventSlug: string, id: string, direction: "up" | "down", meta: AuditMeta): Promise<void> {
  await needDb().$transaction(async (tx) => {
    const event = await liveEvent(tx, eventSlug);
    const list = await tx.registrationCategory.findMany({ where: { eventId: event.id, deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }] });
    const i = list.findIndex((c) => c.id === id);
    if (i < 0) throw new EventStoreError("NOT_FOUND", "This category no longer exists. Refresh the page to see the current list.");
    const j = direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= list.length) return;
    const next = list.map((c) => c.sortOrder);
    if (list[i].sortOrder !== list[j].sortOrder) [next[i], next[j]] = [next[j], next[i]];
    else {
      // Equal sort numbers cannot be swapped: number the whole list by position instead.
      const order = list.map((_, k) => k);
      [order[i], order[j]] = [order[j], order[i]];
      order.forEach((pos, k) => (next[k] = pos));
    }
    for (const [k, c] of list.entries()) if (next[k] !== c.sortOrder) await tx.registrationCategory.update({ where: { id: c.id }, data: { sortOrder: next[k] } });
    await tx.auditLog.create(audit(meta, "CATEGORY_UPDATED", eventSlug, id, { sortOrder: list[i].sortOrder }, { sortOrder: next[i] }, { change: "reorder", swappedWith: list[j].id }));
  });
}

/** Soft delete: hidden from the page and the editor; registrations keep pointing at it. */
export async function removeCategory(eventSlug: string, id: string, meta: AuditMeta): Promise<void> {
  await needDb().$transaction(async (tx) => {
    const event = await liveEvent(tx, eventSlug);
    const before = await liveCategory(tx, event.id, id);
    await tx.registrationCategory.update({ where: { id }, data: { deletedAt: new Date() } });
    await tx.auditLog.create(audit(meta, "CATEGORY_DELETED", eventSlug, id, snapshot(before), undefined, { registrations: await tx.registration.count({ where: { categoryId: id } }) }));
  });
}
