// Tests for verifyStripeSignature — run with:
//   node --experimental-strip-types features/payments/stripe.test.ts
// Node 22.20 supports TypeScript type stripping natively; no tsx needed.

import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { verifyStripeSignature } from "./stripe.ts";

const SECRET = "whsec_test_secret_abc123";

function makeSignature(payload: string, secret: string, tsOverride?: number): string {
  const ts = tsOverride ?? Math.floor(Date.now() / 1000);
  const signed = `${ts}.${payload}`;
  const sig = createHmac("sha256", secret).update(signed).digest("hex");
  return `t=${ts},v1=${sig}`;
}

describe("verifyStripeSignature", () => {
  it("accepts a valid signature", () => {
    const body = Buffer.from('{"id":"evt_1","type":"checkout.session.completed"}');
    const sig = makeSignature(body.toString(), SECRET);
    assert.doesNotThrow(() => verifyStripeSignature(body, sig, SECRET));
  });

  it("rejects a tampered body", () => {
    const originalBody = Buffer.from('{"id":"evt_1","type":"checkout.session.completed"}');
    const sig = makeSignature(originalBody.toString(), SECRET);
    const tamperedBody = Buffer.from('{"id":"evt_1","type":"payment_intent.payment_failed"}');
    assert.throws(
      () => verifyStripeSignature(tamperedBody, sig, SECRET),
      /signature mismatch/
    );
  });

  it("rejects a tampered signature", () => {
    const body = Buffer.from('{"id":"evt_2","type":"checkout.session.completed"}');
    const sig = makeSignature(body.toString(), SECRET);
    const tampered = sig.replace(/v1=([a-f0-9]+)/, "v1=0000000000000000000000000000000000000000000000000000000000000000");
    assert.throws(
      () => verifyStripeSignature(body, tampered, SECRET),
      /signature mismatch/
    );
  });

  it("rejects an expired timestamp (> 300s old)", () => {
    const body = Buffer.from('{"id":"evt_3","type":"checkout.session.completed"}');
    const oldTs = Math.floor(Date.now() / 1000) - 400; // 400s ago
    const sig = makeSignature(body.toString(), SECRET, oldTs);
    assert.throws(
      () => verifyStripeSignature(body, sig, SECRET),
      /outside tolerance/
    );
  });

  it("rejects a missing t= field", () => {
    const body = Buffer.from("{}");
    assert.throws(
      () => verifyStripeSignature(body, "v1=abc", SECRET),
      /missing t or v1/
    );
  });

  it("rejects a missing v1= field", () => {
    const body = Buffer.from("{}");
    assert.throws(
      () => verifyStripeSignature(body, `t=${Math.floor(Date.now() / 1000)}`, SECRET),
      /missing t or v1/
    );
  });

  it("accepts within custom tolerance", () => {
    const body = Buffer.from('{"id":"evt_4"}');
    const oldTs = Math.floor(Date.now() / 1000) - 30;
    const sig = makeSignature(body.toString(), SECRET, oldTs);
    // 60s tolerance, event is 30s old — should pass
    assert.doesNotThrow(() => verifyStripeSignature(body, sig, SECRET, 60));
  });
});
