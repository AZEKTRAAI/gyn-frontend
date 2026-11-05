// HTTP Basic Auth guard for /pitch. Set PITCH_BASIC_AUTH="user:password" in env; unset leaves /pitch open.
// The admin is a separate app now (admin/), with its own sign-in. Nothing admin-related is served by this site.
import { NextRequest, NextResponse } from "next/server";

function basicAuthResponse(): NextResponse {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Restricted"' },
  });
}

function checkBasicAuth(req: NextRequest, envVar: string): NextResponse | null {
  const expected = process.env[envVar];
  if (!expected) {
    return null;
  }
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return basicAuthResponse();
  const decoded = Buffer.from(auth.slice(6), "base64").toString("utf-8");
  if (decoded !== expected) return basicAuthResponse();
  return null; // authenticated
}

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/pitch")) {
    const res = checkBasicAuth(req, "PITCH_BASIC_AUTH");
    if (res) return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/pitch/:path*"],
};
