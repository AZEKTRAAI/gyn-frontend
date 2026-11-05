// Tells the public website to refresh pages after the admin publishes. The two apps talk over the private network with a shared
// secret; the public site's /api/internal/* routes are never reachable from the internet. A failure here never loses the
// edit (it is already saved): the website also refreshes on its own every 5 minutes.
export async function revalidateWeb(paths: string[]): Promise<boolean> {
  const base = process.env.WEB_INTERNAL_URL
  const secret = process.env.INTERNAL_API_SECRET
  if (!base || !secret) return false
  try {
    const res = await fetch(`${base}/api/internal/revalidate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-secret': secret },
      body: JSON.stringify({ paths }),
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch (e) {
    console.error('[admin] could not reach the website to refresh pages', e instanceof Error ? e.message : e)
    return false
  }
}
