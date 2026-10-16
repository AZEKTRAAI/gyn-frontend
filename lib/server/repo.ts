// Repository interface used by all API routes.
// DemoStore: in-memory, per-process. Loses data on restart.
// PrismaRepo: full PostgreSQL-backed implementation (see lib/db.ts).
// shortcut: DemoStore only; add PrismaRepo implementation in lib/db.ts when DATABASE_URL + @prisma/adapter-pg are configured

import { TICKETS, type TicketId } from "../../features/registration/schema.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TicketRecord {
  id: string;
  eventId: string;
  slug: string;
  name: string;
  status: "OPEN" | "CLOSED" | "DRAFT";
  priceCents: number;
}

export interface CreateRegistrationInput {
  eventId: string;
  ticketId: string;
  ticketName: string;
  attendeeData: Record<string, string | undefined>;
  finalAmountCents: number;
  reference: string;
  idempotencyKey: string;
}

export interface RegistrationRecord {
  id: string;
  reference: string;
  ticketName: string;
  amountCents: number;
  status: string;
  paymentId: string;
}

export interface PaymentRecord {
  id: string;
  registrationId: string;
  amountCents: number;
  status: string;
  providerSessionId: string | null;
}

export interface Repo {
  /** Returns null if not found. */
  getTicket(eventSlug: string, ticketSlug: string): Promise<TicketRecord | null>;

  /** Check if a reference already exists (for uniqueness). */
  referenceExists(ref: string): Promise<boolean>;

  /** Create attendee + registration + payment atomically. Returns the created registration. */
  createRegistration(input: CreateRegistrationInput): Promise<RegistrationRecord>;

  /** Record the Stripe session ID on the payment row. */
  setPaymentSession(paymentId: string, sessionId: string): Promise<void>;

  // ---------------------------------------------------------------------------
  // Webhook handlers
  // ---------------------------------------------------------------------------

  /**
   * Idempotent insert of a webhook event.
   * Returns true if inserted (new), false if providerEventId already exists.
   */
  insertWebhookEvent(
    providerEventId: string,
    eventType: string,
    payload: unknown
  ): Promise<boolean>;

  /** Find a payment by Stripe Checkout Session ID. */
  findPaymentBySession(sessionId: string): Promise<PaymentRecord | null>;

  /** Mark registration CONFIRMED + payment SUCCEEDED. */
  confirmRegistration(registrationId: string, paymentId: string): Promise<void>;

  /** Mark payment FAILED; registration stays PENDING (can retry). */
  failPayment(paymentId: string): Promise<void>;

  /** Process a refund on a payment. */
  processRefund(
    paymentId: string,
    registrationId: string,
    amountCents: number,
    providerRefundId: string,
    isFull: boolean
  ): Promise<void>;

  // ---------------------------------------------------------------------------
  // Contact form
  // ---------------------------------------------------------------------------

  saveContactSubmission(data: {
    name: string;
    email: string;
    topic: string;
    message: string;
    ip?: string;
  }): Promise<void>;
}

// ---------------------------------------------------------------------------
// DemoStore — in-memory implementation
// ---------------------------------------------------------------------------

// Pre-seeded from TICKETS constant: all open in demo mode.
const DEMO_EVENT_SLUG = "sism-2026";
const DEMO_EVENT_ID = "demo-event-sism-2026";

function seedTickets(): Map<string, TicketRecord> {
  const m = new Map<string, TicketRecord>();
  const entries = Object.entries(TICKETS) as [TicketId, (typeof TICKETS)[TicketId]][];
  for (const [slug, t] of entries) {
    m.set(`${DEMO_EVENT_SLUG}:${slug}`, {
      id: `demo-ticket-${slug}`,
      eventId: DEMO_EVENT_ID,
      slug,
      name: t.name,
      status: "OPEN",
      priceCents: t.amountCents,
    });
  }
  return m;
}

export class DemoStore implements Repo {
  private tickets = seedTickets();
  private registrations = new Map<string, RegistrationRecord & { paymentId: string }>();
  private payments = new Map<string, PaymentRecord & { registrationId: string }>();
  private webhookEvents = new Set<string>();
  private references = new Set<string>();
  private contactSubmissions: unknown[] = [];

  async getTicket(eventSlug: string, ticketSlug: string): Promise<TicketRecord | null> {
    return this.tickets.get(`${eventSlug}:${ticketSlug}`) ?? null;
  }

  async referenceExists(ref: string): Promise<boolean> {
    return this.references.has(ref);
  }

  async createRegistration(input: CreateRegistrationInput): Promise<RegistrationRecord> {
    const regId = `demo-reg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const payId = `demo-pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const payment: PaymentRecord = {
      id: payId,
      registrationId: regId,
      amountCents: input.finalAmountCents,
      status: "PENDING",
      providerSessionId: null,
    };

    const reg: RegistrationRecord = {
      id: regId,
      reference: input.reference,
      ticketName: input.ticketName,
      amountCents: input.finalAmountCents,
      status: "PENDING",
      paymentId: payId,
    };

    this.registrations.set(regId, { ...reg, paymentId: payId });
    this.payments.set(payId, { ...payment, registrationId: regId });
    this.references.add(input.reference);
    return reg;
  }

  async setPaymentSession(paymentId: string, sessionId: string): Promise<void> {
    const p = this.payments.get(paymentId);
    if (p) p.providerSessionId = sessionId;
  }

  async insertWebhookEvent(
    providerEventId: string,
    eventType: string,
    payload: unknown
  ): Promise<boolean> {
    void eventType; void payload; // DemoStore doesn't persist event details
    if (this.webhookEvents.has(providerEventId)) return false;
    this.webhookEvents.add(providerEventId);
    return true;
  }

  async findPaymentBySession(sessionId: string): Promise<PaymentRecord | null> {
    for (const p of this.payments.values()) {
      if (p.providerSessionId === sessionId) return p;
    }
    return null;
  }

  async confirmRegistration(registrationId: string, paymentId: string): Promise<void> {
    const reg = this.registrations.get(registrationId);
    const pay = this.payments.get(paymentId);
    if (reg) reg.status = "CONFIRMED";
    if (pay) pay.status = "SUCCEEDED";
  }

  async failPayment(paymentId: string): Promise<void> {
    const pay = this.payments.get(paymentId);
    if (pay) pay.status = "FAILED";
  }

  async processRefund(
    paymentId: string,
    registrationId: string,
    _amountCents: number,
    _providerRefundId: string,
    isFull: boolean
  ): Promise<void> {
    const pay = this.payments.get(paymentId);
    const reg = this.registrations.get(registrationId);
    if (pay) pay.status = isFull ? "REFUNDED" : "PARTIALLY_REFUNDED";
    if (isFull && reg) reg.status = "REFUNDED";
  }

  async saveContactSubmission(data: {
    name: string;
    email: string;
    topic: string;
    message: string;
    ip?: string;
  }): Promise<void> {
    this.contactSubmissions.push({ ...data, submittedAt: new Date().toISOString() });
    console.log({ msg: "contact: saved submission (demo mode)", name: data.name, topic: data.topic });
  }

  // Test helper: override a ticket's status
  _setTicketStatus(ticketSlug: string, status: TicketRecord["status"]): void {
    const key = `${DEMO_EVENT_SLUG}:${ticketSlug}`;
    const t = this.tickets.get(key);
    if (t) t.status = status;
  }
}
