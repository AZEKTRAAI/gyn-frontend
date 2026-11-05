// Field and file encryption (AES-256-GCM) plus token helpers.
//
// Sensitive form answers and participant documents are encrypted here before they reach the database or the disk, so a
// stolen database dump or upload folder is unreadable without the key. The key lives only in the server's environment.
//
// Keys:  FIELD_ENCRYPTION_KEYS="1:<base64 of 32 bytes>,2:<...>"   FIELD_ENCRYPTION_KEY_ID="2"
// Make one:  openssl rand -base64 32
// Rotation: add a new key id, set FIELD_ENCRYPTION_KEY_ID to it. Old values keep decrypting because every value names its key.
// Every value is also bound to a context string (for example "registration:<id>:field:<fieldId>"), so a ciphertext copied
// to another record fails to decrypt instead of showing up in the wrong place.

import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

export class CryptoError extends Error {}

const IV_BYTES = 12;
const TAG_BYTES = 16;
const FIELD_PREFIX = "enc:v1:";
const FILE_MAGIC = Buffer.from("GYN1");

export type Keyring = { current: number; keys: Map<number, Buffer> };

/** Parse the key settings. Pure, so tests can pass their own values. */
export function loadKeyring(env: Record<string, string | undefined> = process.env): Keyring {
  const raw = env.FIELD_ENCRYPTION_KEYS?.trim();
  if (!raw) throw new CryptoError("FIELD_ENCRYPTION_KEYS is not set.");
  const keys = new Map<number, Buffer>();
  for (const part of raw.split(",")) {
    const [idText, b64] = part.trim().split(":");
    const id = Number(idText);
    if (!Number.isInteger(id) || id < 1 || id > 255) throw new CryptoError("Key ids must be whole numbers from 1 to 255.");
    const key = Buffer.from(b64 ?? "", "base64");
    if (key.length !== 32) throw new CryptoError(`Key ${id} must be 32 bytes (44 characters of base64).`);
    keys.set(id, key);
  }
  const current = Number(env.FIELD_ENCRYPTION_KEY_ID ?? [...keys.keys()].at(-1));
  if (!keys.has(current)) throw new CryptoError(`FIELD_ENCRYPTION_KEY_ID ${current} is not in FIELD_ENCRYPTION_KEYS.`);
  return { current, keys };
}

let cached: Keyring | null = null;
function ring(): Keyring {
  return (cached ??= loadKeyring());
}

function key(r: Keyring, id: number): Buffer {
  const k = r.keys.get(id);
  if (!k) throw new CryptoError(`No key with id ${id}. It was removed from FIELD_ENCRYPTION_KEYS.`);
  return k;
}

function seal(plain: Buffer, context: string, r: Keyring): { iv: Buffer; tag: Buffer; data: Buffer } {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key(r, r.current), iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const data = Buffer.concat([cipher.update(plain), cipher.final()]);
  return { iv, tag: cipher.getAuthTag(), data };
}

function open(keyId: number, iv: Buffer, tag: Buffer, data: Buffer, context: string, r: Keyring): Buffer {
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(r, keyId), iv);
    decipher.setAAD(Buffer.from(context, "utf8"));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]);
  } catch (e) {
    if (e instanceof CryptoError) throw e;
    // Wrong key, wrong context, or tampered data all land here, on purpose without telling which.
    throw new CryptoError("Could not decrypt: the data was changed, moved to another record, or the key is wrong.");
  }
}

// ---------------------------------------------------------------------------
// Text fields: stored as "enc:v1:<keyId>:<base64(iv | tag | ciphertext)>"
// ---------------------------------------------------------------------------

export function isEncrypted(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(FIELD_PREFIX);
}

export function encryptField(plain: string, context: string, r: Keyring = ring()): string {
  const { iv, tag, data } = seal(Buffer.from(plain, "utf8"), context, r);
  return `${FIELD_PREFIX}${r.current}:${Buffer.concat([iv, tag, data]).toString("base64")}`;
}

export function decryptField(value: string, context: string, r: Keyring = ring()): string {
  if (!isEncrypted(value)) throw new CryptoError("That value is not encrypted.");
  const [idText, b64] = value.slice(FIELD_PREFIX.length).split(":");
  const blob = Buffer.from(b64 ?? "", "base64");
  if (blob.length < IV_BYTES + TAG_BYTES) throw new CryptoError("The encrypted value is too short.");
  const iv = blob.subarray(0, IV_BYTES);
  const tag = blob.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  return open(Number(idText), iv, tag, blob.subarray(IV_BYTES + TAG_BYTES), context, r).toString("utf8");
}

// ---------------------------------------------------------------------------
// Files: "GYN1" | keyId (1 byte) | iv | tag | ciphertext
// ---------------------------------------------------------------------------

export function encryptBytes(plain: Buffer, context: string, r: Keyring = ring()): Buffer {
  const { iv, tag, data } = seal(plain, context, r);
  return Buffer.concat([FILE_MAGIC, Buffer.from([r.current]), iv, tag, data]);
}

export function decryptBytes(blob: Buffer, context: string, r: Keyring = ring()): Buffer {
  const head = FILE_MAGIC.length + 1;
  if (blob.length < head + IV_BYTES + TAG_BYTES || !blob.subarray(0, FILE_MAGIC.length).equals(FILE_MAGIC)) {
    throw new CryptoError("That file is not in the encrypted format.");
  }
  const keyId = blob[FILE_MAGIC.length];
  const iv = blob.subarray(head, head + IV_BYTES);
  const tag = blob.subarray(head + IV_BYTES, head + IV_BYTES + TAG_BYTES);
  return open(keyId, iv, tag, blob.subarray(head + IV_BYTES + TAG_BYTES), context, r);
}

// ---------------------------------------------------------------------------
// Tokens and hashes
// ---------------------------------------------------------------------------

export function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

/** A random URL-safe token. Only its hash is stored (sessions, payment retry links). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return sha256Hex(token);
}

/** Compare two secrets without leaking where they differ. */
export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
