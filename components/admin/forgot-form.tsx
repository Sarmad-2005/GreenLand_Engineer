'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Field, inputClass } from './auth-shell'
import { api, ApiError } from '@/lib/client-api'

export function ForgotForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [devLink, setDevLink] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post<{ message: string; devResetLink?: string }>(
        '/api/auth/forgot-password',
        { email },
      )
      setSent(true)
      if (res.devResetLink) setDevLink(res.devResetLink)
      toast.success('Check your inbox for the reset link.')
    } catch (err) {
      toast.error((err as ApiError).message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          If an account exists for <strong className="text-deep">{email}</strong>, a password reset
          link has been sent.
        </p>
        {devLink && (
          <div className="rounded-xl border border-dashed border-leaf/50 bg-sage/40 p-3 text-xs">
            <p className="mb-1 font-mono uppercase tracking-wide text-leaf">Dev mode link</p>
            <a href={devLink} className="break-all text-deep underline">
              {devLink}
            </a>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Email address" htmlFor="email">
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="admin@greenland.ag"
          disabled={loading}
        />
      </Field>
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-deep px-6 py-3 font-mono text-sm font-medium text-background transition-all hover:bg-deep/90 disabled:opacity-60"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
