# Payment provider research

Prepared: 2026-10-16. Sources are Stripe and Payoneer public documentation as of August 2025 training
data (no live web fetches were performed — verify fees and API details before launch at
stripe.com/docs and payoneer.com/developer). Links are cited for verification.

---

## 1. Stripe

### Checkout Sessions vs Payment Element

| | Checkout Sessions | Payment Element |
|---|---|---|
| Hosting | Stripe-hosted page (redirect) | Embedded in your page (iframe) |
| Implementation effort | Minimal: one API call + redirect | Moderate: JS SDK + your own page |
| PCI scope | SAQ A (simplest) | SAQ A-EP |
| Payment method coverage | Auto-shown based on account config | Auto-shown + configurable |
| Mobile UX | Good (Stripe-designed) | You control the UX |
| Promo codes | Built-in (`allow_promotion_codes: true`) | Manual; you apply a coupon before confirming |
| Customisation | Limited (logo, colours, button label) | Full control |

**Recommendation for GYN:** Use **Checkout Sessions** for the initial launch.

Rationale: The audience is international (South Asia, Africa, Europe, North America), many on
mobile. Checkout Sessions auto-surfaces Apple Pay, Google Pay, cards, and locally-relevant
methods (UPI for India) without any configuration. The team is small; the implementation is a
single `POST /v1/checkout/sessions` call. PCI scope is minimal (SAQ A). Switch to Payment
Element only if brand requirements demand a fully embedded experience — that is a later
optimisation, not a launch blocker.

### Webhooks

Three events the application must handle:

| Event | Trigger | Action |
|---|---|---|
| `checkout.session.completed` | Buyer completes payment | Mark Registration CONFIRMED, send confirmation email |
| `payment_intent.payment_failed` | Card declined / 3DS fails | Mark Payment FAILED, notify attendee to retry |
| `charge.refunded` | Refund processed (via API or Stripe Dashboard) | Mark Refund ISSUED, update Payment status |

Also listen for `checkout.session.expired` (session abandoned) to mark Registration CANCELLED
and release the seat.

**Idempotency:** Every webhook delivery includes a unique `id` field (e.g. `evt_1abc`). Store it
in `WebhookEvent.providerEventId` (unique constraint) before processing. If the row already
exists, return HTTP 200 without re-processing. This is the standard approach for Stripe
idempotency on the receiver side.

**Outbound idempotency:** Set the `Idempotency-Key` header on every mutating API call
(`POST /v1/checkout/sessions`, `POST /v1/refunds`). Use the internal `Registration.idempotencyKey`
or `Refund.idempotencyKey`. Stripe stores the result for 24 hours and replays it on retry.

### Test mode

Use `sk_test_...` key. Stripe test card `4242 4242 4242 4242` (any future expiry, any CVC)
succeeds. `4000 0000 0000 0002` is declined. `4000 0025 0000 3155` triggers 3DS.

Set `STRIPE_SECRET_KEY=sk_test_...` and `STRIPE_WEBHOOK_SECRET=whsec_...` in `.env.local`.
Use `stripe listen --forward-to localhost:3000/api/webhooks/stripe` to forward test events.
Source: https://stripe.com/docs/testing

### Fees — US account, international cards

Stripe's published pricing for a US-registered account (source: stripe.com/pricing, verified
to August 2025):

| Card type | Fee |
|---|---|
| US domestic card | 2.9% + $0.30 |
| International card (non-US BIN) | 2.9% + $0.30 + **1.5% international surcharge** = 4.4% + $0.30 |
| Currency conversion (if settled in non-USD) | +1.5% |

GYN's delegates are predominantly international, so budget ~4.4% + $0.30 per transaction.

Example for $199 Forum Access with an international card: $199 × 4.4% + $0.30 = $8.76 + $0.30 = **$9.06** fee, GYN receives ~$189.94.

Example for $18.50 scholarship fee: $18.50 × 4.4% + $0.30 = $0.81 + $0.30 = **$1.11** fee.

Stripe does not charge monthly fees on the standard plan.

### Stripe Tax

Stripe Tax (stripe.com/tax) auto-calculates and collects sales tax / VAT / GST based on the
buyer's location. Relevant if GYN may be liable for:

