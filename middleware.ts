// HTTP Basic Auth guard for /admin and /pitch routes.
// Set ADMIN_BASIC_AUTH="user:password" and PITCH_BASIC_AUTH="user:password" in env.
// When the env var is absent the route is unguarded (acceptable for demo; set before launch).
import { NextRequest, NextResponse } from "next/server";

function basicAuthResponse(): NextResponse {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Restricted"' },
  });
}

function checkBasicAuth(req: NextRequest, envVar: string): NextResponse | null {
  const expected = process.env[envVar];
  if (!expected) return null; // no env var = unguarded in demo mode
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return basicAuthResponse();
  const decoded = Buffer.from(auth.slice(6), "base64").toString("utf-8");
  if (decoded !== expected) return basicAuthResponse();
  return null; // authenticated
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin")) {
    const res = checkBasicAuth(req, "ADMIN_BASIC_AUTH");
    if (res) return res;
  }
  if (pathname.startsWith("/pitch")) {
    const res = checkBasicAuth(req, "PITCH_BASIC_AUTH");
    if (res) return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/pitch/:path*"],
};
