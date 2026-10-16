// Node runtime: uses Prisma Client and crypto (not available in Edge Runtime).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "sin1"; // Neon Singapore; avoids cross-Pacific DB round-trips

import { NextRequest, NextResponse } from "next/server";
import { getRepo } from "@/lib/db.ts";
import { checkRateLimit } from "@/lib/server/rate-limit.ts";
import { verifyTurnstile, TurnstileError } from "@/lib/server/turnstile.ts";
import { handleRegistration } from "@/features/registration/server/register.ts";
import { createStripeProvider } from "@/features/payments/stripe.ts";
import { money } from "@/features/payments/types.ts";
import { getClientIp } from "@/lib/server/ip.ts";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "Request body must be JSON." } }, { status: 400 });
  }

  // Turnstile (runs before rate limit to avoid wasting a slot on a bot)
  try {
    const token = typeof body === "object" && body !== null && "turnstileToken" in body
      ? (body as Record<string, unknown>).turnstileToken as string | undefined
      : undefined;
    await verifyTurnstile(token);
  } catch (err) {
    if (err instanceof TurnstileError) {
      return NextResponse.json(
        { fieldErrors: { form: [err.message] } },
        { status: 400 }
      );
    }
    console.error({ msg: "registrations: turnstile unexpected error", error: String(err) });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } }, { status: 500 });
  }

  // Two independent rate limit checks: per-IP (campus groups) and per-email (individual spamming)
  const ipLimit = await checkRateLimit(`reg:${ip}`, 20);
  const rawEmail = typeof body === "object" && body !== null
    ? ((body as Record<string, unknown>).details as Record<string, unknown> | undefined)?.email
    : undefined;
  const emailLimit = typeof rawEmail === "string" && rawEmail.length > 0
    ? await checkRateLimit(`reg:email:${rawEmail.toLowerCase()}`, 3)
    : { allowed: true, remaining: 3 };
  const allowed = ipLimit.allowed && emailLimit.allowed;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const repo = getRepo();

  // Build the Stripe checkout factory if credentials are present
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const createCheckout = stripeKey
    ? async (params: {
        reference: string;
        ticket: string;
        ticketName: string;
        amountCents: number;
        email: string;
        idempotencyKey: string;
        paymentId: string;
      }) => {
        const stripe = createStripeProvider();
        const result = await stripe.createCheckout({
          idempotencyKey: params.idempotencyKey,
          lineItems: [{ name: params.ticketName, amount: money(params.amountCents), quantity: 1 }],
          successUrl: `${baseUrl}/sism-2026/registered?ref=${encodeURIComponent(params.reference)}&ticket=${encodeURIComponent(params.ticket)}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${baseUrl}/sism-2026/registration-cancelled?ticket=${encodeURIComponent(params.ticket)}`,
          customerEmail: params.email,
          metadata: { reference: params.reference, paymentId: params.paymentId },
        });
        return { checkoutUrl: result.redirectUrl, sessionId: result.checkoutId };
      }
    : null;

  const result = await handleRegistration(body, {
    repo,
    rateLimitAllowed: allowed,
    createCheckout,
    baseUrl,
  });

  if (!result.ok) {
    if ("fieldErrors" in result) {
      return NextResponse.json({ fieldErrors: result.fieldErrors }, { status: result.status });
    }
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ checkoutUrl: result.checkoutUrl, reference: result.reference }, { status: 200 });
}
