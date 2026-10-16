// Payment provider abstraction.
// All monetary values are integer minor units (cents). Never use floats for money.

export interface Money {
  amountCents: number; // e.g. 19900 for $199.00
  currency: string;    // ISO 4217 lowercase: "usd"
}

/** Construct a Money value; throws on non-integer input. */
export function money(amountCents: number, currency = "usd"): Money {
  if (!Number.isInteger(amountCents) || amountCents < 0)
    throw new Error(`amountCents must be a non-negative integer, got ${amountCents}`);
  return { amountCents, currency };
}

/** Display helper: 19900 + "usd" → "$199.00" */
export function formatMoney({ amountCents, currency }: Money): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

// ---------------------------------------------------------------------------

export interface CheckoutParams {
  idempotencyKey: string;
  lineItems: Array<{
    name: string;
    amount: Money;
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResult {
  checkoutId: string;   // provider session/order id
  redirectUrl: string;  // send browser here
}

export interface WebhookParseResult {
  providerEventId: string;
  eventType: string;    // e.g. "checkout.session.completed"
  // Provider-native payload; callers pattern-match on eventType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

export interface RefundParams {
  providerPaymentId: string;
  amountCents?: number; // omit for full refund
  idempotencyKey: string;
  reason?: string;
}

export interface RefundResult {
  providerRefundId: string;
  amountCents: number;
  status: "pending" | "succeeded" | "failed";
}

export interface GetPaymentResult {
  providerPaymentId: string;
  amountCents: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "cancelled" | "refunded";
}

/** Contract every payment gateway adapter must satisfy. */
export interface PaymentProvider {
  readonly name: string;

  /**
   * Create a hosted checkout session and return the URL to redirect the user to.
   * Idempotent: calling twice with the same key returns the same session.
   */
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;

  /**
   * Parse and verify a raw webhook request.
   * MUST verify the provider signature before returning — throws on invalid sig.
   */
  parseWebhook(rawBody: Buffer, signature: string): Promise<WebhookParseResult>;

  /** Issue a refund (full or partial). Idempotent by idempotencyKey. */
  refund(params: RefundParams): Promise<RefundResult>;

  /** Retrieve a payment by the provider's payment/charge id. */
  getPayment(providerPaymentId: string): Promise<GetPaymentResult>;
}
