// Image upload for the admin editor.
// CLOUDINARY_URL set (cloudinary://KEY:SECRET@CLOUD): signed upload to Cloudinary, returns its https URL.
// Otherwise, in development only: saves to public/uploads and returns /uploads/<hash>.<ext>.
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

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

export async function storeImage(file: File): Promise<string> {
  if (file.size === 0) throw new UploadError('The file is empty.')
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError('Images must be 4 MB or smaller.')
  const buf = new Uint8Array(await file.arrayBuffer())
  const ext = sniffImage(buf)
  if (!ext) throw new UploadError('Use a PNG, JPG, WebP or AVIF image.')
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 20)

  const cloudinary = process.env.CLOUDINARY_URL
  if (cloudinary) {
    const { username: key, password: secret, hostname: cloud } = new URL(cloudinary)
    const params = { folder: 'gyn', public_id: hash, timestamp: String(Math.floor(Date.now() / 1000)) }
    // Cloudinary signature: sorted params joined with &, then the secret, SHA-1.
    const toSign = Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('&')
    const body = new FormData()
    body.set('file', new Blob([buf], { type: `image/${ext === 'jpg' ? 'jpeg' : ext}` }))
    for (const [k, v] of Object.entries(params)) body.set(k, v)
    body.set('api_key', decodeURIComponent(key))
    body.set('signature', createHash('sha1').update(toSign + decodeURIComponent(secret)).digest('hex'))
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body })
    const json = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } }
    if (!res.ok || !json.secure_url) throw new UploadError(`Upload failed: ${json.error?.message ?? res.status}`)
    return json.secure_url
  }

  if (process.env.NODE_ENV === 'production') {
    throw new UploadError('Uploads need CLOUDINARY_URL on the server.')
  }
  const dir = path.join(process.cwd(), 'public', 'uploads')
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, `${hash}.${ext}`), buf)
  return `/uploads/${hash}.${ext}`
}
