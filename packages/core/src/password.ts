// Password hashing with scrypt from Node's own crypto (no dependency).
// Stored as "scrypt$N$r$p$<salt b64>$<hash b64>", so the cost can be raised later and old hashes still verify.

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LEN = 64;
// scrypt needs about 128 * N * r bytes (32 MB here); Node's default limit is exactly that, so give it headroom.
const MAXMEM = 96 * 1024 * 1024;

function derive(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, KEY_LEN, { N: n, r, p, maxmem: MAXMEM }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await derive(password, Buffer.from(saltB64, "base64"), Number(n), Number(r), Number(p));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** A hash to compare against when the email is unknown, so "no such user" takes as long as "wrong password". */
let decoy: Promise<string> | null = null;
export function decoyHash(): Promise<string> {
  return (decoy ??= hashPassword("a password nobody has"));
}

/** Rules for passwords people choose. Returns an error message, or null when it is fine. */
export function passwordProblem(password: string): string | null {
  if (password.length < 12) return "Use at least 12 characters.";
  if (/^(.)\1+$/.test(password)) return "That password is too simple.";
  return null;
}
