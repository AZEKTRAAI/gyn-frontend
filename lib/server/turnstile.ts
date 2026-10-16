// Cloudflare Turnstile server-side verification.
// Calls the Turnstile siteverify API when TURNSTILE_SECRET_KEY is set.
// In demo mode (no key), always passes — log a warning so it's visible.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string | undefined): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Demo mode: Turnstile is not configured; skip verification.
    console.warn({ msg: "turnstile: TURNSTILE_SECRET_KEY not set; skipping verification (demo mode)" });
    return;
  }
  if (!token) {
    throw new TurnstileError("Please complete the CAPTCHA challenge.");
  }

  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });

  if (!res.ok) {
    throw new TurnstileError("CAPTCHA verification failed. Please try again.");
  }

  const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
  if (!data.success) {
    throw new TurnstileError("CAPTCHA verification failed. Please try again.");
  }
}

export class TurnstileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TurnstileError";
  }
}
