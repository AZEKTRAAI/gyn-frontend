// The background worker: runs the jobs the app queued (emails, letters, payment re-checks).
// Start: npm run worker (dev) or the "worker" service in docker-compose.yml.
// It never talks to browsers, so it keeps working when the website is busy or being redeployed.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Pool } from "pg";
import { recoverStaleJobs } from "@gyn/core/jobs";
import { handlers } from "./handlers.ts";
import { runOnce } from "./runner.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("worker: DATABASE_URL is not set.");
  process.exit(1);
}

const workerId = `${os.hostname()}:${process.pid}`;
const pollMs = Number(process.env.WORKER_POLL_MS) || 2000;
const batch = Number(process.env.WORKER_BATCH) || 5;
// Docker's healthcheck looks at this file's age: a worker stuck or crashed stops touching it.
const heartbeatFile = process.env.WORKER_HEARTBEAT_FILE ?? path.join(os.tmpdir(), "worker-heartbeat");

const pool = new Pool({ connectionString: databaseUrl, max: Number(process.env.WORKER_POOL_MAX) || 4 });
let stopping = false;
let lastHeartbeat = 0;
let lastRecovery = 0;

function heartbeat(): void {
  const now = Date.now();
  if (now - lastHeartbeat < 15_000) return;
  lastHeartbeat = now;
  try {
    fs.writeFileSync(heartbeatFile, String(now));
  } catch {
    // Not fatal: only the container healthcheck needs it.
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  console.log(`worker ${workerId} started (poll ${pollMs} ms, batch ${batch})`);
  while (!stopping) {
    heartbeat();
    try {
      if (Date.now() - lastRecovery > 60_000) {
        lastRecovery = Date.now();
        const n = await recoverStaleJobs(pool);
        if (n > 0) console.warn(`worker: put ${n} stuck job(s) back in the queue`);
      }
      const pass = await runOnce(pool, handlers, { workerId, batch });
      if (pass.claimed > 0) {
        console.log(`worker: ${pass.succeeded} done, ${pass.retried} will retry, ${pass.failed} failed`);
        continue; // more work may be waiting: go straight round again
      }
    } catch (err) {
      // The database may be restarting. Log and try again; the jobs are safe in the table.
      console.error("worker: pass failed", err instanceof Error ? err.message : err);
    }
    await sleep(pollMs);
  }
  await pool.end();
  console.log("worker stopped");
}

// Finish the current pass, then stop. Docker sends SIGTERM on every redeploy.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    console.log(`worker: ${signal} received, finishing the current pass`);
    stopping = true;
  });
}

main().catch((err) => {
  console.error("worker crashed:", err);
  process.exit(1);
});
