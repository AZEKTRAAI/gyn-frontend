// Payoneer stub — not suitable as a primary checkout gateway for this use case.
// See docs/payments.md §Payoneer for the full assessment.
// This stub exists so the PaymentProvider interface is fulfilled if someone wires in
// Payoneer credentials, but all methods throw until a real implementation is written.
//
// Prerequisite before implementing: Payoneer merchant approval (manual process, slow).
// Better alternatives for the same problem: Stripe + Payment Element (supports UPI, bank
// transfer, cards globally), or PayPal for delegates in countries where Stripe cards fail.

import type {
  CheckoutParams,
  CheckoutResult,
  GetPaymentResult,
  PaymentProvider,
  RefundParams,
  RefundResult,
  WebhookParseResult,
} from "./types.js";

function notConfigured(): never {
  throw new Error(
    "Payoneer is not configured. Set PAYONEER_PROGRAM_ID, PAYONEER_USERNAME, and PAYONEER_API_KEY, " +
      "and replace this stub with a real implementation. See docs/payments.md."
  );
}

export function createPayoneerProvider(): PaymentProvider {
  const programId = process.env.PAYONEER_PROGRAM_ID;
  const username = process.env.PAYONEER_USERNAME;
  const apiKey = process.env.PAYONEER_API_KEY;

  if (!programId || !username || !apiKey) notConfigured();

  return {
    name: "payoneer",

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async createCheckout(_params: CheckoutParams): Promise<CheckoutResult> {
      notConfigured();
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async parseWebhook(_rawBody: Buffer, _signature: string): Promise<WebhookParseResult> {
      notConfigured();
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async refund(_params: RefundParams): Promise<RefundResult> {
      notConfigured();
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getPayment(_providerPaymentId: string): Promise<GetPaymentResult> {
      notConfigured();
    },
  };
}
