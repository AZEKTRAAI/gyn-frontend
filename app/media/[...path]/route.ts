// Serves uploaded public images and videos from the storage folder. In production Caddy answers /media/* straight from disk
// first; this route is what next/image's optimizer reaches, and what serves them in development.
export const runtime = 'nodejs'

import { mediaResponse } from '@gyn/core/storage'

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }): Promise<Response> {
  return mediaResponse((await ctx.params).path)
}
