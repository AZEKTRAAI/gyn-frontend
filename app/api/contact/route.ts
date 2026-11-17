// Node runtime: uses Prisma via getRepo().
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "sin1"; // Neon Singapore; avoids cross-Pacific DB round-trips

import { NextRequest, NextResponse } from "next/server";
import { getRepo } from "@/lib/db.ts";
import { getPrisma } from "@gyn/core/db";
import { saveContactMessage } from "@gyn/core/contact-store";
import type { Repo } from "@/lib/server/repo.ts";
import { checkRateLimit } from "@/lib/server/rate-limit.ts";
import { verifyTurnstile, TurnstileError } from "@/lib/server/turnstile.ts";
import { handleContact } from "@/features/contact/server/contact.ts";
import { getClientIp } from "@/lib/server/ip.ts";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "Request body must be JSON." } }, { status: 400 });
  }

  // Rate limit first, so rejected clients never cost a Turnstile siteverify call.
  const { allowed } = await checkRateLimit(`contact:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes and try again." }, { status: 429 });
  }

  try {
    const token = typeof body === "object" && body !== null && "turnstileToken" in body
      ? (body as Record<string, unknown>).turnstileToken as string | undefined
      : undefined;
    await verifyTurnstile(token);
  } catch (err) {
    if (err instanceof TurnstileError) {
      return NextResponse.json({ fieldErrors: { form: [err.message] } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } }, { status: 500 });
  }

  // With a database every valid message is saved first, with the client IP; a failed write comes back as a 500, never as success.
  // handleContact only calls saveContactSubmission, so the shim is enough. No email is sent from this route.
  const repo = getPrisma()
    ? ({ saveContactSubmission: (d) => saveContactMessage({ ...d, ip }) } as Pick<Repo, "saveContactSubmission"> as Repo)
    : getRepo();
  const result = await handleContact(body, true, repo);

  if (!result.ok) {
    if ("fieldErrors" in result) {
      return NextResponse.json({ fieldErrors: result.fieldErrors }, { status: result.status });
    }
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
