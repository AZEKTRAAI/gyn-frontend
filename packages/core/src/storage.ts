// File storage on the server's own disk (replaces Cloudinary).
//
//   <root>/public/ab/cd/<32 hex>.webp   served by Caddy at /media/..., never encrypted
//   <root>/private/ab/cd/<32 hex>.pdf   passports, CVs, letter PDFs: encrypted, only read through admin code
//
// Rules this module keeps:
//  - Names are random. The original file name is stored in the database, never on disk.
//  - A key can only ever point inside the storage root (strict pattern, no path joining of user input).
//  - A file is written under a temporary name, flushed to disk, then renamed into place. A crash leaves either the whole
//    file or nothing, never half a file.
//  - Writes are refused with StorageFullError when free space would drop under MIN_FREE_BYTES (default 1 GiB). A full disk is
//    how a database stops accepting writes, so we stop taking uploads first.

import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { decryptBytes, encryptBytes, sha256Hex } from "./crypto.ts";

export class StorageError extends Error {}
export class StorageFullError extends StorageError {}

export type Visibility = "public" | "private";

const KEY_PATTERN = /^(public|private)\/[0-9a-f]{2}\/[0-9a-f]{2}\/[0-9a-f]{32}(\.[a-z0-9]{1,8})?$/;
const DEFAULT_MIN_FREE = 1024 ** 3;

export function storageRoot(): string {
  // The upload folder is chosen at run time and is never part of the build, so the bundler must not try to trace it.
  return path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_DIR ?? "./data/uploads");
}

function minFreeBytes(): number {
  const n = Number(process.env.MIN_FREE_BYTES);
  return Number.isFinite(n) && n >= 0 && process.env.MIN_FREE_BYTES ? n : DEFAULT_MIN_FREE;
}

/** Turn a storage key into an absolute path, refusing anything that is not a key we generated. */
export function resolveKey(key: string): string {
  if (!KEY_PATTERN.test(key)) throw new StorageError("Not a valid storage key.");
  return path.join(/*turbopackIgnore: true*/ storageRoot(), ...key.split("/"));
}

function newKey(visibility: Visibility, ext: string): string {
  const id = randomBytes(16).toString("hex");
  const clean = /^[a-z0-9]{1,8}$/.test(ext) ? `.${ext}` : "";
  return `${visibility}/${id.slice(0, 2)}/${id.slice(2, 4)}/${id}${clean}`;
}

/** Free bytes on the volume that holds the storage root. */
export async function diskFree(): Promise<number> {
  await fs.mkdir(storageRoot(), { recursive: true });
  const s = await fs.statfs(storageRoot());
  return Number(s.bavail) * Number(s.bsize);
}

async function writeAtomic(abs: string, data: Buffer): Promise<void> {
  const free = await diskFree();
  if (free - data.length < minFreeBytes()) {
    throw new StorageFullError("The server is almost out of disk space, so uploads are paused. Tell the administrator.");
  }
  await fs.mkdir(path.dirname(abs), { recursive: true });
  const tmp = `${abs}.tmp-${randomBytes(4).toString("hex")}`;
  const handle = await fs.open(tmp, "wx", 0o640);
  try {
    await handle.writeFile(data);
    await handle.sync();
  } catch (e) {
    await handle.close();
    await fs.rm(tmp, { force: true });
    throw e;
  }
  await handle.close();
  await fs.rename(tmp, abs);
}

export interface StoredFile {
  key: string;
  /** Size of the original (decrypted) content. */
  bytes: number;
  /** SHA-256 of the original content. */
  sha256: string;
}

/** Public media: photos, logos, banners. Not encrypted, because Caddy serves them straight from disk. */
export async function putPublic(data: Buffer, ext: string): Promise<StoredFile> {
  const key = newKey("public", ext);
  await writeAtomic(resolveKey(key), data);
  return { key, bytes: data.length, sha256: sha256Hex(data) };
}

/**
 * Private files: always encrypted. `context` ties the file to its owner (for example "registration:<id>:file"), so a
 * file copied under another record's key cannot be read back there.
 */
export async function putPrivate(data: Buffer, ext: string, context: string): Promise<StoredFile> {
  const key = newKey("private", ext);
  await writeAtomic(resolveKey(key), encryptBytes(data, context));
  return { key, bytes: data.length, sha256: sha256Hex(data) };
}

export async function readPrivate(key: string, context: string): Promise<Buffer> {
  if (!key.startsWith("private/")) throw new StorageError("Not a private file.");
  return decryptBytes(await fs.readFile(resolveKey(key)), context);
}

export async function deleteFile(key: string): Promise<void> {
  await fs.rm(resolveKey(key), { force: true });
}

export async function fileExists(key: string): Promise<boolean> {
  try {
    await fs.access(resolveKey(key));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Serving public files (both apps expose /media/*; in production Caddy answers first)
// ---------------------------------------------------------------------------

const TYPES: Record<string, string> = {
  webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", avif: "image/avif",
  mp4: "video/mp4", webm: "video/webm",
};

/**
 * A Response for /media/<ab>/<cd>/<id>.<ext>. Only files under public/ are ever readable here, and only types we
 * allow, so a private document can never be fetched through this route even if someone guesses its key.
 */
export async function mediaResponse(segments: string[]): Promise<Response> {
  const key = `public/${segments.join("/")}`;
  const ext = key.split(".").pop() ?? "";
  try {
    const data = await fs.readFile(resolveKey(key));
    const type = TYPES[ext];
    if (!type) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
