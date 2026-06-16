'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Field } from '@/components/admin/auth-shell'
import { ImageUpload } from '@/components/admin/image-upload'
import { inputCls, primaryBtn, ghostBtn } from '@/components/admin/ui/bits'
import { api, ApiError, describeError } from '@/lib/client-api'

type SpecRow = { label: string; value: string }
type VideoRow = { title: string; url: string }

export interface ProductRow {
  id: string
  name: string
  slug: string
  description: string
  price: string | null
  sku: string | null
  stock: number
  featured: boolean
  status: 'ACTIVE' | 'INACTIVE'
  categoryId: string
  category?: { name: string; slug: string }
  images?: { path: string }[]
  specifications?: SpecRow[]
  videos?: VideoRow[]
  createdAt: string
}

type CategoryOption = { id: string; name: string }

export function ProductForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: ProductRow
  onSaved: () => void
  onCancel: () => void
}) {
  const editing = Boolean(initial)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [price, setPrice] = useState(initial?.price ?? '')
  const [sku, setSku] = useState(initial?.sku ?? '')
  const [stock, setStock] = useState(String(initial?.stock ?? 0))
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(initial?.status ?? 'ACTIVE')
  const [images, setImages] = useState<string[]>(initial?.images?.map((i) => i.path) ?? [])
  const [specs, setSpecs] = useState<SpecRow[]>(
    initial?.specifications?.length ? initial.specifications : [],
  )
  const [videos, setVideos] = useState<VideoRow[]>(
    initial?.videos?.length ? initial.videos : [],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function updateSpec(index: number, field: keyof SpecRow, value: string) {
    setSpecs((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }
  function addSpec() {
    setSpecs((rows) => [...rows, { label: '', value: '' }])
  }
  function removeSpec(index: number) {
    setSpecs((rows) => rows.filter((_, i) => i !== index))
  }

  function updateVideo(index: number, field: keyof VideoRow, value: string) {
    setVideos((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }
  function addVideo() {
    setVideos((rows) => [...rows, { title: '', url: '' }])
  }
  function removeVideo(index: number) {
    setVideos((rows) => rows.filter((_, i) => i !== index))
  }

  useEffect(() => {
    api
      .get<{ data: CategoryOption[] }>('/api/categories?pageSize=100&sort=name&order=asc')
      .then((res) => {
        setCategories(res.data)
        if (!initial && res.data[0]) setCategoryId((c) => c || res.data[0].id)
      })
      .catch(() => toast.error('Could not load categories'))
  }, [initial])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    const payload = {
      name,
      description,
      categoryId,
      price: price === '' ? null : Number(price),
      sku,
      stock: Number(stock),
      featured,
      status,
      images,
      specifications: specs
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
        .filter((s) => s.label && s.value),
      videos: videos
        .map((v) => ({ title: v.title.trim(), url: v.url.trim() }))
        .filter((v) => v.url),
    }
    try {
      if (editing) await api.patch(`/api/products/${initial!.id}`, payload)
      else await api.post('/api/products', payload)
      toast.success(editing ? 'Product updated' : 'Product created')
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
      <Field label="Product name" htmlFor="name" error={errors.name}>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </Field>

      <Field label="Category" htmlFor="categoryId" error={errors.categoryId}>
        <select id="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
          <option value="">Select a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price (optional)" htmlFor="price" error={errors.price}>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputCls}
            placeholder="—"
          />
        </Field>
        <Field label="SKU" htmlFor="sku" error={errors.sku}>
          <input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Stock" htmlFor="stock" error={errors.stock}>
          <input
            id="stock"
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <ImageUpload label="Product images" multiple value={images} onChange={setImages} />

      {/* Specifications — dynamic label / value rows shown on the public product page */}
      <div className="rounded-2xl border border-dashed border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            Specifications
          </p>
          <button
            type="button"
            onClick={addSpec}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-mono text-xs text-deep transition-colors hover:bg-muted"
          >
            <Plus className="size-3.5" /> Add row
          </button>
        </div>

        {specs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No specifications yet. Add rows like “Working Width → 2000” or “Tractor Power (HP) → 65”.
          </p>
        ) : (
          <div className="space-y-2">
            {specs.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  aria-label={`Specification ${i + 1} label`}
                  value={row.label}
                  onChange={(e) => updateSpec(i, 'label', e.target.value)}
                  className={inputCls + ' sm:max-w-[45%]'}
                  placeholder="Label (e.g. Working Width)"
                />
                <input
                  aria-label={`Specification ${i + 1} value`}
                  value={row.value}
                  onChange={(e) => updateSpec(i, 'value', e.target.value)}
                  className={inputCls}
                  placeholder="Value (e.g. 2000)"
                />
                <button
                  type="button"
                  onClick={() => removeSpec(i)}
                  aria-label={`Remove specification ${i + 1}`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Videos — YouTube links embedded on the public product page */}
      <div className="rounded-2xl border border-dashed border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            Videos
          </p>
          <button
            type="button"
            onClick={addVideo}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-mono text-xs text-deep transition-colors hover:bg-muted"
          >
            <Plus className="size-3.5" /> Add video
          </button>
        </div>

        {videos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No videos yet. Paste a YouTube link (e.g. https://youtu.be/… or a watch URL) to embed it
            on this product’s page.
          </p>
        ) : (
          <div className="space-y-2">
            {videos.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  aria-label={`Video ${i + 1} title`}
                  value={row.title}
                  onChange={(e) => updateVideo(i, 'title', e.target.value)}
                  className={inputCls + ' sm:max-w-[35%]'}
                  placeholder="Title (optional)"
                />
                <input
                  aria-label={`Video ${i + 1} YouTube link`}
                  value={row.url}
                  onChange={(e) => updateVideo(i, 'url', e.target.value)}
                  className={inputCls}
                  placeholder="YouTube link (e.g. https://youtu.be/abc123)"
                />
                <button
                  type="button"
                  onClick={() => removeVideo(i)}
                  aria-label={`Remove video ${i + 1}`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-deep">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="size-4 rounded border-border text-leaf focus:ring-leaf/30"
          />
          Featured product
        </label>
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
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={ghostBtn} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className={primaryBtn} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {editing ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </form>
  )
}
