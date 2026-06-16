import { randomUUID } from 'crypto'
import { put } from '@vercel/blob'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5MB
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export interface SavedImage {
  path: string // public URL, e.g. https://<store>.public.blob.vercel-storage.com/uploads/abc.webp
  bytes: number
}

/**
 * Validate and persist an uploaded image to Vercel Blob, returning the public
 * CDN URL.
 *
 * Compression/resizing to WebP happens in the browser before upload (see
 * lib/image-client.ts) — sharp can't run in Vercel's Turbopack serverless
 * bundle. This just validates and stores the bytes, so it works anywhere.
 */
export async function saveImage(file: File): Promise<SavedImage> {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new UploadError(`Unsupported type "${file.type}". Use JPG, PNG or WEBP.`)
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError('File exceeds the 5MB limit.')
  }

  const data = Buffer.from(await file.arrayBuffer())
  const ext = EXT_BY_MIME[file.type] ?? 'bin'
  const objectKey = `uploads/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`

  let blob
  try {
    blob = await put(objectKey, data, {
      access: 'public',
      contentType: file.type,
      cacheControlMaxAge: 31536000, // 1 year — each object has a unique name
      addRandomSuffix: false,
    })
  } catch (err) {
    throw new UploadError(`Storage upload failed: ${(err as Error).message}`)
  }

  return {
    path: blob.url,
    bytes: data.length,
  }
}

// Proof-of-authenticity documents from the public supplier form. Unlike product
// images these aren't browser-compressed, so we allow PDFs alongside images and
// a larger ceiling. Keys live under a separate prefix.
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024 // 10MB
export const ALLOWED_DOCUMENT_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]

const DOC_EXT_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export interface SavedDocument {
  path: string // public Blob URL
  name: string // original filename, for display in the admin UI
  bytes: number
}

/** Validate and persist a supplier document (PDF or image) to Vercel Blob. */
export async function saveDocument(file: File): Promise<SavedDocument> {
  if (!ALLOWED_DOCUMENT_MIME.includes(file.type)) {
    throw new UploadError(`Unsupported type "${file.type || 'unknown'}". Use PDF, JPG, PNG or WEBP.`)
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new UploadError('File exceeds the 10MB limit.')
  }

  const data = Buffer.from(await file.arrayBuffer())
  const ext = DOC_EXT_BY_MIME[file.type] ?? 'bin'
  const objectKey = `supplier-docs/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`

  let blob
  try {
    blob = await put(objectKey, data, {
      access: 'public',
      contentType: file.type,
      cacheControlMaxAge: 31536000,
      addRandomSuffix: false,
    })
  } catch (err) {
    throw new UploadError(`Storage upload failed: ${(err as Error).message}`)
  }

  return { path: blob.url, name: file.name || `document.${ext}`, bytes: data.length }
}

export class UploadError extends Error {}
