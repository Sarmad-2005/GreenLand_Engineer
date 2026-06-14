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
import { CategoryForm, type CategoryRow } from './category-form'
import { api, ApiError } from '@/lib/client-api'

interface ListResponse {
  data: CategoryRow[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

export function CategoriesManager() {
  const [rows, setRows] = useState<CategoryRow[]>([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | undefined>(undefined)
  const [toDelete, setToDelete] = useState<CategoryRow | null>(null)
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
      const res = await api.get<ListResponse>(`/api/categories?${params}`)
      setRows(res.data)
      setMeta({ page: res.meta.page, totalPages: res.meta.totalPages, total: res.meta.total })
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [page, sort, order, debouncedSearch, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  // reset to page 1 when filters change
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

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/categories/${toDelete.id}`)
      toast.success('Category deleted')
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
        title="Categories"
        subtitle="Manage the product categories shown across the public site."
        action={
          <NewButton
            label="New Category"
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          />
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search categories…" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={inputCls + ' sm:max-w-[180px]'}
        >
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
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('name')}>
                  <span className="inline-flex items-center gap-1">Name <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Products</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('status')}>
                  <span className="inline-flex items-center gap-1">Status <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('createdAt')}>
                  <span className="inline-flex items-center gap-1">Created <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-leaf" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState message="No categories found. Create your first one." />
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="relative size-12 overflow-hidden rounded-lg border border-border bg-white">
                        {c.image && <Image src={c.image} alt={c.name} fill sizes="48px" className="object-cover" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-deep">{c.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">/{c.slug}</p>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="line-clamp-2 text-muted-foreground">{c.description}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c._count?.products ?? 0}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(c)
                            setFormOpen(true)
                          }}
                          aria-label="Edit"
                          className="flex size-8 items-center justify-center rounded-lg border border-border text-deep transition-colors hover:bg-muted"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setToDelete(c)}
                          aria-label="Delete"
                          className="flex size-8 items-center justify-center rounded-lg border border-border text-red-600 transition-colors hover:bg-red-50"
                        >
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

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit category' : 'New category'}
        size="lg"
      >
        <CategoryForm
          initial={editing}
          onCancel={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false)
            load()
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete category"
        message={
          toDelete?._count?.products
            ? `Deleting "${toDelete.name}" will also remove its ${toDelete._count.products} product(s). Continue?`
            : `Are you sure you want to delete "${toDelete?.name}"? This cannot be undone.`
        }
      />
    </div>
  )
}
