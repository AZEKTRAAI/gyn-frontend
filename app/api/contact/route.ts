// Node runtime: uses Prisma via getRepo().
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getRepo } from "@/lib/db.ts";
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

  const { allowed } = await checkRateLimit(`contact:${ip}`);

  const repo = getRepo();
  const result = await handleContact(body, allowed, repo);

  if (!result.ok) {
    if ("fieldErrors" in result) {
      return NextResponse.json({ fieldErrors: result.fieldErrors }, { status: result.status });
    }
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
