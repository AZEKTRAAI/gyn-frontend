// Run with: npm test (the database parts are in tests/integration)
import assert from "node:assert/strict";
import { test } from "node:test";
import { backoffMs } from "./jobs.ts";

test("retry delays grow and stop at one hour", () => {
  assert.equal(backoffMs(1), 30_000);
  assert.equal(backoffMs(2), 60_000);
  assert.equal(backoffMs(3), 120_000);
  assert.ok(backoffMs(4) > backoffMs(3));
  assert.equal(backoffMs(20), 3_600_000);
});
