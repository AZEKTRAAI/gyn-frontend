// Contact form messages: saved by the website, read and triaged in the admin inbox.
// Everything here needs the database. Message text is untrusted: callers must escape it when showing it (React does).

import type { ContactMessage, Prisma } from "@prisma/client";
import { getPrisma } from "./db.ts";

export type ContactStatus = "NEW" | "READ" | "ARCHIVED";
export const CONTACT_STATUSES: readonly ContactStatus[] = ["NEW", "READ", "ARCHIVED"];
// Same list as the website form (features/contact/server/contact.ts).
export const CONTACT_TOPICS = ["general", "partnership", "group-booking", "media"] as const;
export type AuditMeta = { actor: string; userId?: string | null; ip: string | null };

export class ContactStoreUnavailable extends Error {}
export class ContactStoreError extends Error {
  code: "NOT_FOUND" | "INVALID";
  constructor(code: ContactStoreError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

function needDb() {
  const prisma = getPrisma();
  if (!prisma) throw new ContactStoreUnavailable("The contact inbox needs a database. Set DATABASE_URL.");
  return prisma;
}

/** The website passes "unknown" when no proxy header exists. Store nothing rather than a fake address. */
export function cleanIp(ip: string | null | undefined): string | null {
  const v = (ip ?? "").trim();
  return !v || v === "unknown" ? null : v.slice(0, 64);
}

/** First non-empty line, cut to `max` characters, for the inbox table. */
export function firstLine(text: string, max = 90): string {
  const line = text.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const t = line.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** Unknown or empty filter values (a hand-edited URL) mean "no filter". */
export function parseFilters(raw: { status?: string | string[]; topic?: string | string[] }): { status?: ContactStatus; topic?: string } {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const status = one(raw.status)?.toUpperCase();
  const topic = one(raw.topic);
  return {
    status: CONTACT_STATUSES.find((s) => s === status),
    topic: CONTACT_TOPICS.find((t) => t === topic),
  };
}

/** Called by the website after it validated the form. Throws when the write fails: the caller must not report success. */
export async function saveContactMessage(input: { name: string; email: string; topic: string; message: string; ip?: string | null }): Promise<void> {
  await needDb().contactMessage.create({
    data: { name: input.name, email: input.email, topic: input.topic, message: input.message, ipAddress: cleanIp(input.ip) },
  });
}

const LIST_LIMIT = 200;

/** Newest first. Capped: an inbox of thousands needs paging, which is not built yet. */
export async function listContactMessages(filters: { status?: ContactStatus; topic?: string }): Promise<ContactMessage[]> {
  const where: Prisma.ContactMessageWhereInput = { ...(filters.status && { status: filters.status }), ...(filters.topic && { topic: filters.topic }) };
  return needDb().contactMessage.findMany({ where, orderBy: { submittedAt: "desc" }, take: LIST_LIMIT });
}

export const countUnreadContactMessages = (): Promise<number> => needDb().contactMessage.count({ where: { status: "NEW" } });

export async function getContactMessage(id: string): Promise<ContactMessage | null> {
  return needDb().contactMessage.findUnique({ where: { id } });
}

/** Changes the status and writes CONTACT_STATUS_CHANGED to the audit log in the same transaction. */
export async function setContactStatus(id: string, status: string, meta: AuditMeta): Promise<void> {
  const next = CONTACT_STATUSES.find((s) => s === status);
  if (!next) throw new ContactStoreError("INVALID", "Unknown status.");
  await needDb().$transaction(async (tx) => {
    const row = await tx.contactMessage.findUnique({ where: { id } });
    if (!row) throw new ContactStoreError("NOT_FOUND", "This message no longer exists.");
    if (row.status === next) return;
    await tx.contactMessage.update({ where: { id }, data: { status: next, readAt: next === "NEW" ? null : (row.readAt ?? new Date()) } });
    await tx.auditLog.create({
      data: {
        userId: meta.userId ?? null,
        userEmail: meta.actor,
        action: "CONTACT_STATUS_CHANGED",
        entityType: "ContactMessage",
        entityId: id,
        oldValue: { status: row.status },
        newValue: { status: next },
        ip: meta.ip,
      },
    });
  });
}
