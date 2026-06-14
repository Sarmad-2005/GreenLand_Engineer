'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Field, inputClass } from './auth-shell'
import { api, ApiError } from '@/lib/client-api'

export function ResetForm() {
  const router = useRouter()
  const token = useSearchParams().get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    if (!token) {
      toast.error('Missing reset token. Use the link from your email.')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', { token, password, confirmPassword })
      toast.success('Password updated. Please sign in.')
      router.replace('/login')
    } catch (err) {
      const e = err as ApiError
      if (e.details && typeof e.details === 'object') {
        const d = e.details as Record<string, string[]>
        setErrors({ password: d.password?.[0], confirmPassword: d.confirmPassword?.[0] })
      }
      toast.error(e.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="New password" htmlFor="password" error={errors.password}>
        <div className="relative">
          <input
            id="password"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass + ' pr-11'}
            placeholder="At least 8 characters"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-deep"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
        <input
          id="confirmPassword"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
          placeholder="Re-enter your password"
          disabled={loading}
        />
      </Field>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-deep px-6 py-3 font-mono text-sm font-medium text-background transition-all hover:bg-deep/90 disabled:opacity-60"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
