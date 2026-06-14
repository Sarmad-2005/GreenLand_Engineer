import Link from 'next/link'
import { Leaf } from 'lucide-react'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-deep px-5 py-12">
      {/* ambient blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 size-96 rounded-full bg-leaf/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-96 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-full bg-gold text-deep">
            <Leaf className="size-5" />
          </span>
          <span className="font-serif text-xl font-semibold text-background">
            Green Land Engineers
          </span>
        </Link>

        <div className="rounded-3xl bg-background p-8 shadow-2xl shadow-black/30 md:p-10">
          <h1 className="font-serif text-2xl font-semibold text-deep">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>

        {footer && <div className="mt-6 text-center text-sm text-background/60">{footer}</div>}
      </div>
    </main>
  )
}

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block font-mono text-xs uppercase tracking-wide text-deep">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export const inputClass =
  'w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-leaf focus:ring-2 focus:ring-leaf/30'
