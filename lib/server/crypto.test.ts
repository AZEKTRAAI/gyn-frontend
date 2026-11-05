// Run with: npm test
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import {
  CryptoError, decryptBytes, decryptField, encryptBytes, encryptField, hashToken, isEncrypted, loadKeyring, randomToken, safeEqual,
} from "./crypto.ts";

const k1 = randomBytes(32).toString("base64");
const k2 = randomBytes(32).toString("base64");
const ring1 = loadKeyring({ FIELD_ENCRYPTION_KEYS: `1:${k1}`, FIELD_ENCRYPTION_KEY_ID: "1" });
const ring12 = loadKeyring({ FIELD_ENCRYPTION_KEYS: `1:${k1},2:${k2}`, FIELD_ENCRYPTION_KEY_ID: "2" });
const CTX = "registration:r1:field:passport";

test("a field round-trips and is marked as encrypted", () => {
  const enc = encryptField("A1234567", CTX, ring1);
  assert.ok(isEncrypted(enc));
  assert.ok(!enc.includes("A1234567"));
  assert.equal(decryptField(enc, CTX, ring1), "A1234567");
});

test("the same text encrypts differently every time", () => {
  assert.notEqual(encryptField("same", CTX, ring1), encryptField("same", CTX, ring1));
});

test("a ciphertext copied to another record does not decrypt", () => {
  const enc = encryptField("A1234567", CTX, ring1);
  assert.throws(() => decryptField(enc, "registration:OTHER:field:passport", ring1), CryptoError);
});

test("tampering with the stored value is detected", () => {
  const enc = encryptField("A1234567", CTX, ring1);
  const flipped = enc.slice(0, -4) + (enc.endsWith("AAAA") ? "BBBB" : "AAAA");
  assert.throws(() => decryptField(flipped, CTX, ring1), CryptoError);
});

test("key rotation: old values still decrypt, new values use the new key", () => {
  const old = encryptField("before rotation", CTX, ring1);
  assert.equal(decryptField(old, CTX, ring12), "before rotation");
  assert.ok(encryptField("after", CTX, ring12).startsWith("enc:v1:2:"));
});

test("a value made with a removed key fails with a clear error", () => {
  const withKey2 = encryptField("x", CTX, ring12);
  assert.throws(() => decryptField(withKey2, CTX, ring1), /No key with id 2/);
});

test("bad key settings are rejected", () => {
  assert.throws(() => loadKeyring({}), /not set/);
  assert.throws(() => loadKeyring({ FIELD_ENCRYPTION_KEYS: "1:c2hvcnQ=" }), /32 bytes/);
  assert.throws(() => loadKeyring({ FIELD_ENCRYPTION_KEYS: `1:${k1}`, FIELD_ENCRYPTION_KEY_ID: "9" }), /not in/);
});

test("files round-trip, hide their content, and are bound to their context", () => {
  const pdf = Buffer.from("%PDF-1.7 passport scan bytes");
  const enc = encryptBytes(pdf, CTX, ring1);
  assert.ok(enc.subarray(0, 4).equals(Buffer.from("GYN1")));
  assert.ok(!enc.includes("passport scan"));
  assert.ok(decryptBytes(enc, CTX, ring1).equals(pdf));
  assert.throws(() => decryptBytes(enc, "registration:other:file", ring1), CryptoError);
  assert.throws(() => decryptBytes(Buffer.from("not encrypted at all, just text"), CTX, ring1), /not in the encrypted format/);
});

test("tokens are random, hashes are stable, comparisons are exact", () => {
  assert.notEqual(randomToken(), randomToken());
  assert.equal(hashToken("abc"), hashToken("abc"));
  assert.equal(hashToken("abc").length, 64);
  assert.ok(safeEqual("secret", "secret"));
  assert.ok(!safeEqual("secret", "secreT"));
  assert.ok(!safeEqual("short", "longer value"));
});
