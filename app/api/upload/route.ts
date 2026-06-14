import { type NextRequest } from 'next/server'
import { handler, ok, fail } from '@/lib/api'
import { requireUser } from '@/lib/auth/session'
import { saveImage, UploadError } from '@/lib/storage'

export const runtime = 'nodejs'

// POST /api/upload — multipart/form-data with one or more `file` fields.
export const POST = handler(async (req: NextRequest) => {
  await requireUser() // any authenticated admin may upload

  const form = await req.formData()
  const files = form.getAll('file').filter((f): f is File => f instanceof File)

  if (files.length === 0) return fail(400, 'No file provided')

  try {
    const saved = await Promise.all(files.map(saveImage))
    return ok({ images: saved, paths: saved.map((s) => s.path) })
  } catch (err) {
    if (err instanceof UploadError) return fail(422, err.message)
    throw err
  }
})
