// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, passwordProblem, verifyPassword } from "./password.ts";
import { PERMISSIONS, ROLES, can } from "./permissions.ts";

test("a password verifies only against its own hash, and every hash is different", async () => {
  const a = await hashPassword("correct horse battery");
  const b = await hashPassword("correct horse battery");
  assert.notEqual(a, b, "random salt");
  assert.match(a, /^scrypt\$32768\$8\$1\$/);
  assert.ok(await verifyPassword("correct horse battery", a));
  assert.ok(!(await verifyPassword("correct horse batterY", a)));
  assert.ok(!(await verifyPassword("anything", "not a real hash")));
});

test("password rules", () => {
  assert.ok(passwordProblem("short"));
  assert.ok(passwordProblem("aaaaaaaaaaaaaaaa"));
  assert.equal(passwordProblem("a long enough passphrase"), null);
});

test("the six SRS roles exist, only the Super Administrator has everything", () => {
  assert.deepEqual(
    ROLES.map((r) => r.name),
    ["Super Administrator", "Event Manager", "Registration Manager", "Finance Manager", "Content Manager", "Viewer"],
  );
  assert.ok(can(ROLES[0].permissions, "users.manage"));
  for (const r of ROLES.slice(1)) assert.ok(!r.permissions.includes("*"), r.name);
});

test("every permission a role lists is a real permission", () => {
  for (const r of ROLES) for (const p of r.permissions) assert.ok(p === "*" || (PERMISSIONS as readonly string[]).includes(p), `${r.name}: ${p}`);
});

test("roles can do what the SRS gives them and nothing close to more", () => {
  const perms = (name: string) => ROLES.find((r) => r.name === name)!.permissions;
  assert.ok(can(perms("Registration Manager"), "applications.decide"));
  assert.ok(can(perms("Registration Manager"), "applications.send_email"));
  assert.ok(!can(perms("Registration Manager"), "payments.refund"));
  assert.ok(can(perms("Finance Manager"), "payments.refund"));
  assert.ok(!can(perms("Finance Manager"), "registrations.view_sensitive"));
  assert.ok(can(perms("Content Manager"), "home.edit"));
  assert.ok(!can(perms("Content Manager"), "registrations.view"));
  assert.ok(can(perms("Viewer"), "registrations.view"));
  assert.ok(!can(perms("Viewer"), "registrations.view_sensitive"));
  assert.ok(!can(perms("Viewer"), "registrations.export"));
  assert.ok(!can(perms("Event Manager"), "users.manage"));
});
