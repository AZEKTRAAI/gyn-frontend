// Backend unit tests — run with:
//   node --experimental-strip-types lib/server/tests.ts
// Requires Node 22.6+ (type stripping support).
// Uses .ts extensions in imports so bare Node can resolve them without a bundler.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

// ---------------------------------------------------------------------------
// 1. Reference generation: no ambiguous chars, uniqueness over 10k
// ---------------------------------------------------------------------------

describe("reference generation", () => {
  it("contains only characters from the unambiguous alphabet", async () => {
    const { generateReference } = await import("./reference.ts");
    const BAD = /[01OIL]/;
    const generated: string[] = [];
    for (let i = 0; i < 100; i++) {
      const ref = await generateReference("SISM", async (r) => generated.includes(r));
      assert.match(ref, /^SISM-[A-Z0-9]{5}$/);
      assert.ok(!BAD.test(ref.slice(5)), `Found ambiguous char in: ${ref}`);
      generated.push(ref);
    }
  });

  it("generates unique references over 10k samples", async () => {
    const { generateReference } = await import("./reference.ts");
    const seen = new Set<string>();
    for (let i = 0; i < 10_000; i++) {
      const ref = await generateReference("SISM", async (r) => seen.has(r));
      assert.ok(!seen.has(ref), `Duplicate reference generated: ${ref}`);
      seen.add(ref);
    }
    assert.equal(seen.size, 10_000);
  });
});

// ---------------------------------------------------------------------------
// 2. Rate limiter: in-memory sliding window
// ---------------------------------------------------------------------------

describe("rate limiter (in-memory)", () => {
  it("allows up to 5 requests, blocks the 6th", async () => {
    const { checkRateLimit } = await import("./rate-limit.ts");
    const testIp = `test-${Date.now()}-${Math.random()}`;

    for (let i = 1; i <= 5; i++) {
      const { allowed } = await checkRateLimit(testIp);
      assert.equal(allowed, true, `Request ${i} should be allowed`);
    }
    const { allowed } = await checkRateLimit(testIp);
    assert.equal(allowed, false, "6th request should be blocked");
  });
});

// ---------------------------------------------------------------------------
// 3. ICS validity: CRLF line endings, required fields
// Tests the pure buildSism2026Ics() function, not the Next.js route handler.
// ---------------------------------------------------------------------------

describe("ICS calendar", () => {
  it("uses CRLF line endings throughout", async () => {
    const { buildSism2026Ics } = await import("./ics.ts");
    const ics = buildSism2026Ics();
    const lines = ics.split("\n");
    // Every line before the trailing empty should end with CR
    for (const line of lines.slice(0, -1)) {
      assert.ok(line.endsWith("\r"), `Line does not end with CR: "${line}"`);
    }
  });

  it("contains required RFC 5545 fields", async () => {
    const { buildSism2026Ics } = await import("./ics.ts");
    const ics = buildSism2026Ics();
    for (const field of [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "END:VEVENT",
      "END:VCALENDAR",
      "UID:",
      "DTSTAMP:",
      "DTSTART",
      "DTEND",
      "SUMMARY:",
      "LOCATION:",
    ]) {
      assert.ok(ics.includes(field), `Missing required field: ${field}`);
    }
  });

  it("uses Asia/Kuala_Lumpur timezone", async () => {
    const { buildSism2026Ics } = await import("./ics.ts");
    const ics = buildSism2026Ics();
    assert.ok(ics.includes("Asia/Kuala_Lumpur"), "TZID should be Asia/Kuala_Lumpur");
  });

  it("covers 19-22 Nov 2026", async () => {
    const { buildSism2026Ics } = await import("./ics.ts");
    const ics = buildSism2026Ics();
    assert.ok(ics.includes("20261119"), "Should start 19 Nov 2026");
    assert.ok(ics.includes("20261122"), "Should end 22 Nov 2026");
  });
});

// ---------------------------------------------------------------------------
// 4. Registration handler: pure function tests
// ---------------------------------------------------------------------------

