'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileText, X } from 'lucide-react'
import { apiErrorMessage } from '@/lib/form-error'

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp'
const MAX_FILES = 5
const MAX_BYTES = 10 * 1024 * 1024

function FloatingField({
  label,
  type = 'text',
  name,
  required,
}: {
  label: string
  type?: string
  name: string
  required?: boolean
}) {
  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        required={required}
        placeholder=" "
        className="peer w-full rounded-2xl border border-border bg-background px-4 pb-2 pt-6 text-sm text-foreground transition-colors focus:border-leaf focus:outline-none focus:ring-2 focus:ring-leaf/30"
      />
      <label className="pointer-events-none absolute left-4 top-4 font-mono text-xs uppercase tracking-wide text-muted-foreground transition-all peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-leaf peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px]">
        {label}
      </label>
    </div>
  )
}

export function SupplierForm() {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function addFiles(list: FileList | null) {
    if (!list) return
    setError(null)
    const incoming = Array.from(list)
    const tooBig = incoming.find((f) => f.size > MAX_BYTES)
    if (tooBig) {
      setError(`"${tooBig.name}" exceeds the 10MB limit.`)
      return
    }
    setFiles((prev) => {
      const merged = [...prev]
      for (const f of incoming) {
        if (!merged.some((m) => m.name === f.name && m.size === f.size)) merged.push(f)
      }
      if (merged.length > MAX_FILES) {
        setError(`You can attach at most ${MAX_FILES} documents.`)
        return merged.slice(0, MAX_FILES)
      }
      return merged
    })
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (files.length === 0) {
      setError('Please attach at least one document proving your business is authentic.')
      return
    }
    setSending(true)
    const fd = new FormData(e.currentTarget)
    fd.delete('document') // drop the raw input; append our tracked list
    for (const f of files) fd.append('document', f)
    try {
      const res = await fetch('/api/suppliers', { method: 'POST', body: fd })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(apiErrorMessage(body))
      }
      setSent(true)
    } catch (err) {
      setError((err as Error).message || 'Could not submit your application. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function reset() {
    setSent(false)
    setFiles([])
    formRef.current?.reset()
  }

  return (
    <div className="rounded-3xl bg-card p-8 shadow-sm md:p-10">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <svg viewBox="0 0 52 52" className="size-20 text-leaf" aria-hidden="true">
              <motion.circle
                cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
              <motion.path
                d="M16 27 L23 34 L37 19" fill="none" stroke="currentColor" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.5, ease: 'easeInOut' }}
              />
            </svg>
            <h3 className="mt-6 font-serif text-2xl font-semibold text-deep">Application received!</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Thanks for your interest in supplying Green Land Engineers. Our procurement team will
              review your details and documents and get back to you.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-full border border-deep px-6 py-2.5 font-mono text-sm text-deep transition-colors hover:bg-deep hover:text-background"
            >
              Submit another
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            ref={formRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingField label="Company Name" name="companyName" required />
              <FloatingField label="Contact Person" name="contactName" required />
              <FloatingField label="Email" name="email" type="email" required />
              <FloatingField label="Phone" name="phone" type="tel" required />
              <FloatingField label="WhatsApp (optional)" name="whatsapp" type="tel" />
              <FloatingField label="Website (optional)" name="website" />
              <FloatingField label="City" name="city" />
              <FloatingField label="Country" name="country" />
            </div>

            <FloatingField label="What do you supply? (materials, parts, services…)" name="productTypes" />

            <div className="relative">
              <textarea
                name="message"
                rows={4}
                placeholder=" "
                className="peer w-full resize-none rounded-2xl border border-border bg-background px-4 pb-2 pt-6 text-sm text-foreground transition-colors focus:border-leaf focus:outline-none focus:ring-2 focus:ring-leaf/30"
              />
              <label className="pointer-events-none absolute left-4 top-4 font-mono text-xs uppercase tracking-wide text-muted-foreground transition-all peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-leaf peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px]">
                Tell us about your company (optional)
              </label>
            </div>

            {/* Document upload */}
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                Proof of authenticity <span className="text-leaf">*</span>
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center transition-colors hover:border-leaf hover:bg-leaf/5"
              >
                <UploadCloud className="size-7 text-leaf" />
                <span className="text-sm font-medium text-deep">Click to upload documents</span>
                <span className="text-xs text-muted-foreground">
                  Business licence, registration, certifications… PDF or image, up to {MAX_FILES} files (10MB each)
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                name="document"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files)
                  e.target.value = ''
                }}
              />

              {files.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    >
                      <FileText className="size-4 shrink-0 text-leaf" />
                      <span className="line-clamp-1 flex-1 text-foreground">{f.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        aria-label={`Remove ${f.name}`}
                        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">{error}</p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="mt-2 rounded-full bg-gold px-8 py-4 font-mono text-sm font-medium text-deep transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? 'Submitting…' : 'Submit Application'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
