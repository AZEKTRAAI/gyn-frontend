// The client IP as seen by the proxy in front of us. Caddy sets X-Real-IP to the connecting address and replaces any value the
// client sent. X-Forwarded-For is only a fallback, and only its rightmost entry (added by our own proxy) is trusted.
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',').at(-1)!.trim()
  return 'unknown'
}
