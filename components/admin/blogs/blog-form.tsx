'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Field } from '@/components/admin/auth-shell'
import { ImageUpload } from '@/components/admin/image-upload'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { inputCls, primaryBtn, ghostBtn } from '@/components/admin/ui/bits'
import { api, ApiError, describeError } from '@/lib/client-api'

export interface BlogRow {
  id: string
  title: string
  slug: string
  excerpt: string
  content?: string
  featuredImage: string | null
  tag: string | null
  author: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  featured: boolean
  status: 'ACTIVE' | 'INACTIVE'
  publishedAt: string
  createdAt: string
}

export function BlogForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: BlogRow
  onSaved: () => void
  onCancel: () => void
}) {
  const editing = Boolean(initial)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [featuredImage, setImage] = useState<string | null>(initial?.featuredImage ?? null)
  const [tag, setTag] = useState(initial?.tag ?? '')
  const [author, setAuthor] = useState(initial?.author ?? '')
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? '')
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(initial?.status ?? 'ACTIVE')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    const payload = {
      title, excerpt, content, featuredImage, tag, author,
      seoTitle, seoDescription, featured, status,
    }
    try {
      if (editing) await api.patch(`/api/blogs/${initial!.id}`, payload)
      else await api.post('/api/blogs', payload)
      toast.success(editing ? 'Blog updated' : 'Blog created')
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

      <Field label="Excerpt" htmlFor="excerpt" error={errors.excerpt}>
        <textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={inputCls + ' resize-y'} />
      </Field>

      <div>
        <span className="mb-1.5 block font-mono text-xs uppercase tracking-wide text-deep">Content</span>
        <RichTextEditor value={content} onChange={setContent} />
        {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content}</p>}
      </div>

      <ImageUpload label="Featured image" value={featuredImage} onChange={setImage} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tag / Category" htmlFor="tag">
          <input id="tag" value={tag} onChange={(e) => setTag(e.target.value)} className={inputCls} placeholder="e.g. Technology" />
        </Field>
        <Field label="Author" htmlFor="author">
          <input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} className={inputCls} />
        </Field>
      </div>

      <div className="rounded-2xl border border-dashed border-border p-4">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">SEO</p>
        <div className="space-y-4">
          <Field label="SEO title" htmlFor="seoTitle">
            <input id="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputCls} />
          </Field>
          <Field label="SEO description" htmlFor="seoDescription">
            <textarea id="seoDescription" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} className={inputCls + ' resize-y'} />
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-deep">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="size-4 rounded border-border text-leaf focus:ring-leaf/30" />
          Featured post
        </label>
        <Field label="Status" htmlFor="status">
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')} className={inputCls}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={ghostBtn} disabled={saving}>Cancel</button>
        <button type="submit" className={primaryBtn} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {editing ? 'Save changes' : 'Create blog'}
        </button>
      </div>
    </form>
  )
}
