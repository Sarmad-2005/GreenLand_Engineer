'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Pencil, Trash2, Loader2, ArrowUpDown } from 'lucide-react'
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
import { NewsForm, type NewsRow } from './news-form'
import { NEWS_TYPE_OPTIONS, NEWS_TYPE_LABELS } from '@/lib/news-types'
import { api, ApiError } from '@/lib/client-api'

interface ListResponse {
  data: NewsRow[]
  meta: { page: number; totalPages: number; total: number }
}

export function NewsManager() {
  const [rows, setRows] = useState<NewsRow[]>([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('publicationDate')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<NewsRow | undefined>(undefined)
  const [toDelete, setToDelete] = useState<NewsRow | null>(null)
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
        ...(typeFilter ? { type: typeFilter } : {}),
      })
      const res = await api.get<ListResponse>(`/api/news?${params}`)
      setRows(res.data)
      setMeta(res.meta)
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to load news')
    } finally {
      setLoading(false)
    }
  }, [page, sort, order, debouncedSearch, statusFilter, typeFilter])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, typeFilter, sort, order])

  function toggleSort(field: string) {
    if (sort === field) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else {
      setSort(field)
      setOrder('asc')
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/news/${toDelete.id}`)
      toast.success('News deleted')
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
        title="News"
        subtitle="Updates shown on the public news timeline."
        action={<NewButton label="New Entry" onClick={() => { setEditing(undefined); setFormOpen(true) }} />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search news…" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={inputCls + ' sm:max-w-[180px]'}>
          <option value="">All types</option>
          {NEWS_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
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
                <th className="px-4 py-3">Image</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('title')}>
                  <span className="inline-flex items-center gap-1">Title <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="px-4 py-3">Type</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('publicationDate')}>
                  <span className="inline-flex items-center gap-1">Date <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center"><Loader2 className="mx-auto size-6 animate-spin text-leaf" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6}><EmptyState message="No news entries found." /></td></tr>
              ) : (
                rows.map((n) => (
                  <tr key={n.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="relative size-12 overflow-hidden rounded-lg bg-sage/40">
                        {n.featuredImage && <Image src={n.featuredImage} alt={n.title} fill sizes="48px" className="object-contain p-1" />}
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="font-medium text-deep line-clamp-1">{n.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{n.summary}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-sage px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-deep">
                        {NEWS_TYPE_LABELS[n.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {new Date(n.publicationDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={n.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setEditing(n); setFormOpen(true) }} aria-label="Edit" className="flex size-8 items-center justify-center rounded-lg border border-border text-deep transition-colors hover:bg-muted">
                          <Pencil className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => setToDelete(n)} aria-label="Delete" className="flex size-8 items-center justify-center rounded-lg border border-border text-red-600 transition-colors hover:bg-red-50">
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit news' : 'New news entry'} size="lg">
        <NewsForm initial={editing} onCancel={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); load() }} />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete news entry"
        message={`Delete "${toDelete?.title}"? This cannot be undone.`}
      />
    </div>
  )
}
