import { randomUUID } from 'crypto'
import { put } from '@vercel/blob'
import sharp from 'sharp'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5MB
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

export interface SavedImage {
  path: string // public URL, e.g. https://<store>.public.blob.vercel-storage.com/uploads/abc.webp
  width: number
  height: number
  bytes: number
}

/**
 * Validate, compress (→ webp, max 1600px), and persist an uploaded image to
 * Vercel Blob. Returns the public CDN URL.
 *
 * Works on Vercel serverless because nothing is written to the local
 * filesystem — the compressed buffer is streamed straight to object storage.
 */
export async function saveImage(file: File): Promise<SavedImage> {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new UploadError(`Unsupported type "${file.type}". Use JPG, PNG or WEBP.`)
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError('File exceeds the 5MB limit.')
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer())

  const pipeline = sharp(inputBuffer).rotate().resize({
    width: 1600,
    height: 1600,
    fit: 'inside',
    withoutEnlargement: true,
  })

  const { data, info } = await pipeline
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true })

  const objectKey = `uploads/${Date.now()}-${randomUUID().slice(0, 8)}.webp`

  let blob
  try {
    blob = await put(objectKey, data, {
      access: 'public',
      contentType: 'image/webp',
      cacheControlMaxAge: 31536000, // 1 year — each object has a unique name
      addRandomSuffix: false,
    })
  } catch (err) {
    throw new UploadError(`Storage upload failed: ${(err as Error).message}`)
  }

  return {
    path: blob.url,
    width: info.width,
    height: info.height,
    bytes: data.length,
  }
}

export class UploadError extends Error {}
