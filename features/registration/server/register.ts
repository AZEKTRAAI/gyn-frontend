// Pure registration handler logic — factored out of the route handler so it can be unit-tested
// without an HTTP layer. The route just calls handleRegistration() and wraps the result.

import { z } from "zod";
import { registrationInput, TICKETS, type RegistrationInput } from "../schema.ts";
import { generateReference } from "../../../lib/server/reference.ts";
import { type Repo } from "../../../lib/server/repo.ts";
import { formatMoney, money } from "../../payments/types.ts";

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export type RegistrationSuccess = {
  ok: true;
  checkoutUrl: string;
  reference: string;
};

export type RegistrationError =
  | { ok: false; status: 400; fieldErrors: Record<string, string[]> }
  | { ok: false; status: 409; error: string }
  | { ok: false; status: 429; error: string }
  | { ok: false; status: 500; error: string };

export type RegistrationResult = RegistrationSuccess | RegistrationError;

// ---------------------------------------------------------------------------
// Honeypot schema (website field must be absent or empty)
// ---------------------------------------------------------------------------

const honeypotSchema = z.object({
  website: z.string().max(0).optional(),
});

// ---------------------------------------------------------------------------
// Handler inputs (dependencies injected so tests can mock them)
// ---------------------------------------------------------------------------

export interface HandleRegistrationDeps {
  repo: Repo;
  rateLimitAllowed: boolean;
  /** Call Stripe / other provider and return redirect URL. Null = demo mode. */
  createCheckout: ((params: {
    reference: string;
    ticketName: string;
    amountCents: number;
    email: string;
    idempotencyKey: string;
    paymentId: string;
  }) => Promise<{ checkoutUrl: string; sessionId: string }>) | null;
  baseUrl: string;
}

export async function handleRegistration(
  rawBody: unknown,
  deps: HandleRegistrationDeps
): Promise<RegistrationResult> {
  // 1. Rate limit
  if (!deps.rateLimitAllowed) {
    return { ok: false, status: 429, error: "Too many requests. Please wait a few minutes and try again." };
  }

  // 2. Honeypot — bot check on raw body before Zod parsing
  const honeypot = honeypotSchema.safeParse(rawBody);
  if (!honeypot.success || (honeypot.data.website && honeypot.data.website.length > 0)) {
    return { ok: false, status: 400, fieldErrors: { form: ["Invalid submission."] } };
  }

  // 3. Parse + validate
  const parsed = registrationInput.safeParse(rawBody);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      (fieldErrors[path] ??= []).push(issue.message);
    }
    return { ok: false, status: 400, fieldErrors };
  }

  const input: RegistrationInput = parsed.data;
  const ticket = TICKETS[input.ticket];

  // 4. Check ticket status in the repo
  const ticketRecord = await deps.repo.getTicket(ticket.eventId, input.ticket);
  if (!ticketRecord || ticketRecord.status !== "OPEN") {
    return {
      ok: false,
      status: 409,
      error: `The "${ticket.name}" ticket is no longer available. Please contact us if you believe this is an error.`,
    };
  }

  // 5. Generate reference
  const reference = await generateReference(
    "SISM",
    (ref) => deps.repo.referenceExists(ref)
  );

  const idempotencyKey = `reg-${reference}-${Date.now()}`;
  const email = "email" in input.details ? input.details.email : "";

  // Build attendee data — never include passportNumber (PII; used only for letter generation)
  // Passport number is acknowledged here but deliberately excluded from storage.
  const attendeeData: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(input.details)) {
    if (k === "passportNumber") continue; // PII: not stored per docs/schema.md
    attendeeData[k] = v as string | undefined;
  }

  // 6. Create DB records
  const reg = await deps.repo.createRegistration({
    eventId: ticketRecord.eventId,
    ticketId: ticketRecord.id,
    ticketName: ticket.name,
    attendeeData,
    finalAmountCents: ticket.amountCents,
    reference,
    idempotencyKey,
  });

  // 7. Checkout URL
  if (deps.createCheckout) {
    try {
      const { checkoutUrl, sessionId } = await deps.createCheckout({
        reference,
        ticketName: ticket.name,
        amountCents: ticket.amountCents,
        email,
        idempotencyKey,
        paymentId: reg.paymentId,
      });
      await deps.repo.setPaymentSession(reg.paymentId, sessionId);
      return { ok: true, checkoutUrl, reference };
    } catch (err) {
      console.error({ msg: "registration: Stripe checkout error", reference, error: String(err) });
      return { ok: false, status: 500, error: "Payment provider error. Please try again or contact support." };
    }
  }

  // Demo mode: no Stripe
  const demoUrl = `${deps.baseUrl}/sism-2026/registered?ref=${encodeURIComponent(reference)}&ticket=${encodeURIComponent(input.ticket)}&demo=1`;
  return { ok: true, checkoutUrl: demoUrl, reference };
}

// Re-export for convenience in the route
export { formatMoney, money };
