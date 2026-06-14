'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Field } from '@/components/admin/auth-shell'
import { inputCls, primaryBtn, ghostBtn } from '@/components/admin/ui/bits'
import { api, ApiError, describeError } from '@/lib/client-api'

export interface UserRow {
  id: string
  fullName: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR'
  status: 'ACTIVE' | 'INACTIVE'
  lastLogin: string | null
  createdAt: string
}

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'EDITOR', label: 'Editor' },
]

export function UserForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: UserRow
  onSaved: () => void
  onCancel: () => void
}) {
  const editing = Boolean(initial)
  const [fullName, setFullName] = useState(initial?.fullName ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(initial?.role ?? 'ADMIN')
  const [status, setStatus] = useState(initial?.status ?? 'ACTIVE')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      if (editing) {
        const payload: Record<string, unknown> = { fullName, email, role, status }
        if (password) payload.password = password
        await api.patch(`/api/admin/users/${initial!.id}`, payload)
      } else {
        await api.post('/api/admin/users', { fullName, email, password, role, status })
      }
      toast.success(editing ? 'Admin updated' : 'Admin created')
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
      <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
        <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
      </Field>

      <Field label="Email" htmlFor="email" error={errors.email}>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
      </Field>

      <Field
        label={editing ? 'New password (leave blank to keep)' : 'Password'}
        htmlFor="password"
        error={errors.password}
      >
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          placeholder={editing ? '••••••••' : 'Min 8 chars, mixed case + number'}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Role" htmlFor="role">
          <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRow['role'])} className={inputCls}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Status" htmlFor="status">
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value as UserRow['status'])} className={inputCls}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={ghostBtn} disabled={saving}>Cancel</button>
        <button type="submit" className={primaryBtn} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {editing ? 'Save changes' : 'Create admin'}
        </button>
      </div>
    </form>
  )
}
