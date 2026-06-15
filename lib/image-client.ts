// Browser-only image compression. Replaces the old server-side sharp pipeline,
// which couldn't ship its native libvips binary into Vercel's serverless bundle.
// Resizes to a max edge and re-encodes to WebP using the canvas API before upload.

const MAX_EDGE = 1600
const WEBP_QUALITY = 0.82

/**
 * Resize (longest edge ≤ 1600px, never enlarged) and convert an image File to
 * WebP, entirely in the browser. EXIF orientation is honoured.
 *
 * Falls back to returning the original file unchanged if the browser lacks the
 * required APIs or encoding fails — the server still validates and stores it.
 */
export async function compressImageToWebp(file: File): Promise<File> {
  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
    )
    if (!blob || blob.type !== 'image/webp') return file

    const baseName = file.name.replace(/\.[^./\\]+$/, '') || 'image'
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
  } catch {
    return file
  }
}
