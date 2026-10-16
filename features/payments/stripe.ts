// shortcut: uses raw fetch against Stripe REST API instead of the official `stripe` npm SDK.
// Replace with `import Stripe from "stripe"` and adapt when the SDK is installed.

import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CheckoutParams,
  CheckoutResult,
  GetPaymentResult,
  PaymentProvider,
  RefundParams,
  RefundResult,
  WebhookParseResult,
} from "./types.js";

const STRIPE_API = "https://api.stripe.com/v1";
// Stripe requires signature timestamps within 5 minutes to prevent replay attacks.
const WEBHOOK_TOLERANCE_SECONDS = 300;

function stripeHeaders(secretKey: string, idempotencyKey?: string): HeadersInit {
  const h: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
    "Stripe-Version": "2024-06-20",
  };
  if (idempotencyKey) h["Idempotency-Key"] = idempotencyKey;
  return h;
}

async function stripePost(
  path: string,
  body: URLSearchParams,
  secretKey: string,
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: stripeHeaders(secretKey, idempotencyKey),
    body: body.toString(),
  });
  const json = await res.json();
  if (!res.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new Error(`Stripe ${path} ${res.status}: ${(json as any)?.error?.message ?? res.statusText}`);
  }
  return json;
}

async function stripeGet(path: string, secretKey: string): Promise<unknown> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    headers: stripeHeaders(secretKey),
  });
  const json = await res.json();
  if (!res.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new Error(`Stripe GET ${path} ${res.status}: ${(json as any)?.error?.message ?? res.statusText}`);
  }
  return json;
}

// ---------------------------------------------------------------------------
// Webhook signature verification (Stripe-Signature header)
// Stripe signs with HMAC-SHA256 over "timestamp.rawBody"
// ---------------------------------------------------------------------------

/**
 * Verify a Stripe webhook signature.
 * @param rawBody   Raw bytes from the request body (do NOT parse before calling)
 * @param sigHeader Value of the `Stripe-Signature` header
 * @param secret    Webhook signing secret (whsec_...)
 * @param toleranceSeconds  Max age of the event in seconds (default 300)
 * @throws if signature is invalid or timestamp is outside tolerance
 */
export function verifyStripeSignature(
  rawBody: Buffer,
  sigHeader: string,
  secret: string,
  toleranceSeconds = WEBHOOK_TOLERANCE_SECONDS
): void {
  // Header format: "t=1614987893,v1=abc123,v1=def456"
  const parts: Record<string, string[]> = {};
  for (const part of sigHeader.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq);
    const v = part.slice(eq + 1);
    (parts[k] ??= []).push(v);
  }

  const ts = parts["t"]?.[0];
  const signatures = parts["v1"] ?? [];
  if (!ts || signatures.length === 0)
    throw new Error("Invalid Stripe-Signature header: missing t or v1");

  const timestamp = parseInt(ts, 10);
  if (isNaN(timestamp)) throw new Error("Invalid Stripe-Signature: non-numeric timestamp");

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds)
    throw new Error(
      `Stripe webhook timestamp outside tolerance (${Math.abs(nowSeconds - timestamp)}s > ${toleranceSeconds}s)`
    );

  const signed = `${ts}.${rawBody.toString("utf8")}`;
  const expected = createHmac("sha256", secret).update(signed).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");

  // timingSafeEqual requires equal-length buffers
  const match = signatures.some((sig) => {
    try {
      const sigBuf = Buffer.from(sig, "hex");
      if (sigBuf.length !== expectedBuf.length) return false;
      return timingSafeEqual(sigBuf, expectedBuf);
    } catch {
      return false;
    }
  });

  if (!match) throw new Error("Stripe webhook signature mismatch");
}

// ---------------------------------------------------------------------------
// Stripe provider implementation
// ---------------------------------------------------------------------------

export function createStripeProvider(config?: {
  secretKey?: string;
  webhookSecret?: string;
}): PaymentProvider {
  const secretKey = config?.secretKey ?? process.env.STRIPE_SECRET_KEY;
  const webhookSecret = config?.webhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not set");
  // webhookSecret checked lazily inside parseWebhook so checkout-only callers don't need it

  return {
    name: "stripe",

    async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
      const body = new URLSearchParams();
      body.set("mode", "payment");
      body.set("success_url", params.successUrl);
      body.set("cancel_url", params.cancelUrl);
      if (params.customerEmail) body.set("customer_email", params.customerEmail);

      params.lineItems.forEach((item, i) => {
        body.set(`line_items[${i}][price_data][currency]`, item.amount.currency);
        body.set(`line_items[${i}][price_data][unit_amount]`, String(item.amount.amountCents));
        body.set(`line_items[${i}][price_data][product_data][name]`, item.name);
        body.set(`line_items[${i}][quantity]`, String(item.quantity));
      });

      if (params.metadata) {
        for (const [k, v] of Object.entries(params.metadata)) {
          body.set(`metadata[${k}]`, v);
        }
      }

      const session = (await stripePost(
        "/checkout/sessions",
        body,
        secretKey,
        params.idempotencyKey
      )) as { id: string; url: string };

      return { checkoutId: session.id, redirectUrl: session.url };
    },

    async parseWebhook(rawBody: Buffer, signature: string): Promise<WebhookParseResult> {
      if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
      verifyStripeSignature(rawBody, signature, webhookSecret);
      const event = JSON.parse(rawBody.toString("utf8")) as {
        id: string;
        type: string;
        data: { object: Record<string, unknown> };
      };
      return {
        providerEventId: event.id,
        eventType: event.type,
        data: event.data.object,
      };
    },

    async refund(params: RefundParams): Promise<RefundResult> {
      const body = new URLSearchParams();
      body.set("charge", params.providerPaymentId);
      if (params.amountCents !== undefined)
        body.set("amount", String(params.amountCents));
      if (params.reason) body.set("reason", params.reason);

      const refund = (await stripePost(
        "/refunds",
        body,
        secretKey,
        params.idempotencyKey
      )) as { id: string; amount: number; status: string };

      return {
        providerRefundId: refund.id,
        amountCents: refund.amount,
        status: refund.status as RefundResult["status"],
      };
    },

    async getPayment(providerPaymentId: string): Promise<GetPaymentResult> {
      const charge = (await stripeGet(
        `/charges/${encodeURIComponent(providerPaymentId)}`,
        secretKey
      )) as {
        id: string;
        amount: number;
        currency: string;
        status: string;
        refunded: boolean;
        amount_refunded: number;
      };

      let status: GetPaymentResult["status"] = "pending";
      if (charge.refunded) status = "refunded";
      else if (charge.status === "succeeded") status = "succeeded";
      else if (charge.status === "failed") status = "failed";

      return {
        providerPaymentId: charge.id,
        amountCents: charge.amount,
        currency: charge.currency,
        status,
      };
    },
  };
}
