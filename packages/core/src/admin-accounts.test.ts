import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAdminAccounts } from "./admin-accounts.ts";

const good = {
  ADMIN_1_EMAIL: "  Jane@GYN.org ",
  ADMIN_1_NAME: "Jane Doe",
  ADMIN_1_ROLE: "",
  ADMIN_1_PASSWORD: "a long safe password!",
};

test("a filled slot becomes a Super Administrator by default, email lower-cased", () => {
  const { accounts, errors } = parseAdminAccounts(good);
  assert.deepEqual(errors, []);
  assert.deepEqual(accounts, [{ slot: 1, email: "jane@gyn.org", name: "Jane Doe", role: "Super Administrator", password: "a long safe password!" }]);
});

test("empty slots are skipped and a role name is matched ignoring case", () => {
  const { accounts, errors } = parseAdminAccounts({ ...good, ADMIN_2_EMAIL: "", ADMIN_3_EMAIL: "f@gyn.org", ADMIN_3_NAME: "Fin", ADMIN_3_ROLE: "finance manager", ADMIN_3_PASSWORD: "another long password" });
  assert.deepEqual(errors, []);
  assert.deepEqual(accounts.map((a) => [a.slot, a.role]), [[1, "Super Administrator"], [3, "Finance Manager"]]);
});

test("problems are all reported and nothing half-valid is returned silently", () => {
  const { errors } = parseAdminAccounts({
    ADMIN_1_EMAIL: "not-an-email", ADMIN_1_NAME: "", ADMIN_1_PASSWORD: "short",
    ADMIN_2_EMAIL: "x@gyn.test", ADMIN_2_NAME: "Demo", ADMIN_2_PASSWORD: "a long safe password!",
    ADMIN_3_EMAIL: "ok@gyn.org", ADMIN_3_NAME: "Ok", ADMIN_3_ROLE: "Wizard", ADMIN_3_PASSWORD: "a long safe password!",
  });
  assert.ok(errors.some((e) => e.startsWith("ADMIN_1_EMAIL")));
  assert.ok(errors.some((e) => e.startsWith("ADMIN_1_NAME")));
  assert.ok(errors.some((e) => e.startsWith("ADMIN_1_PASSWORD")));
  assert.ok(errors.some((e) => e.startsWith("ADMIN_2_EMAIL") && e.includes("demo")));
  assert.ok(errors.some((e) => e.startsWith("ADMIN_3_ROLE")));
});

test("the same email in two slots, and an unedited placeholder password, are refused", () => {
  const { errors } = parseAdminAccounts({ ...good, ADMIN_2_EMAIL: "jane@gyn.org", ADMIN_2_NAME: "Dup", ADMIN_2_PASSWORD: "REPLACE_WITH_A_LONG_PASSWORD" });
  assert.ok(errors.some((e) => e.startsWith("ADMIN_2_EMAIL") && e.includes("already used")));
  assert.ok(errors.some((e) => e.startsWith("ADMIN_2_PASSWORD") && e.includes("real password")));
});
