// Image upload for the admin editors. Files are saved to the server's own disk (packages/core storage) and served at /media/...
// by the public website and by Caddy.
import { putPublic } from '@gyn/core/storage'

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

/** Detects the format from the file's first bytes; the browser-sent MIME type is not trusted. SVG is refused (it can carry script). */
export function sniffImage(buf: Uint8Array): 'png' | 'jpg' | 'webp' | 'avif' | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...buf.subarray(from, to))
  if (buf.length < 12) return null
  if (buf[0] === 0x89 && ascii(1, 4) === 'PNG') return 'png'
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  if (ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12))) return 'avif'
  return null
}

export class UploadError extends Error {}

/** Saves an uploaded image and returns the URL to store in the content (for example /media/ab/cd/<id>.webp). */
export async function storeImage(file: File): Promise<string> {
  if (file.size === 0) throw new UploadError('The file is empty.')
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError('Images must be 4 MB or smaller.')
  const buf = Buffer.from(await file.arrayBuffer())
  const ext = sniffImage(buf)
  if (!ext) throw new UploadError('Use a PNG, JPG, WebP or AVIF image.')
  const stored = await putPublic(buf, ext)
  return `/media/${stored.key.slice('public/'.length)}`
}
