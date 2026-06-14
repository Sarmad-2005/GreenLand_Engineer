'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Field } from '@/components/admin/auth-shell'
import { ImageUpload } from '@/components/admin/image-upload'
import { inputCls, primaryBtn, ghostBtn } from '@/components/admin/ui/bits'
import { api, ApiError, describeError } from '@/lib/client-api'

export interface TestimonialRow {
  id: string
  name: string
  role: string | null
  location: string | null
  quote: string
  photo: string | null
  rating: number
  featured: boolean
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
}

export function TestimonialForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: TestimonialRow
  onSaved: () => void
  onCancel: () => void
}) {
  const editing = Boolean(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [role, setRole] = useState(initial?.role ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [quote, setQuote] = useState(initial?.quote ?? '')
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null)
  const [rating, setRating] = useState<number>(initial?.rating ?? 5)
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(initial?.status ?? 'ACTIVE')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    const payload = { name, role, location, quote, photo, rating, featured, status }
    try {
      if (editing) await api.patch(`/api/testimonials/${initial!.id}`, payload)
      else await api.post('/api/testimonials', payload)
      toast.success(editing ? 'Testimonial updated' : 'Testimonial created')
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
      <ImageUpload label="Photo" value={photo} onChange={setPhoto} />

      <Field label="Name" htmlFor="name" error={errors.name}>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Role & company" htmlFor="role" error={errors.role}>
          <input id="role" value={role} onChange={(e) => setRole(e.target.value)} className={inputCls} placeholder="e.g. Farm Owner · Green Acres Ltd" />
        </Field>
        <Field label="Location" htmlFor="location" error={errors.location}>
          <input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} placeholder="e.g. Nairobi, Kenya" />
        </Field>
      </div>

      <Field label="Review" htmlFor="quote" error={errors.quote}>
        <textarea id="quote" value={quote} onChange={(e) => setQuote(e.target.value)} rows={4} className={inputCls + ' resize-y'} placeholder="What did they say about Green Land?" />
      </Field>

      <div className="flex flex-wrap items-center gap-6">
        <Field label="Rating" htmlFor="rating">
          <select id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))} className={inputCls}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>
            ))}
          </select>
        </Field>
        <Field label="Status" htmlFor="status">
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')} className={inputCls}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-deep">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="size-4 rounded border-border text-leaf focus:ring-leaf/30" />
          Featured
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={ghostBtn} disabled={saving}>Cancel</button>
        <button type="submit" className={primaryBtn} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {editing ? 'Save changes' : 'Create testimonial'}
        </button>
      </div>
    </form>
  )
}