describe("registration handler", () => {
  async function getHandler() {
    const { handleRegistration } = await import("../../features/registration/server/register.ts");
    return handleRegistration;
  }

  async function makeDemoStore(ticketStatus: "OPEN" | "CLOSED" = "OPEN") {
    const { DemoStore } = await import("./repo.ts");
    const store = new DemoStore();
    if (ticketStatus === "CLOSED") {
      store._setTicketStatus("forum-access", "CLOSED");
    }
    return store;
  }

  const validAttendeeBody = {
    ticket: "forum-access",
    details: {
      fullName: "Amina Bello",
      email: "amina@example.com",
      nationality: "Nigeria",
      countryOfResidence: "Nigeria",
      whatsapp: "+234 803 123 4567",
      gender: "Female",
    },
    consent: true,
  };

  it("valid input → demo checkoutUrl", async () => {
    const [handleRegistration, repo] = await Promise.all([getHandler(), makeDemoStore("OPEN")]);
    const result = await handleRegistration(validAttendeeBody, {
      repo,
      rateLimitAllowed: true,
      createCheckout: null,
      baseUrl: "http://localhost:3000",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.ok(result.checkoutUrl.includes("demo=1"), "Demo URL should include demo=1");
      assert.match(result.reference, /^SISM-[A-Z0-9]{5}$/);
    }
  });

  it("closed tier → 409", async () => {
    const [handleRegistration, repo] = await Promise.all([getHandler(), makeDemoStore("CLOSED")]);
    const result = await handleRegistration(validAttendeeBody, {
      repo,
      rateLimitAllowed: true,
      createCheckout: null,
      baseUrl: "http://localhost:3000",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 409);
  });

  it("honeypot → 400", async () => {
    const [handleRegistration, repo] = await Promise.all([getHandler(), makeDemoStore("OPEN")]);
    const result = await handleRegistration(
      { ...validAttendeeBody, website: "http://spam.com" },
      {
        repo,
        rateLimitAllowed: true,
        createCheckout: null,
        baseUrl: "http://localhost:3000",
      }
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 400);
  });

  it("client-sent price is ignored", async () => {
    const [handleRegistration, repo] = await Promise.all([getHandler(), makeDemoStore("OPEN")]);
    const result = await handleRegistration(
      { ...validAttendeeBody, amountCents: 1 },
      {
        repo,
        rateLimitAllowed: true,
        createCheckout: null,
        baseUrl: "http://localhost:3000",
      }
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.match(result.reference, /^SISM-[A-Z0-9]{5}$/);
    }
  });

  it("rate limited → 429", async () => {
    const [handleRegistration, repo] = await Promise.all([getHandler(), makeDemoStore("OPEN")]);
    const result = await handleRegistration(validAttendeeBody, {
      repo,
      rateLimitAllowed: false,
      createCheckout: null,
      baseUrl: "http://localhost:3000",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 429);
  });

  it("invalid email → 400 with fieldErrors containing email", async () => {
    const [handleRegistration, repo] = await Promise.all([getHandler(), makeDemoStore("OPEN")]);
    const result = await handleRegistration(
      { ...validAttendeeBody, details: { ...validAttendeeBody.details, email: "not-an-email" } },
      {
        repo,
        rateLimitAllowed: true,
        createCheckout: null,
        baseUrl: "http://localhost:3000",
      }
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 400);
      assert.ok("fieldErrors" in result);
      assert.ok(
        Object.keys((result as { fieldErrors: Record<string, string[]> }).fieldErrors).some((k) =>
          k.includes("email")
        ),
        "Should have an email field error"
      );
    }
  });

  it("fully-funded (closed in events.json) → 409 before Zod", async () => {
    const [handleRegistration, repo] = await Promise.all([getHandler(), makeDemoStore("OPEN")]);
    const result = await handleRegistration(
      { ...validAttendeeBody, ticket: "fully-funded" },
      { repo, rateLimitAllowed: true, createCheckout: null, baseUrl: "http://localhost:3000" }
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 409);
      assert.ok("error" in result && (result as { error: string }).error.includes("closed"), "Should mention closed");
    }
  });

  it("forum-access-discounted (unlisted) → 409 before Zod", async () => {
    const [handleRegistration, repo] = await Promise.all([getHandler(), makeDemoStore("OPEN")]);
    const result = await handleRegistration(
      { ...validAttendeeBody, ticket: "forum-access-discounted" },
      { repo, rateLimitAllowed: true, createCheckout: null, baseUrl: "http://localhost:3000" }
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 409);
  });
});

// ---------------------------------------------------------------------------
// 5. DemoStore: findPaymentByCharge + getRegistrationDetails
// ---------------------------------------------------------------------------

describe("DemoStore repo methods", () => {
  it("findPaymentByCharge returns null (no charge IDs in demo mode)", async () => {
    const { DemoStore } = await import("./repo.ts");
    const store = new DemoStore();
    const result = await store.findPaymentByCharge("ch_demo_123");
    assert.equal(result, null);
  });

  it("getRegistrationDetails returns null for unknown id", async () => {
    const { DemoStore } = await import("./repo.ts");
    const store = new DemoStore();
    const result = await store.getRegistrationDetails("nonexistent");
    assert.equal(result, null);
  });

  it("getRegistrationDetails returns real data after createRegistration", async () => {
    const { DemoStore } = await import("./repo.ts");
    const { generateReference } = await import("./reference.ts");
    const store = new DemoStore();
    const ref = await generateReference("SISM", async () => false);
    const reg = await store.createRegistration({
      eventId: "sism-2026",
      ticketId: "demo-ticket-forum-access",
      ticketName: "Forum Access",
      attendeeData: { email: "test@example.com", fullName: "Alice Smith" },
      finalAmountCents: 19900,
      reference: ref,
      idempotencyKey: `test-${Date.now()}`,
    });
    const details = await store.getRegistrationDetails(reg.id);
    assert.ok(details !== null);
    assert.equal(details!.email, "test@example.com");
    assert.equal(details!.recipientName, "Alice Smith");
    assert.equal(details!.reference, ref);
    assert.equal(details!.amountCents, 19900);
  });
});
