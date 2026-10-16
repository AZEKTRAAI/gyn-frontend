// Static ICS file for SISM 2026 — no DB required, no credentials needed.
// RFC 5545 compliant: CRLF line endings, TZID Asia/Kuala_Lumpur.
export const runtime = "nodejs";
// Statically cacheable: event details don't change.
export const dynamic = "force-static";

import { NextResponse } from "next/server";
import { buildSism2026Ics } from "@/lib/server/ics.ts";

export async function GET(): Promise<NextResponse> {
  const ics = buildSism2026Ics();
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sism-2026.ics"',
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
