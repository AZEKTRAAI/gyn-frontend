// Run with: npm test
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

let dir = "";
before(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "gyn-storage-"));
  process.env.STORAGE_DIR = dir;
  process.env.MIN_FREE_BYTES = "0";
  process.env.FIELD_ENCRYPTION_KEYS = `1:${randomBytes(32).toString("base64")}`;
  process.env.FIELD_ENCRYPTION_KEY_ID = "1";
});
after(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

const load = () => import("./storage.ts");

test("a public file is stored under a random key and read back as is", async () => {
  const s = await load();
  const data = Buffer.from("fake image bytes");
  const f = await s.putPublic(data, "webp");
  assert.match(f.key, /^public\/[0-9a-f]{2}\/[0-9a-f]{2}\/[0-9a-f]{32}\.webp$/);
  assert.equal(f.bytes, data.length);
  assert.ok((await fs.readFile(s.resolveKey(f.key))).equals(data));
});

test("a private file is encrypted on disk and only readable with its own context", async () => {
  const s = await load();
  const doc = Buffer.from("PASSPORT NUMBER A1234567");
  const f = await s.putPrivate(doc, "pdf", "registration:r1:file");
  const onDisk = await fs.readFile(s.resolveKey(f.key));
  assert.ok(!onDisk.includes("A1234567"), "plain text must not be on disk");
  assert.ok((await s.readPrivate(f.key, "registration:r1:file")).equals(doc));
  await assert.rejects(s.readPrivate(f.key, "registration:r2:file"));
});

test("only keys we generated can be turned into a path", async () => {
  const s = await load();
  for (const bad of ["../../etc/passwd", "/etc/passwd", "private/../../x", "public/aa/bb/short.png", "PUBLIC/aa/bb/" + "a".repeat(32), "public/aa/bb/" + "g".repeat(32), ""]) {
    assert.throws(() => s.resolveKey(bad), /valid storage key/, bad);
  }
});

test("no temporary files are left behind", async () => {
  const s = await load();
  await s.putPublic(Buffer.from("x"), "png");
  const all = (await fs.readdir(dir, { recursive: true })) as string[];
  assert.ok(!all.some((f) => f.includes(".tmp-")));
});

test("uploads are refused, and nothing is written, when the disk is nearly full", async () => {
  const s = await load();
  const before = (await fs.readdir(dir, { recursive: true })).length;
  process.env.MIN_FREE_BYTES = String(10 ** 18);
  await assert.rejects(s.putPublic(Buffer.from("x"), "png"), s.StorageFullError);
  process.env.MIN_FREE_BYTES = "0";
  assert.equal((await fs.readdir(dir, { recursive: true })).length, before);
});

test("deleting works and deleting a missing file is fine", async () => {
  const s = await load();
  const f = await s.putPublic(Buffer.from("x"), "png");
  assert.ok(await s.fileExists(f.key));
  await s.deleteFile(f.key);
  assert.ok(!(await s.fileExists(f.key)));
  await s.deleteFile(f.key);
});

test("the media route serves public files and nothing else", async () => {
  const s = await load();
  const pub = await s.putPublic(Buffer.from("fake webp"), "webp");
  const ok = await s.mediaResponse(pub.key.replace("public/", "").split("/"));
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("content-type"), "image/webp");
  assert.match(ok.headers.get("cache-control") ?? "", /immutable/);

  const priv = await s.putPrivate(Buffer.from("passport"), "pdf", "registration:r1:file");
  // Asking for a private key through /media just maps to a public path that does not exist.
  assert.equal((await s.mediaResponse(priv.key.replace("private/", "").split("/"))).status, 404);
  assert.equal((await s.mediaResponse(["..", "private", "x"])).status, 404);
  assert.equal((await s.mediaResponse(["aa", "bb", "nothing.webp"])).status, 404);
});
