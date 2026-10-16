# Payment provider research

Prepared: 2026-10-16. First draft written from memory; every fee and availability claim was then
checked against live Stripe, Payoneer and other provider pages on 16 Oct 2026. See "Sources" at the
bottom. Anything not confirmed on a live page is marked **unverified**. Fees and country lists
change; re-check before launch.

---

## 1. Stripe

### Checkout Sessions vs Payment Element

| | Checkout Sessions | Payment Element |
|---|---|---|
| Hosting | Stripe-hosted page (redirect) | Embedded in your page (iframe) |
| Implementation effort | Minimal: one API call + redirect | Moderate: JS SDK + your own page |
| PCI scope | SAQ A | SAQ A (Stripe's PCI guide groups "Checkout or Elements" under SAQ A) |
| Payment method coverage | Methods you enable in the Dashboard, shown by customer location and currency | Same, plus configurable |
| Adaptive Pricing (local-currency prices) | Yes, toggle in Dashboard | Not available with Elements + Payment Intents API |
| Mobile UX | Good (Stripe-designed) | You control the UX |
| Promo codes | Built-in (`allow_promotion_codes: true`) | Manual; you apply a coupon before confirming |
| Customisation | Limited (logo, colours, button label) | Full control |

**Recommendation for GYN:** Use **Checkout Sessions** for the initial launch.

Rationale: The audience is international (South Asia, Africa, Southeast Asia, Europe, North
America), many on mobile. Checkout shows cards, Apple Pay, Google Pay and Link, plus any local
method you switch on in the Dashboard. Local methods are not on by default: UPI must be enabled
in the Dashboard and needs the price shown in INR, which Checkout's Adaptive Pricing does
automatically while GYN keeps its prices in USD. Adaptive Pricing is not available for Elements
with the Payment Intents API, which is one more reason to stay on Checkout. The implementation is
a single `POST /v1/checkout/sessions` call. Switch to Payment Element only if brand requirements
demand a fully embedded experience. That is a later optimisation, not a launch blocker.

### Webhooks

Events the application must handle:

| Event | Trigger | Action |
|---|---|---|
| `checkout.session.completed` | Buyer completes Checkout | If `payment_status` is not `unpaid`, mark Registration CONFIRMED and send confirmation email. If `unpaid`, wait for the async events below |
| `checkout.session.async_payment_succeeded` | A delayed payment method settles later | Same as a paid `completed` |
| `checkout.session.async_payment_failed` | A delayed payment method fails | Mark Payment FAILED, notify attendee to retry |
| `payment_intent.payment_failed` | Card declined / 3DS fails | Mark Payment FAILED, notify attendee to retry |
| `charge.refunded` | Refund processed (via API or Stripe Dashboard), including partial refunds | Mark Refund ISSUED, update Payment status |

Also listen for `checkout.session.expired` (session abandoned) to mark Registration CANCELLED
and release the seat. Stripe's fulfillment guide says the fulfillment function must be safe to
call more than once for the same Checkout Session and must check `payment_status`.

**Idempotency:** Every webhook delivery includes a unique `id` field (e.g. `evt_1abc`). Store it
in `WebhookEvent.providerEventId` (unique constraint) before processing. If the row already
exists, return HTTP 200 without re-processing. This is the standard approach for Stripe
idempotency on the receiver side.

**Outbound idempotency:** Set the `Idempotency-Key` header on every mutating API call
(`POST /v1/checkout/sessions`, `POST /v1/refunds`). The key is generated server-side:
for checkout sessions it is `reg-<reference>` (deterministic — same reference replays the same
session on retry without creating a duplicate); for refunds it is stored in `Refund.idempotencyKey`.
Stripe saves the first response and replays it on retry; keys can be pruned once they are at least
24 hours old, after which a reused key creates a new request.

### Test mode

Use `sk_test_...` key. Stripe test card `4242 4242 4242 4242` (any future expiry, any CVC)
succeeds. `4000 0000 0000 0002` is a generic decline. `4000 0025 0000 3155` always requires
3DS authentication on on-session payments (Checkout is on-session). `4000 0035 6000 0008` is an
India-issued Visa for testing Indian cards.

To test what a buyer in another country sees with Adaptive Pricing, pass a customer email like
`test+location_IN@example.com` when creating the Checkout Session.

Set `STRIPE_SECRET_KEY=sk_test_...` and `STRIPE_WEBHOOK_SECRET=whsec_...` in `.env.local`.
Use `stripe listen --forward-to localhost:3000/api/webhooks/stripe` to forward test events.

### Fees: US account, international cards

Stripe's published standard pricing for a US account (stripe.com/pricing, fetched 16 Oct 2026):

| Item | Fee |
|---|---|
| US domestic card | 2.9% + $0.30 |
| International card | +1.5%, so 4.4% + $0.30 |
| Currency conversion (when conversion is required) | +1% |
| Adaptive Pricing (buyer pays in local currency) | 0% to GYN; the buyer pays a 2 to 4% conversion fee built into the rate |
| UPI | 2%, +1.5% international, +1% if conversion is required |
| Stablecoins | 1.5% |
| Checkout | No extra charge on standard pricing (optional custom domain $10/month) |
| Setup or monthly fees | None on standard pricing |

GYN's delegates are predominantly international, so budget about 4.4% + $0.30 per card payment.

| Ticket | International card fee | GYN receives |
|---|---|---|
| $399 | $17.56 + $0.30 = **$17.86** | $381.14 |
| $199 Forum Access | $8.76 + $0.30 = **$9.06** | $189.94 |
| $49 | $2.16 + $0.30 = **$2.46** | $46.54 |
| $18.50 scholarship fee | $0.81 + $0.30 = **$1.11** | $17.39 |

The $0.30 fixed fee is 1.6% of the $18.50 scholarship fee, so the small payments cost the most
in percentage terms.

### Which local methods a US Stripe account can offer GYN's buyers

From Stripe's payment method support matrix (business location vs customer country):

| Buyer country | Local method on a US Stripe account | Notes |
|---|---|---|
| India | **UPI** (yes) | US is a listed business location. INR only, 1 to 100,000 INR per payment. Supported in Checkout and Payment Links. Refunds within 60 days |
| Pakistan | None | Cards, Apple Pay, Google Pay, Link only. Adaptive Pricing can show PKR |
| Bangladesh | None | Same as Pakistan. Adaptive Pricing can show BDT |
| Nepal | None | Same. Adaptive Pricing can show NPR |
| Nigeria | None | Cards and wallets only. NG is not in the Adaptive Pricing country list |
| Ghana | None | Cards and wallets only. GH is not in the Adaptive Pricing country list |
| Kenya | None (no M-Pesa on Stripe) | Adaptive Pricing can show KES |
| Malaysia | None | FPX and GrabPay need a Malaysian (or Singapore, for GrabPay) Stripe account |
| Indonesia | None | Adaptive Pricing can show IDR |
| Philippines | None | Adaptive Pricing can show PHP |

Two other points from the same matrix:
- **PayPal through Stripe is not available to US businesses.** Its business locations are EU/EEA
  countries, Switzerland and the UK only. A US org that wants PayPal has to integrate PayPal
  directly.
- **Stablecoin payments** are available to US businesses, for customers worldwide (excluding
  sanctioned countries), in Checkout, settling to GYN's Stripe balance in USD.

Whether showing a local-currency price lowers card decline rates for these countries is
**unverified**; Stripe's docs describe Adaptive Pricing as unlocking local methods and localising
prices, not as a fix for declines.

### Stripe Tax

Stripe Tax (stripe.com/tax) calculates and collects sales tax / VAT / GST based on the buyer's
location, **but only in places where you have registered to collect**. Pricing: 0.5% per
transaction for no-code integrations, or $0.50 per transaction for API integrations, in both
cases only on transactions where you are registered. Which of the two applies to Checkout with
automatic tax is **unverified**. Turning on Stripe Tax does not remove any liability by itself;
GYN first has to decide where it must register.

Possible exposure:

- **Malaysian service tax** is 8% on digital services supplied by foreign providers since
  1 March 2024 (was 6%). Foreign providers must register if their digital services to Malaysian
  consumers exceed RM500,000 in 12 months (per PwC's tax booklet as summarised in search; the
  booklet page itself returned 403). Whether in-person summit seats count as "digital services"
  at all is **unverified** and probably not, since admission to a physical event is normally
  taxed where the event happens.
- **EU VAT** (standard rates vary by country, about 17 to 27%, **unverified** range): the
  €10,000 EU-wide threshold applies only to EU-established sellers. A non-EU seller of
  electronically supplied services to EU consumers has no threshold and uses the non-Union OSS.
  This matters only for online-only products, if any.
- **UK VAT** (20%): **unverified**; not checked on a live source.

**Recommendation:** Get a short tax opinion on the Malaysian event before the first public sale.
Enable Stripe Tax only after deciding where to register. Given GYN's audience (mostly outside the
EU and UK) the liability is likely low but not zero. This is not legal advice.

