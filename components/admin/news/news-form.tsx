'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Field } from '@/components/admin/auth-shell'
import { ImageUpload } from '@/components/admin/image-upload'
import { inputCls, primaryBtn, ghostBtn } from '@/components/admin/ui/bits'
import { NEWS_TYPE_OPTIONS } from '@/lib/news-types'
import { api, ApiError, describeError } from '@/lib/client-api'
import type { NewsType } from '@prisma/client'

export interface NewsRow {
  id: string
  title: string
  slug: string
  summary: string
  type: NewsType
  author: string | null
  featuredImage: string | null
  publicationDate: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
}

function toDateInput(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10)
  return new Date(value).toISOString().slice(0, 10)
}

export function NewsForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: NewsRow
  onSaved: () => void
  onCancel: () => void
}) {
  const editing = Boolean(initial)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [type, setType] = useState<NewsType>(initial?.type ?? 'ANNOUNCEMENTS')
  const [author, setAuthor] = useState(initial?.author ?? '')
  const [publicationDate, setDate] = useState(toDateInput(initial?.publicationDate))
  const [featuredImage, setImage] = useState<string | null>(initial?.featuredImage ?? null)
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(initial?.status ?? 'ACTIVE')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    const payload = { title, summary, type, author, publicationDate, featuredImage, status }
    try {
      if (editing) await api.patch(`/api/news/${initial!.id}`, payload)
      else await api.post('/api/news', payload)
      toast.success(editing ? 'News updated' : 'News created')
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
      <Field label="Title" htmlFor="title" error={errors.title}>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      </Field>

      <Field label="Summary" htmlFor="summary" error={errors.summary}>
        <textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} className={inputCls + ' resize-y'} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Type" htmlFor="type">
          <select id="type" value={type} onChange={(e) => setType(e.target.value as NewsType)} className={inputCls}>
            {NEWS_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Author" htmlFor="author">
          <input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Date" htmlFor="date">
          <input id="date" type="date" value={publicationDate} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </Field>
      </div>

      <ImageUpload label="Featured image" value={featuredImage} onChange={setImage} />

      <Field label="Status" htmlFor="status">
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')} className={inputCls}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={ghostBtn} disabled={saving}>Cancel</button>
        <button type="submit" className={primaryBtn} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {editing ? 'Save changes' : 'Create news'}
        </button>
      </div>
    </form>
  )
}
