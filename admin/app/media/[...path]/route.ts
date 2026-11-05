// Lets the editor preview images that were just uploaded (the public website serves the same files at its own /media).
// Public files only; mediaResponse refuses anything under private/. In production Caddy serves the public site's /media first.
export const runtime = 'nodejs'

import { mediaResponse } from '@gyn/core/storage'

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }): Promise<Response> {
  return mediaResponse((await ctx.params).path)
}
