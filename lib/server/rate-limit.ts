// Rate limiter: sliding window, keyed by arbitrary string.
// Uses Upstash Redis REST when UPSTASH_REDIS_REST_URL + TOKEN are set,
// otherwise falls back to an in-memory sliding window.
// shortcut: in-memory window is per-process only (doesn't share state across serverless instances);
//           add Upstash credentials in production to get correct cross-instance limiting.
//
// Per-endpoint defaults (pass max to override):
//   registration IP:    max=20 per 10 min  (key "reg:<ip>")
//   registration email: max=3  per 10 min  (key "reg:email:<email>")
//   contact IP:         max=5  per 10 min  (key "contact:<ip>")

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_MAX = 5;

// ---------------------------------------------------------------------------
// In-memory sliding window (dev / demo mode)
// ---------------------------------------------------------------------------

interface Entry {
  timestamps: number[];
}

const store = new Map<string, Entry>();

function checkInMemory(key: string, max: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const entry = store.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
  const allowed = entry.timestamps.length < max;
  if (allowed) entry.timestamps.push(now);
  store.set(key, entry);
  return { allowed, remaining: Math.max(0, max - entry.timestamps.length) };
}

// ---------------------------------------------------------------------------
// Upstash Redis REST sliding window
// Uses a sorted set where member = timestamp, score = timestamp.
// ---------------------------------------------------------------------------

async function checkUpstash(key: string, max: number): Promise<{ allowed: boolean; remaining: number }> {
  const base = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const rkey = `rl:${key}`;

  // Pipeline: ZREMRANGEBYSCORE (prune old), ZADD (add current), ZCARD (count), EXPIRE
  const pipeline = [
    ["ZREMRANGEBYSCORE", rkey, "-inf", String(cutoff)],
    ["ZADD", rkey, String(now), `${now}`],
    ["ZCARD", rkey],
    ["EXPIRE", rkey, String(Math.ceil(WINDOW_MS / 1000))],
  ];

  let res: Response;
  try {
    res = await fetch(`${base}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(pipeline),
    });
  } catch (err) {
    // Network error (Upstash unreachable): degrade to in-memory rather than fail-open.
    console.error({ msg: "rate-limit: Upstash unreachable; falling back to in-memory", error: String(err) });
    return checkInMemory(key, max);
  }

  if (!res.ok) {
    // Fail to in-memory (degraded) rather than fail-open: Redis outage must not disable rate limiting.
    console.error({ msg: "rate-limit: Upstash error; falling back to in-memory", status: res.status });
    return checkInMemory(key, max);
  }

  const results = (await res.json()) as Array<{ result: unknown }>;
  // results[2].result is the ZCARD value = current count after adding
  const count = Number(results[2]?.result ?? 1);
  const allowed = count <= max;
  return { allowed, remaining: Math.max(0, max - count) };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function checkRateLimit(
  key: string,
  max: number = DEFAULT_MAX
): Promise<{ allowed: boolean; remaining: number }> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return checkUpstash(key, max);
  }
  return checkInMemory(key, max);
}
