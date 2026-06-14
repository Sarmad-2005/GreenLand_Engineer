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
import { ProductForm, type ProductRow } from './product-form'
import { api, ApiError } from '@/lib/client-api'

interface ListResponse {
  data: ProductRow[]
  meta: { page: number; totalPages: number; total: number }
}
type CategoryOption = { id: string; name: string; slug: string }

export function ProductsManager() {
  const [rows, setRows] = useState<ProductRow[]>([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<CategoryOption[]>([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProductRow | undefined>(undefined)
  const [toDelete, setToDelete] = useState<ProductRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api
      .get<{ data: CategoryOption[] }>('/api/categories?pageSize=100&sort=name&order=asc')
      .then((res) => setCategories(res.data))
      .catch(() => {})
  }, [])

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
        ...(categoryFilter ? { category: categoryFilter } : {}),
      })
      const res = await api.get<ListResponse>(`/api/products?${params}`)
      setRows(res.data)
      setMeta(res.meta)
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [page, sort, order, debouncedSearch, statusFilter, categoryFilter])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, categoryFilter, sort, order])

  function toggleSort(field: string) {
    if (sort === field) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else {
      setSort(field)
      setOrder('asc')
    }
  }

  async function openEdit(id: string) {
    try {
      const full = await api.get<ProductRow>(`/api/products/${id}`)
      setEditing(full)
      setFormOpen(true)
    } catch (err) {
      toast.error((err as ApiError).message || 'Could not load product')
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/products/${toDelete.id}`)
      toast.success('Product deleted')
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
        title="Products"
        subtitle="Manage the machinery catalogue shown on the public site."
        action={
          <NewButton
            label="New Product"
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          />
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or SKU…" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputCls + ' sm:max-w-[200px]'}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
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
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('name')}>
                  <span className="inline-flex items-center gap-1">Name <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="px-4 py-3">Category</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('price')}>
                  <span className="inline-flex items-center gap-1">Price <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('stock')}>
                  <span className="inline-flex items-center gap-1">Stock <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center"><Loader2 className="mx-auto size-6 animate-spin text-leaf" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7}><EmptyState message="No products found." /></td></tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="relative size-12 overflow-hidden rounded-lg border border-border bg-white">
                        {p.images?.[0] && <Image src={p.images[0].path} alt={p.name} fill sizes="48px" className="object-cover" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-1.5 font-medium text-deep">
                        {p.featured && <Star className="size-3.5 fill-gold text-gold" />}
                        {p.name}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">{p.sku || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.price ? `$${p.price}` : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.stock}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openEdit(p.id)} aria-label="Edit" className="flex size-8 items-center justify-center rounded-lg border border-border text-deep transition-colors hover:bg-muted">
                          <Pencil className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => setToDelete(p)} aria-label="Delete" className="flex size-8 items-center justify-center rounded-lg border border-border text-red-600 transition-colors hover:bg-red-50">
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit product' : 'New product'} size="lg">
        <ProductForm initial={editing} onCancel={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); load() }} />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete product"
        message={`Delete "${toDelete?.name}"? This cannot be undone.`}
      />
    </div>
  )
}
