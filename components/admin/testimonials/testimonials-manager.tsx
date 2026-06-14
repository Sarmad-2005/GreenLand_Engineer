'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Pencil, Trash2, Loader2, ArrowUpDown, Star } from 'lucide-react'
import {
  PageHeader,
  NewButton,
  SearchInput,
  StatusBadge,
  Pagination,
  EmptyState,
  inputCls,
  useDebounced,
} from '@/components/admin/ui/bits'
import { Modal, ConfirmDialog } from '@/components/admin/ui/modal'
import { TestimonialForm, type TestimonialRow } from './testimonial-form'
import { api, ApiError } from '@/lib/client-api'

interface ListResponse {
  data: TestimonialRow[]
  meta: { page: number; totalPages: number; total: number }
}

export function TestimonialsManager() {
  const [rows, setRows] = useState<TestimonialRow[]>([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TestimonialRow | undefined>(undefined)
  const [toDelete, setToDelete] = useState<TestimonialRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '10',
        sort,
        order,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      })
      const res = await api.get<ListResponse>(`/api/testimonials?${params}`)
      setRows(res.data)
      setMeta(res.meta)
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }, [page, sort, order, debouncedSearch, statusFilter])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, sort, order])

  function toggleSort(field: string) {
    if (sort === field) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else {
      setSort(field)
      setOrder('asc')
    }
  }

  async function openEdit(id: string) {
    try {
      const full = await api.get<TestimonialRow>(`/api/testimonials/${id}`)
      setEditing(full)
      setFormOpen(true)
    } catch (err) {
      toast.error((err as ApiError).message || 'Could not load testimonial')
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/testimonials/${toDelete.id}`)
      toast.success('Testimonial deleted')
      setToDelete(null)
      load()
    } catch (err) {
      toast.error((err as ApiError).message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testimonials"
        subtitle="Customer reviews shown above the footer on the home page."
        action={<NewButton label="New Testimonial" onClick={() => { setEditing(undefined); setFormOpen(true) }} />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search testimonials…" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls + ' sm:max-w-[160px]'}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Photo</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('name')}>
                  <span className="inline-flex items-center gap-1">Name <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="px-4 py-3">Role</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('rating')}>
                  <span className="inline-flex items-center gap-1">Rating <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center"><Loader2 className="mx-auto size-6 animate-spin text-leaf" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6}><EmptyState message="No testimonials found." /></td></tr>
              ) : (
                rows.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="relative size-12 overflow-hidden rounded-full bg-sage/40">
                        {t.photo ? (
                          <Image src={t.photo} alt={t.name} fill sizes="48px" className="object-cover" />
                        ) : (
                          <span className="flex size-full items-center justify-center font-mono text-sm font-semibold text-leaf">
                            {t.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="flex items-center gap-1.5 font-medium text-deep line-clamp-1">
                        {t.featured && <Star className="size-3.5 fill-gold text-gold" />}
                        {t.name}
                      </p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{t.quote}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.role || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-0.5 text-gold">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-gold" />
                        ))}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openEdit(t.id)} aria-label="Edit" className="flex size-8 items-center justify-center rounded-lg border border-border text-deep transition-colors hover:bg-muted">
                          <Pencil className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => setToDelete(t)} aria-label="Delete" className="flex size-8 items-center justify-center rounded-lg border border-border text-red-600 transition-colors hover:bg-red-50">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && rows.length > 0 && (
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPage={setPage} />
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit testimonial' : 'New testimonial'} size="lg">
        <TestimonialForm initial={editing} onCancel={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); load() }} />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete testimonial"
        message={`Delete the testimonial from "${toDelete?.name}"? This cannot be undone.`}
      />
    </div>
  )
}