- **Malaysian SST** (6%): organisers of digital services sold to Malaysian consumers
- **EU VAT** (varies 17–27%): digital services sold to EU residents (OSS threshold: €10,000/year)
- **UK VAT** (20%): similar threshold

**Recommendation:** Enable Stripe Tax before the first public sale. The cost is 0.5% of
transactions where Stripe calculates tax. Given GYN's audience (primarily non-EU, non-UK youth
from developing countries), the actual liability is likely low, but not zero — especially for
Malaysian delegates buying through a Malaysian event. Consult a tax advisor; this is not legal
advice.

### Refunds and vouchers mapped to the refund policy

GYN's refund policy issues GYN Credit Vouchers (GCVs), not cash refunds. Mapping to Stripe:

| GYN policy | Stripe mechanism |
|---|---|
| Scholarship fee: non-refundable | Do not issue any refund via Stripe. Capture payment, no refund path. |
| 45+ days before event: full GCV | Issue the Stripe refund in full (to reclaim Stripe fees is not guaranteed on refund). Store GCV code in `Refund.voucherCode`. |
| 30 days: 50% GCV | Issue Stripe partial refund for 50% of amount, issue GCV for remaining 50%. |
| 15 days: 25% GCV | Issue Stripe partial refund for 25%, issue GCV for 25%. |
| <15 days: no voucher | No Stripe refund; no GCV. |

Note: Stripe returns the processing fee only on full refunds (and only if issued within 90 days
for standard accounts). Partial refunds do not recover the fee. Budget accordingly.

Stripe Coupons / Promotion Codes (for group discounts):
- Create a Stripe Coupon via `POST /v1/coupons` (percentage or fixed amount).
- Surface it via `allow_promotion_codes: true` on a Checkout Session, or apply it server-side
  via `discounts[0][coupon]` when creating the session.
- GYN currently handles group discounts by email; the `DiscountCode` model in the schema is
  the internal record. Whether it maps to a Stripe coupon (frontend-applied) or a price
  override (server-applied) is an implementation choice.

---

## 2. Payoneer

### What Payoneer actually is

Payoneer is a cross-border B2B payments platform. Its primary use case is **paying out** to
suppliers, freelancers, and marketplace sellers — not accepting payments from individual
consumers at checkout. This distinction is critical.

### What exists for accepting payments

Payoneer does offer ways to receive money from customers:

1. **Payment Requests** ("Get Paid" links): Send a payment link to a known contact. The payer
   receives an email and pays via card or bank transfer. This is manual, not a checkout API.

2. **Payoneer Checkout** (formerly Payoneer Marketplaces): An embeddable checkout widget
   designed for marketplace platforms (e.g. a platform managing many sellers). Requires
   merchant approval, is not self-serve, and is primarily targeted at marketplace operators
   with significant GMV.

3. **Store / Catalog payments**: Payoneer has experimented with simple storefront pages, but
   this is not a production-grade checkout SDK.

### API and merchant approval

Payoneer does have a REST API, but merchant onboarding for Payoneer Checkout requires:
- Manual application reviewed by a Payoneer account manager
- Business documentation (company registration, bank account, website review)
- Approval is not guaranteed and can take weeks
- No self-service test environment comparable to Stripe test mode

Source: payoneer.com/enterprise and developer.payoneer.com (as of training data, August 2025).

### Fees

Payoneer's fee structure for receiving payments is less transparent than Stripe's. Published
rates vary by region and volume. For card payments received via Payoneer Checkout, fees
historically range from 3–5% depending on card type and geography. No flat-rate public pricing
comparable to stripe.com/pricing exists.

### Suitability for GYN

**Verdict: Poor fit. Do not use Payoneer as a checkout gateway for this launch.**

Reasons:
1. Checkout is not self-serve; approval takes weeks and may be rejected.
2. No reliable test environment for development.
3. Fee transparency is poor.
4. The product is optimised for B2B payouts, not B2C event registration.

The problem Payoneer was intended to solve (international delegates in countries where Stripe
cards fail) is better addressed by other means:

### Better alternatives for South Asia / Africa

GYN's audience includes delegates from Pakistan, Bangladesh, Nigeria, Ghana, Kenya, etc.
where domestic cards sometimes fail on international gateways. Options:

