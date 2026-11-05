// PrismaRepo: PostgreSQL-backed implementation of the Repo interface.
// Node runtime only: PrismaClient uses @prisma/adapter-pg (not available in Edge).
// Used by lib/db.ts when DATABASE_URL is set.
//
// shortcut: only the contact form and the webhook dedupe table are wired to the new schema. The old fixed-ticket
// registration flow was built on tables that no longer exist, and phase 6 of docs/backend-plan.md replaces it with
// dynamic forms and the new Registration and Payment models. Until then those methods refuse, so nothing can half-save.

import { PrismaClient, Prisma } from "@prisma/client";
import type { PaymentRecord, Repo, RegistrationRecord, TicketRecord } from "./repo.ts";

export class LegacyFlowRemoved extends Error {
  constructor() {
    super("The old registration flow was removed with the old schema. Dynamic forms replace it (docs/backend-plan.md, phase 6).");
  }
}

/** True for Prisma unique constraint violation (P2002). */
function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export class PrismaRepo implements Repo {
  constructor(private readonly prisma: PrismaClient) {}

  async getTicket(): Promise<TicketRecord | null> {
    throw new LegacyFlowRemoved();
  }
  async referenceExists(): Promise<boolean> {
    throw new LegacyFlowRemoved();
  }
  async createRegistration(): Promise<RegistrationRecord> {
    throw new LegacyFlowRemoved();
  }
  async setPaymentSession(): Promise<void> {
    throw new LegacyFlowRemoved();
  }
  async findPaymentBySession(): Promise<PaymentRecord | null> {
    throw new LegacyFlowRemoved();
  }
  async findPaymentByCharge(): Promise<PaymentRecord | null> {
    throw new LegacyFlowRemoved();
  }
  async getRegistrationDetails(): Promise<{
    email: string;
    recipientName: string;
    reference: string;
    ticketName: string;
    amountCents: number;
  } | null> {
    throw new LegacyFlowRemoved();
  }
  async confirmRegistration(): Promise<void> {
    throw new LegacyFlowRemoved();
  }
  async failPayment(): Promise<void> {
    throw new LegacyFlowRemoved();
  }
  async processRefund(): Promise<void> {
    throw new LegacyFlowRemoved();
  }

  async insertWebhookEvent(providerEventId: string, eventType: string, payload: unknown): Promise<boolean> {
    try {
      await this.prisma.webhookEvent.create({
        data: { provider: "STRIPE", providerEventId, eventType, payload: payload as Prisma.InputJsonObject },
      });
      return true;
    } catch (e) {
      if (isUniqueViolation(e)) return false;
      throw e;
    }
  }

  async saveContactSubmission(data: {
    name: string;
    email: string;
    topic: string;
    message: string;
    ip?: string;
  }): Promise<void> {
    await this.prisma.contactMessage.create({
      data: { name: data.name, email: data.email, topic: data.topic, message: data.message, ipAddress: data.ip },
    });
  }
}
