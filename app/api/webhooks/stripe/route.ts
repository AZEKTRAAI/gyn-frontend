// Node runtime: verifies Stripe webhook signatures using Node crypto.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "sin1"; // Neon Singapore; avoids cross-Pacific DB round-trips

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

  // Process first, record after — this lets email failures surface as 5xx so Stripe retries.
  // DB transitions (confirmRegistration, failPayment, processRefund) are idempotent,
  // so reprocessing the same event on retry is safe.
  // insertWebhookEvent's unique constraint prevents concurrent double-processing.
  try {
    await processEvent(repo, event.type, event.data.object);
  } catch (err) {
    console.error({ msg: "webhook/stripe: processing error", eventId: event.id, type: event.type, error: String(err) });
    // Return 5xx so Stripe retries — DB state is idempotent, email will be retried too.
    return NextResponse.json({ error: "Processing failed; will retry." }, { status: 500 });
  }

  // Record the event after full success; unique constraint prevents double-recording on races.
  await repo.insertWebhookEvent(event.id, event.type, event.data.object);

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
      const amountRefunded = Number(obj["amount_refunded"] ?? 0);
      const chargeAmount = Number(obj["amount"] ?? 0);
      const isFull = amountRefunded >= chargeAmount;
      // Use the first refund's provider ID if available, otherwise fall back to charge ID
      const refunds = obj["refunds"] as { data?: { id?: string }[] } | undefined;
      const providerRefundId = refunds?.data?.[0]?.id ?? chargeId;

      const payment = await repo.findPaymentByCharge(chargeId);
      if (!payment) {
        console.warn({ msg: "webhook/stripe: charge not found for refund", chargeId });
        break;
      }
      await repo.processRefund(payment.id, payment.registrationId, amountRefunded, providerRefundId, isFull);
      break;
    }

    default:
      // Unhandled event types are silently ignored (Stripe sends many event types).
      console.log({ msg: "webhook/stripe: unhandled event type", eventType });
  }
}

async function sendConfirmation(
  repo: ReturnType<typeof getRepo>,
  registrationId: string,
  amountCents: number
): Promise<void> {
  void amountCents; // amountCents comes from details; param kept for call-site symmetry
  const details = await repo.getRegistrationDetails(registrationId);
  if (!details) {
    console.warn({ msg: "webhook/stripe: registration not found for confirmation email", registrationId });
    return;
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://thegyn.org";
  await sendRegistrationConfirmation({
    to: details.email,
    recipientName: details.recipientName,
    reference: details.reference,
    ticketName: details.ticketName,
    amountUsd: formatMoney({ amountCents: details.amountCents, currency: "usd" }),
    eventDates: "19–22 November 2026",
    venue: "Teedo Hotel, Kuala Lumpur, Malaysia",
    refundPolicyUrl: `${baseUrl}/refund-policy`,
  });
}
