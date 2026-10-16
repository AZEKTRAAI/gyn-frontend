// Generates human-readable registration references like "SISM-7K3QX".
// Prefix identifies the event; suffix is 5 chars from a 31-char alphabet that
// excludes visually ambiguous characters (0 O 1 I L).

import { randomBytes } from "node:crypto";

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 31 chars, no 0/O/1/I/L
const SUFFIX_LENGTH = 5;

function randomSuffix(): string {
  const bytes = randomBytes(SUFFIX_LENGTH);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/**
 * Generate a unique reference by checking against an existence predicate.
 * Retries up to `maxAttempts` times (collisions are astronomically rare at 31^5 ≈ 28M).
 */
export async function generateReference(
  prefix: string,
  exists: (ref: string) => Promise<boolean>,
  maxAttempts = 10
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const ref = `${prefix.toUpperCase()}-${randomSuffix()}`;
    if (!(await exists(ref))) return ref;
  }
  throw new Error(`Could not generate a unique reference after ${maxAttempts} attempts`);
}
