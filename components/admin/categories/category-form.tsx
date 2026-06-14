'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Field } from '@/components/admin/auth-shell'
import { ImageUpload } from '@/components/admin/image-upload'
import { inputCls, primaryBtn, ghostBtn } from '@/components/admin/ui/bits'
import { api, ApiError, describeError } from '@/lib/client-api'

export interface CategoryRow {
  id: string
  name: string
  slug: string
  tagline: string | null
  description: string
  image: string | null
  gallery: string[]
  status: 'ACTIVE' | 'INACTIVE'
  _count?: { products: number }
  createdAt: string
}

export function CategoryForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: CategoryRow
  onSaved: () => void
  onCancel: () => void
}) {
  const editing = Boolean(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [tagline, setTagline] = useState(initial?.tagline ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [image, setImage] = useState<string | null>(initial?.image ?? null)
  const [gallery, setGallery] = useState<string[]>(initial?.gallery ?? [])
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(initial?.status ?? 'ACTIVE')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    const payload = { name, tagline, description, image, gallery, status }
    try {
      if (editing) await api.patch(`/api/categories/${initial!.id}`, payload)
      else await api.post('/api/categories', payload)
      toast.success(editing ? 'Category updated' : 'Category created')
      onSaved()
    } catch (err) {
      const e = err as ApiError
      if (e.details && typeof e.details === 'object') {
        const d = e.details as Record<string, string[]>
        setErrors(Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v?.[0] ?? ''])))
      }
      toast.error(describeError(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Category name" htmlFor="name" error={errors.name}>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </Field>

      <Field label="Tagline" htmlFor="tagline" error={errors.tagline}>
        <input
          id="tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          className={inputCls}
          placeholder="Short one-liner shown on cards"
        />
      </Field>

      <Field label="Description" htmlFor="description" error={errors.description}>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={inputCls + ' resize-y'}
        />
      </Field>

      <ImageUpload label="Primary image" value={image} onChange={setImage} />

      <ImageUpload label="Gallery (optional)" multiple value={gallery} onChange={setGallery} />

      <Field label="Status" htmlFor="status">
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
          className={inputCls}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={ghostBtn} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className={primaryBtn} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {editing ? 'Save changes' : 'Create category'}
        </button>
      </div>
    </form>
  )
}
