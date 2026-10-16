// PrismaRepo: PostgreSQL-backed implementation of the Repo interface.
// Node runtime only — PrismaClient uses @prisma/adapter-pg (not available in Edge).
// Used by lib/db.ts when DATABASE_URL is set.

import { PrismaClient, Prisma } from "@prisma/client";
import type {
  CreateRegistrationInput,
  PaymentRecord,
  Repo,
  RegistrationRecord,
  TicketRecord,
} from "./repo.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const space = trimmed.indexOf(" ");
  if (space === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space + 1) };
}

/** True for Prisma unique constraint violation (P2002). */
function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

// ---------------------------------------------------------------------------
// PrismaRepo
// ---------------------------------------------------------------------------

export class PrismaRepo implements Repo {
  constructor(private readonly prisma: PrismaClient) {}

  async getTicket(eventSlug: string, ticketSlug: string): Promise<TicketRecord | null> {
    const t = await this.prisma.ticketType.findFirst({
      where: { event: { slug: eventSlug }, slug: ticketSlug, deletedAt: null },
      select: { id: true, eventId: true, slug: true, name: true, status: true, priceCents: true },
    });
    if (!t) return null;
    return {
      id: t.id,
      eventId: t.eventId,
      slug: t.slug,
      name: t.name,
      status: t.status as TicketRecord["status"],
      priceCents: t.priceCents,
    };
  }

  async referenceExists(ref: string): Promise<boolean> {
    const count = await this.prisma.registration.count({ where: { reference: ref } });
    return count > 0;
  }

  async createRegistration(input: CreateRegistrationInput): Promise<RegistrationRecord> {
    const { firstName, lastName } = splitFullName(
      (input.attendeeData["fullName"] as string | undefined) ?? "Unknown"
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const attendee = await tx.attendee.create({
        data: {
          email: (input.attendeeData["email"] as string | undefined) ?? "",
          firstName,
          lastName,
          whatsappNumber:
            (input.attendeeData["whatsapp"] as string | undefined) ??
            (input.attendeeData["contactNumber"] as string | undefined),
          nationality: input.attendeeData["nationality"] as string | undefined,
          countryOfResidence: input.attendeeData["countryOfResidence"] as string | undefined,
          gender: input.attendeeData["gender"] as string | undefined,
          howHeardAboutUs: (input.attendeeData["heardFrom"] as string | undefined) || undefined, // "" from the placeholder means not answered
        },
      });

      const registration = await tx.registration.create({
        data: {
          eventId: input.eventId,
          ticketTypeId: input.ticketId,
          attendeeId: attendee.id,
          reference: input.reference,
          finalAmountCents: input.finalAmountCents,
          idempotencyKey: input.idempotencyKey,
          status: "PENDING",
        },
      });

      const payment = await tx.payment.create({
        data: {
          registrationId: registration.id,
          provider: "STRIPE",
          amountCents: input.finalAmountCents,
          idempotencyKey: `pay-${input.idempotencyKey}`,
          status: "PENDING",
        },
      });

      return { registration, paymentId: payment.id };
    });

    return {
      id: result.registration.id,
      reference: result.registration.reference,
      ticketName: input.ticketName,
      amountCents: input.finalAmountCents,
      status: "PENDING",
      paymentId: result.paymentId,
    };
  }

  async setPaymentSession(paymentId: string, sessionId: string): Promise<void> {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { providerSessionId: sessionId },
    });
  }

  async insertWebhookEvent(
    providerEventId: string,
    eventType: string,
    payload: unknown
  ): Promise<boolean> {
    try {
      await this.prisma.webhookEvent.create({
        data: {
          provider: "STRIPE",
          providerEventId,
          eventType,
          payload: payload as Prisma.InputJsonObject,
        },
      });
      return true;
    } catch (e) {
      if (isUniqueViolation(e)) return false;
      throw e;
    }
  }

  async findPaymentBySession(sessionId: string): Promise<PaymentRecord | null> {
    const p = await this.prisma.payment.findFirst({
      where: { providerSessionId: sessionId },
    });
    if (!p) return null;
    return {
      id: p.id,
      registrationId: p.registrationId,
      amountCents: p.amountCents,
      status: p.status,
      providerSessionId: p.providerSessionId,
    };
  }

  async findPaymentByCharge(chargeId: string): Promise<PaymentRecord | null> {
    const p = await this.prisma.payment.findFirst({
      where: { providerPaymentId: chargeId },
    });
    if (!p) return null;
    return {
      id: p.id,
      registrationId: p.registrationId,
      amountCents: p.amountCents,
      status: p.status,
      providerSessionId: p.providerSessionId,
    };
  }

  async getRegistrationDetails(registrationId: string): Promise<{
    email: string;
    recipientName: string;
    reference: string;
    ticketName: string;
    amountCents: number;
  } | null> {
    const reg = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        attendee: { select: { email: true, firstName: true, lastName: true } },
        ticketType: { select: { name: true } },
      },
    });
    if (!reg) return null;
    return {
      email: reg.attendee.email,
      recipientName: [reg.attendee.firstName, reg.attendee.lastName].filter(Boolean).join(" "),
      reference: reg.reference,
      ticketName: reg.ticketType.name,
      amountCents: reg.finalAmountCents,
    };
  }

  async confirmRegistration(registrationId: string, paymentId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.payment.update({ where: { id: paymentId }, data: { status: "SUCCEEDED" } }),
      this.prisma.registration.update({ where: { id: registrationId }, data: { status: "CONFIRMED" } }),
    ]);
  }

  async failPayment(paymentId: string): Promise<void> {
    await this.prisma.payment.update({ where: { id: paymentId }, data: { status: "FAILED" } });
  }

  async processRefund(
    paymentId: string,
    registrationId: string,
    amountCents: number,
    providerRefundId: string,
    isFull: boolean
  ): Promise<void> {
    const newPayStatus = isFull ? "REFUNDED" : "PARTIALLY_REFUNDED";
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: newPayStatus },
      });
      if (isFull) {
        await tx.registration.update({
          where: { id: registrationId },
          data: { status: "REFUNDED" },
        });
      }
      await tx.refund.create({
        data: {
          paymentId: payment.id,
          registrationId,
          providerRefundId,
          amountCents,
          status: "ISSUED",
        },
      });
    });
  }

  async saveContactSubmission(data: {
    name: string;
    email: string;
    topic: string;
    message: string;
    ip?: string;
  }): Promise<void> {
    // shortcut: contact form saved as FormSubmission requires a FormDefinition row to exist.
    // For now, log and skip DB insert; create a seed FormDefinition in production before launch.
    console.log({
      msg: "contact: submission received (DB upsert skipped — no FormDefinition seed)",
      name: data.name,
      topic: data.topic,
      ip: data.ip,
    });
  }
}