### Refunds and vouchers mapped to the refund policy

GYN's refund policy issues GYN Credit Vouchers (GCVs), not cash refunds. Mapping to Stripe:

| GYN policy | Stripe mechanism |
|---|---|
| Scholarship fee: non-refundable | Do not issue any refund via Stripe. Capture payment, no refund path. |
| 45+ days before event: full GCV | Issue the Stripe refund in full. Store GCV code in `Refund.voucherCode`. |
| 30 days: 50% GCV | Issue Stripe partial refund for 50% of amount, issue GCV for remaining 50%. |
| 15 days: 25% GCV | Issue Stripe partial refund for 25%, issue GCV for 25%. |
| <15 days: no voucher | No Stripe refund; no GCV. |

Open question for the team: the policy says vouchers, not cash, yet the table above sends cash
back through Stripe. If GCVs really replace cash, most rows should be "no Stripe refund, issue a
GCV" instead.

Note: **Stripe does not return its processing fee on any refund, full or partial.** Its refunds
doc says "Stripe's processing fees from the original transaction aren't returned", and the pricing
page says the same for currency conversion fees. Card refunds have no extra refund fee. A refund
issued shortly after the charge can go through as a reversal, for which Stripe withholds no fee.
UPI refunds must be issued within 60 days. Budget for losing the original fee on every refund.

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