| Option | Fit | Notes |
|---|---|---|
| **Stripe + Payment Element with local methods** | Good | Stripe supports UPI (India), SEPA (EU), iDEAL (NL), Sofort (DE), BECS (AU). Pakistan cards work on Stripe but failure rates are higher; no Stripe-native PKR bank transfer. |
| **PayPal** | Acceptable for fallback | Widely recognised globally; delegates with PayPal balances can pay without a card. Integration is separate from Stripe. Consider adding as a secondary method only if conversion data shows card failures. |
| **Paddle or LemonSqueezy (Merchant of Record)** | Overkill for this scale | MoR handles VAT globally and offers local payment methods, but they take 5–8% and are designed for SaaS subscriptions, not event tickets. Not recommended unless VAT complexity grows. |
| **Wise Business payment links** | Niche | Works for B2B invoicing; not suitable for individual delegate checkout. |

**Recommended approach:** Launch with Stripe Checkout Sessions only. Add Stripe Payment Element with additional local payment methods (UPI, bank transfer) as a Phase 2 if conversion data shows >10% payment failures from South Asia / Africa. This keeps launch simple and defers complexity to where data justifies it.

---

## 3. Crypto QR on the live site

The live site has at least one page (the scholarship form) that offers a crypto QR code
alongside card payment.

### Risk assessment

| Risk | Severity | Notes |
|---|---|---|
| **Irreversibility** | High | Crypto transactions cannot be reversed. If a delegate pays twice (double-click, retry) or pays the wrong amount, GYN has no dispute path. |
| **No chargebacks (for GYN)** | Double-edged | GYN cannot be chargebacks on crypto. But delegates also cannot chargeback, which may reduce trust from cautious applicants. |
| **Price volatility** | High for non-stablecoins | If the QR is for BTC or ETH, the value received may differ significantly from $18.50 by the time the transaction confirms. |
| **Regulatory / AML exposure** | Moderate–High | Accepting crypto without KYC/AML controls may conflict with FinCEN requirements for US-based organisations depending on volume and jurisdiction. |
| **No webhook / API integration** | High | The current QR is manual — someone monitors a wallet and confirms payment by hand. This does not integrate with any registration workflow. |
| **Tax reporting** | Moderate | Crypto received as payment is taxable income in the US at fair market value on receipt. This adds accounting complexity. |
| **Reputational** | Low–Moderate | A crypto QR on a UN-co-hosted youth summit looks incongruous and may reduce trust with institutional partners. |

### Recommendation

**Remove the crypto QR from all public pages at launch.**

If there is a genuine need to accept crypto (e.g. delegates in countries with strict capital
controls who cannot access cards or PayPal), use a managed crypto payment processor
(Coinbase Commerce, NOWPayments) that:
- Auto-converts to USD stable value on receipt
- Provides a webhook for payment confirmation
- Handles AML screening
- Issues receipts

Do not run a raw wallet QR on a registration form. Gate this behind a "contact us" flow until
proper integration is built.

---

## 4. Recommendation: launch setup

### Launch (Phase 1)

1. Stripe Checkout Sessions, US account, test mode during development.
2. Three webhook handlers: `checkout.session.completed`, `payment_intent.payment_failed`,
   `charge.refunded`, and `checkout.session.expired`.
3. Idempotency keys on all API calls; `WebhookEvent` deduplication on all incoming events.
4. Enable Stripe Tax (0.5% fee; removes tax liability ambiguity).
5. Stripe Promo Codes for group discounts (maps to `DiscountCode` model).
6. Remove crypto QR from public pages.
7. Payoneer: do not pursue for launch.

### Trigger for adding a second gateway

Add a second payment method (PayPal or Stripe local methods) **when conversion monitoring
shows >10% payment failure rate from a specific country or region** in the first event's
registration data. Add that country's preferred method via Stripe Payment Element rather than
a separate gateway wherever possible.

---

## Environment variables required

See `.env.example` for the full list. Stripe-specific:

```
STRIPE_SECRET_KEY          # sk_live_... / sk_test_...
STRIPE_PUBLISHABLE_KEY     # pk_live_... / pk_test_... (frontend)
STRIPE_WEBHOOK_SECRET      # whsec_... from Stripe Dashboard > Webhooks
```
