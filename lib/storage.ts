import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5MB
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export interface SavedImage {
  path: string // public URL path, e.g. /uploads/abc.webp
  width: number
  height: number
  bytes: number
}

/**
 * Validate, compress (→ webp, max 1600px), and persist an uploaded image.
 * Returns the public path. Abstracted so this can later swap to Vercel Blob/S3.
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

  await mkdir(UPLOAD_DIR, { recursive: true })
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.webp`
  await writeFile(path.join(UPLOAD_DIR, filename), data)

  return {
    path: `/uploads/${filename}`,
    width: info.width,
    height: info.height,
    bytes: data.length,
  }
}

export class UploadError extends Error {}