Payoneer is a cross-border business payments platform. Its terms (Sept 2026, section 3.9) say the
services "are for business purposes" and "not intended for personal, family, household, or
person-to-person use". Its strength is receiving business payments and paying out to suppliers,
freelancers and marketplace sellers, not selling to individual consumers.

### What exists for accepting payments

1. **Request a payment / payment requests** (part of Payoneer's "Billing Solutions"): you email a
   payment link to a client, who pays by card (up to 3.99%, plus $0.49 in some countries), ACH
   (US payers, 1%), bank transfer, Payoneer balance, or PayPal (US payers). **This cannot be used
   for GYN's buyers.** Payoneer's help centre says "request a payment does not support payments
   from consumers" and "is not meant to be used as a payment gateway (checkout) for your
   ecommerce store". Terms section 6.2 says "it is strictly forbidden to get paid using this
   service for the sale of goods and/or services to consumers." Delegates and scholarship
   applicants are consumers.

2. **Payoneer Checkout**: a real merchant checkout (hosted page, embedded form, and plugins for
   WooCommerce, Shopify, Shopline, SHOPLAZZA). The current page says it is "powered by Stripe" and
   that the "Checkout service is provided by Stripe Inc. and/or its affiliates exclusively to US
   and Hong Kong entities." The same page lists eligibility as having or being willing to set up
   a Hong Kong entity, and monthly webstore volume above USD $20,000. An older help-centre FAQ
   says it was taking early applications only from Hong Kong entities, Visa and Mastercard only.
   Every merchant goes through a risk assessment. No timeline is published.

3. **Store / catalog payments**: no current Payoneer page found. Drop this; **unverified**.

### API and merchant approval

Payoneer's developer docs (payoneer.com/developers-docs) cover Accounts Payable, Accounts
Receivable, Mass Payout, Checkout and others. Checkout has its own docs site
(checkoutdocs.payoneer.com). The pages fetched do not say how to get API credentials or a sandbox
for Checkout, or how long approval takes. Third-party guides disagree on sandbox access and quote
1 to 4 weeks for partner approval; treat those as **unverified**. The Checkout eligibility above
(Hong Kong entity, $20,000/month) is published on Payoneer's own page.

### Fees

- Payment requests, card payer: up to 3.99% + $0.49 (Payoneer pricing page; varies by country).
- Payoneer Checkout: no setup or monthly fees. Payoneer's March 2026 fee guide lists card payments
  up to 3.99%, currency conversion up to 3.5%, international transactions up to 1.8%, and a $1
  minimum on payments under $100. The Checkout page itself publishes no rates.
- Annual account fee: $29.95 if the account receives under $6,000 in 12 months.

A $1 minimum would make the $18.50 scholarship fee cost at least 5.4% before any other charge.

### Suitability for GYN

**Verdict: Do not use Payoneer to take delegate payments.**

Reasons:
1. Payment requests are forbidden for consumer sales by Payoneer's own terms.
2. Payoneer Checkout is Stripe underneath, wants a Hong Kong entity and over $20,000 a month in
   webstore volume, and goes through a risk review. A US org gets the same Stripe checkout by
   going to Stripe directly, without those conditions and at published rates.
3. Payoneer's terms say the services are for business and commercial activity. Whether a
   nonprofit-style org can hold an account is **unverified**; no nonprofit clause was found in the
   part of the terms read.

Payoneer can still be useful for **paying out** (speakers, ambassadors, contractors abroad), which
is what it is built for.

The problem Payoneer was meant to solve (international delegates whose cards fail) needs other
tools:

### Better alternatives for South Asia / Africa

GYN's audience includes delegates from Pakistan, Bangladesh, Nigeria, Ghana, Kenya, etc. where
domestic cards sometimes fail on international gateways. Options found on live sources:

| Option | Fit | Notes |
|---|---|---|
| **Stripe Checkout + Adaptive Pricing + UPI** | Good, at launch | UPI covers India with no extra integration. Adaptive Pricing shows local-currency prices in PK, BD, NP, KE, MY, ID, PH, IN (not NG or GH). No Stripe local method exists for the other countries on a US account |
| **PayPal (direct integration)** | Partial | Not available through Stripe for a US business. PayPal has a Nigeria country site (paypal.com/ng). paypal.com/pk and paypal.com/bd fall back to the US homepage, and third-party guides say PayPal does not operate in Pakistan or Bangladesh. So PayPal does not solve the Pakistan / Bangladesh problem. US fees **unverified** |
| **Flutterwave** | Possible for Africa, **unverified** | Lists Ghana mobile money, Kenya M-Pesa, and Nigerian bank transfer / USSD by currency. Whether a US-registered org can onboard and offer those rails is **unverified**; ask Flutterwave sales |
| **Paystack** | Not possible | Paystack says its services are "available only to businesses registered in Nigeria, Ghana, South Africa and Kenya" |
| **Razorpay cross-border** | Not needed | Razorpay markets INR collection (UPI, cards, netbanking) for foreign businesses with no Indian entity, settled abroad. Fees not published. Redundant while Stripe UPI works |
| **Paddle / Lemon Squeezy (merchant of record)** | Not allowed | Paddle is built for software; its AUP bans physical products, human services not tied to software, donations, and lists "competition/event tickets" as prohibited. Lemon Squeezy bans "services of any kind" and "physical goods of any kind". In-person summit seats do not fit either |
| **Wise Business card payments** | Not available | Wise's US page says accepting card payments "is currently unavailable to new Wise Business customers". Its listed US rates were 2.9% + $0.30 domestic and 4.2% + $0.30 international |

**Recommended approach:** Launch with Stripe Checkout Sessions, with Adaptive Pricing and UPI
switched on from day one (Dashboard settings, no extra code). Do not plan a Payment Element
"local methods" phase for Pakistan, Bangladesh, Nepal or Africa: Stripe offers no local methods
there for a US account, so it would add nothing. If card failures from those countries are high
after launch, the next step is a second provider (Flutterwave for Africa, once US eligibility is
confirmed) or a manual fallback, not more Stripe configuration.

---

## 3. Crypto QR on the live site

The live site has at least one page (the scholarship form) that offers a crypto QR code
alongside card payment.

### Risk assessment

| Risk | Severity | Notes |
|---|---|---|
| **Irreversibility** | High | Crypto transactions cannot be reversed. If a delegate pays twice (double-click, retry) or pays the wrong amount, GYN has no dispute path. |
| **No chargebacks (for GYN)** | Double-edged | GYN cannot receive chargebacks on crypto. But delegates also cannot charge back, which may reduce trust from cautious applicants. |
| **Price volatility** | High for non-stablecoins | If the QR is for BTC or ETH, the value received may differ significantly from $18.50 by the time the transaction confirms. |
| **Regulatory / AML exposure** | Moderate to High | Accepting crypto without KYC/AML controls may conflict with FinCEN requirements for US-based organisations depending on volume and jurisdiction (**unverified**, not re-checked). |
| **No webhook / API integration** | High | The current QR is manual: someone monitors a wallet and confirms payment by hand. This does not integrate with any registration workflow. |
| **Tax reporting** | Moderate | Crypto received as payment is taxable income in the US at fair market value on receipt (**unverified**, not re-checked). This adds accounting complexity. |
| **Reputational** | Low to Moderate | A crypto QR on a UN-co-hosted youth summit looks incongruous and may reduce trust with institutional partners. |

### Recommendation

**Remove the crypto QR from all public pages at launch.**

If there is a genuine need to accept crypto (e.g. delegates in countries with strict capital
controls who cannot access cards or PayPal), the simplest managed option is **Stripe's own
stablecoin payments**: available to US businesses, customers worldwide except sanctioned
countries, USDC on several networks, shown inside the same Checkout, confirmed through the same
webhooks, settled to the Stripe balance in USD, 1.5% fee, refunds go back as stablecoins, no
disputes. Third-party processors (Coinbase Commerce, NOWPayments) were not re-checked and are
**unverified**.

Do not run a raw wallet QR on a registration form.

---

## 4. Recommendation: launch setup

### Launch (Phase 1)

1. Stripe Checkout Sessions, US account, test mode during development.
2. In the Dashboard: turn on Adaptive Pricing and UPI; keep cards, Apple Pay, Google Pay and Link.
3. Webhook handlers: `checkout.session.completed` (check `payment_status`),
   `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
   `payment_intent.payment_failed`, `charge.refunded`, and `checkout.session.expired`.
4. Idempotency keys on all API calls; `WebhookEvent` deduplication on all incoming events.
5. Stripe Tax: get a tax opinion first, then enable it only where GYN registers. It collects
   nothing where GYN is not registered.
6. Stripe Promo Codes for group discounts (maps to `DiscountCode` model).
7. Remove crypto QR from public pages. If crypto is required later, use Stripe stablecoin
   payments rather than a separate processor.
8. Payoneer: do not use for taking payments. Payment requests are banned for consumer sales, and
   Payoneer Checkout is Stripe with extra conditions.

### Trigger for adding a second gateway

Add a second provider **when conversion monitoring shows a >10% payment failure rate from a
specific country or region** in the first event's registration data. Stripe has no extra local
methods for Pakistan, Bangladesh, Nepal, Nigeria, Ghana, Kenya, Malaysia, Indonesia or the
Philippines on a US account, so the fix is outside Stripe: Flutterwave for African buyers (after
confirming a US entity can onboard), PayPal direct only where PayPal operates (it does not in
Pakistan or Bangladesh).

---

## Environment variables required

See `.env.example` for the full list. Stripe-specific:

```
STRIPE_SECRET_KEY                    # sk_live_... / sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   # pk_live_... / pk_test_... (not used yet; Checkout is a redirect)
STRIPE_WEBHOOK_SECRET                # whsec_... from Stripe Dashboard > Webhooks
```

---

## Sources (fetched 16 Oct 2026)

Stripe
- https://stripe.com/pricing (card, international, conversion, Tax, Checkout, no monthly fee, refunds)
- https://stripe.com/pricing/local-payment-methods (UPI, Alipay, wallets, stablecoins, bank transfers)
- https://docs.stripe.com/payments/payment-methods/payment-method-support (business location vs customer country matrix; PayPal business locations)
- https://docs.stripe.com/payments/upi (UPI business locations incl. US, limits, refunds)
- https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing.md?payment-ui=stripe-hosted (Adaptive Pricing countries, UPI unlock, 0% merchant fee, Elements restriction)
- https://docs.stripe.com/payments/stablecoin-payments (US availability, Checkout support, settlement, refunds)
- https://docs.stripe.com/refunds (processing fees not returned, reversals)
- https://docs.stripe.com/checkout/fulfillment.md?payment-ui=stripe-hosted (async payment events, `payment_status`)
- https://docs.stripe.com/api/idempotent_requests (24-hour key pruning)
- https://docs.stripe.com/testing (test card numbers, India test card)
- https://stripe.com/guides/pci-compliance (SAQ A for Checkout and Elements)

Payoneer
- https://www.payoneer.com/checkout/ (powered by Stripe, US and Hong Kong entities, Hong Kong entity and $20,000/month eligibility)
- https://payoneer.custhelp.com/app/answers/detail/a_id/40689/~/payoneer-checkout---faq (older Checkout FAQ, Hong Kong early access)
- https://payoneer.custhelp.com/app/answers/detail/a_id/12280/~/request-a-payment---information-for-receivers (no consumer payments, not a checkout, payer fees)
- https://www.payoneer.com/get-paid-by-clients/payment-request/ (B2B payment request page)
- https://pubs.payoneer.com/legal/PayoneerTermsAndConditionsINC_Sep2026.htm (sections 3.9 and 6.2)
- https://www.payoneer.com/about/pricing/ (card payer fee, annual fee)
- https://www.payoneer.com/resources/country-guides/payoneer-fees-optimizing-transfer-costs-for-businesses/ (Checkout fee ranges, dated 19 Mar 2026)
- https://www.payoneer.com/developers-docs/checkout/ and https://www.payoneer.com/developers-docs/mass-payout/mass-payee-onboarding/ (developer docs scope)

Alternatives and tax
- https://www.paypal.com/ng/home, https://www.paypal.com/pk/home, https://www.paypal.com/bd/home (country site presence)
- https://www.bitdegree.org/money-transfer/tutorials/is-paypal-available-in-pakistan and https://www.nsave.com/bangladesh/paypal (third-party, PayPal not operating in Pakistan / Bangladesh)
- https://flutterwave.com/gb/support/payment-methods/payment-channels (methods by currency)
- https://support.paystack.com/en/articles/2130562 (registered-business countries)
- https://razorpay.com/accept-international-payments-from-india/ (cross-border INR collection)
- https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle (Paddle AUP)
- https://docs.lemonsqueezy.com/help/getting-started/prohibited-products (Lemon Squeezy prohibited products)
- https://wise.com/us/business/accept-card-payments/ (closed to new customers, US rates)
- https://amcham.com.my/36628-2/ (Malaysia service tax 6% to 8% on foreign digital services)
- https://pwc.com/my/en/publications/mtb/service-tax.html (RM500,000 threshold; page returned 403, figure taken from search summary)
- https://www.pkf-l.com/insights/tax-talk-cross-border-transactions-with-the-eu/ (EU €10,000 threshold does not apply to non-EU suppliers; via search summary)
