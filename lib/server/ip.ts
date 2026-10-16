// Extract the trusted client IP from a Next.js request.
// On Vercel, x-real-ip is set by the edge and cannot be spoofed by the client.
// x-forwarded-for's RIGHTMOST value is added by the last trusted proxy (also safe).
// NEVER trust the leftmost x-forwarded-for — the client can inject arbitrary values there.
import type { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  // Rightmost XFF entry is appended by the closest trusted proxy (Vercel edge).
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",");
    return parts[parts.length - 1].trim();
  }
  return "unknown";
}
