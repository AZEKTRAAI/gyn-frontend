// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { auditWhere, generateTemporaryPassword, newPasswordProblem, redactAudit, userChangeProblem, validateNewUser } from "./admin-users.ts";
import { passwordProblem } from "./password.ts";

test("new user input is checked", () => {
  const ok = { name: "Sara Khan", email: "sara@example.org", role: "Viewer" };
  assert.equal(validateNewUser(ok), null);
  assert.ok(validateNewUser({ ...ok, name: "  " }));
  assert.ok(validateNewUser({ ...ok, email: "sara@" }));
  assert.ok(validateNewUser({ ...ok, email: "sa ra@example.org" }));
  assert.ok(validateNewUser({ ...ok, role: "Root" }));
});

test("temporary passwords are long enough, readable and different every time", () => {
  const a = generateTemporaryPassword();
  assert.equal(passwordProblem(a), null);
  assert.match(a, /^[A-Za-z2-9]{16}$/);
  assert.doesNotMatch(a, /[01OlI]/);
  assert.notEqual(a, generateTemporaryPassword());
});

const base = { actorId: "a", targetId: "b", targetIsActiveSuper: false, activeSuperAdmins: 2, deactivate: false, demote: false };
test("nobody deactivates themselves", () => {
  assert.ok(userChangeProblem({ ...base, targetId: "a", deactivate: true }));
  assert.equal(userChangeProblem({ ...base, deactivate: true }), null);
});
test("the last active Super Administrator cannot be deactivated or demoted", () => {
  const last = { ...base, targetIsActiveSuper: true, activeSuperAdmins: 1 };
  assert.ok(userChangeProblem({ ...last, deactivate: true }));
  assert.ok(userChangeProblem({ ...last, demote: true }));
  assert.equal(userChangeProblem({ ...last, activeSuperAdmins: 2, deactivate: true }), null);
  assert.equal(userChangeProblem({ ...last, activeSuperAdmins: 2, demote: true }), null);
  assert.equal(userChangeProblem({ ...base, activeSuperAdmins: 1, deactivate: true }), null, "someone who is not a Super Administrator does not count");
});

test("the password change rules", () => {
  assert.ok(newPasswordProblem("", "a long new passphrase", "a long new passphrase"));
  assert.ok(newPasswordProblem("old password here", "short", "short"));
  assert.ok(newPasswordProblem("same password 123", "same password 123", "same password 123"));
  assert.ok(newPasswordProblem("old password here", "a long new passphrase", "a long new passphras"));
  assert.equal(newPasswordProblem("old password here", "a long new passphrase", "a long new passphrase"), null);
});

test("secrets never show in the audit viewer, at any depth", () => {
  const shown = redactAudit({ email: "a@b.co", passwordHash: "scrypt$x", nested: [{ temporaryPassword: "x", totpSecretEnc: "y", role: "Viewer" }], token: "t" });
  assert.deepEqual(shown, { email: "a@b.co", passwordHash: "[hidden]", nested: [{ temporaryPassword: "[hidden]", totpSecretEnc: "[hidden]", role: "Viewer" }], token: "[hidden]" });
  assert.equal(redactAudit(null), null);
});

test("audit date filters are inclusive calendar days in UTC and ignore junk", () => {
  const w = auditWhere({ from: "2026-11-01", to: "2026-11-02", action: "LOGIN" });
  assert.deepEqual(w.createdAt, { gte: new Date("2026-11-01T00:00:00Z"), lt: new Date("2026-11-03T00:00:00Z") });
  assert.equal(w.action, "LOGIN");
  assert.deepEqual(auditWhere({ from: "yesterday", to: "2026-13-45" }), {});
});
