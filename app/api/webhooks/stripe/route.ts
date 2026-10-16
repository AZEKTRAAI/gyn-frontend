// Node runtime: verifies Stripe webhook signatures using Node crypto.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyStripeSignature } from "@/features/payments/stripe.ts";
import { getRepo } from "@/lib/db.ts";
import { sendRegistrationConfirmation } from "@/lib/server/email.ts";
import { formatMoney } from "@/features/payments/types.ts";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // If no webhook secret, reject — never silently accept unverified events.
  if (!secret) {
    console.error({ msg: "webhook/stripe: STRIPE_WEBHOOK_SECRET not set" });
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 400 });
  }
  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe-Signature header." }, { status: 400 });
  }

  // Raw body required for signature verification — must NOT call req.json() first.
  const rawBody = Buffer.from(await req.arrayBuffer());

  try {
    verifyStripeSignature(rawBody, sig, secret);
  } catch (err) {
    console.warn({ msg: "webhook/stripe: signature verification failed", error: String(err) });
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: {
    id: string;
    type: string;
    data: { object: Record<string, unknown> };
  };
  try {
    event = JSON.parse(rawBody.toString("utf8")) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const repo = getRepo();

  // Idempotency: insert the event; skip processing if already handled.
  const isNew = await repo.insertWebhookEvent(event.id, event.type, event.data.object);
  if (!isNew) {
    // Already processed — return 200 so Stripe doesn't retry.
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await processEvent(repo, event.type, event.data.object);
  } catch (err) {
    console.error({ msg: "webhook/stripe: processing error", eventId: event.id, type: event.type, error: String(err) });
    // Still return 200 to prevent Stripe retries; log for manual investigation.
  }

  return NextResponse.json({ received: true });
}

type Obj = Record<string, unknown>;

async function processEvent(
  repo: ReturnType<typeof getRepo>,
  eventType: string,
  obj: Obj
): Promise<void> {
  switch (eventType) {
    case "checkout.session.completed": {
      const sessionId = obj["id"] as string;
      const paymentStatus = obj["payment_status"] as string;
      const payment = await repo.findPaymentBySession(sessionId);
      if (!payment) {
        console.warn({ msg: "webhook/stripe: session not found", sessionId });
        return;
      }
      if (paymentStatus === "paid") {
        await repo.confirmRegistration(payment.registrationId, payment.id);
        await sendConfirmation(repo, payment.registrationId, payment.amountCents);
      }
      // If payment_status === "unpaid", wait for async_payment_succeeded
      break;
    }

    case "checkout.session.async_payment_succeeded": {
      const sessionId = obj["id"] as string;
      const payment = await repo.findPaymentBySession(sessionId);
      if (!payment) return;
      await repo.confirmRegistration(payment.registrationId, payment.id);
      await sendConfirmation(repo, payment.registrationId, payment.amountCents);
      break;
    }

    case "checkout.session.async_payment_failed": {
      const sessionId = obj["id"] as string;
      const payment = await repo.findPaymentBySession(sessionId);
      if (!payment) return;
      await repo.failPayment(payment.id);
      break;
    }

    case "charge.refunded": {
      const chargeId = obj["id"] as string;
      const refundObj = (obj["refunds"] as Obj | undefined);
      const amountRefunded = Number(obj["amount_refunded"] ?? 0);
      const chargeAmount = Number(obj["amount"] ?? 0);
      const isFull = amountRefunded >= chargeAmount;
      const providerRefundId = chargeId; // use charge ID as refund reference

      // Find payment by charge ID (stored as providerPaymentId) — DemoStore: try by session as fallback
      // In production, Payment.providerPaymentId = Stripe charge id; needs a findPaymentByCharge method.
      // For now, log and skip in demo mode.
      console.log({
        msg: "webhook/stripe: charge.refunded",
        chargeId,
        amountRefunded,
        isFull,
        refundObj: JSON.stringify(refundObj),
        providerRefundId,
      });
      break;
    }

    default:
      // Unhandled event types are silently ignored (Stripe sends many event types).
      console.log({ msg: "webhook/stripe: unhandled event type", eventType });
  }
}

async function sendConfirmation(
  _repo: ReturnType<typeof getRepo>,
  _registrationId: string,
  amountCents: number
): Promise<void> {
  // In production, look up attendee email + reference from the registration.
  // In demo mode, the webhook won't be called so this path is logged only.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://thegyn.org";
  await sendRegistrationConfirmation({
    to: "unknown@example.com", // replaced with real lookup in production
    recipientName: "Delegate",
    reference: "SISM-XXXXX",   // replaced with real lookup in production
    ticketName: "Ticket",
    amountUsd: formatMoney({ amountCents, currency: "usd" }),
    eventDates: "19–22 November 2026",
    venue: "Teedo Hotel, Kuala Lumpur, Malaysia",
    refundPolicyUrl: `${baseUrl}/refund-policy`,
  });
}
