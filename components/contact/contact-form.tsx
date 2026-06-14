'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { categories } from '@/lib/site-data'

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

export function ContactForm() {
  const [sent, setSent] = useState(false)

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
            <svg
              viewBox="0 0 52 52"
              className="size-20 text-leaf"
              aria-hidden="true"
            >
              <motion.circle
                cx="26"
                cy="26"
                r="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
              <motion.path
                d="M16 27 L23 34 L37 19"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.5, ease: 'easeInOut' }}
              />
            </svg>
            <h3 className="mt-6 font-serif text-2xl font-semibold text-deep">
              Message sent!
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Thanks for reaching out. Our team will get back to you shortly.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-6 rounded-full border border-deep px-6 py-2.5 font-mono text-sm text-deep transition-colors hover:bg-deep hover:text-background"
            >
              Send another
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingField label="Name" name="name" required />
              <FloatingField label="Email" name="email" type="email" required />
              <FloatingField label="Phone" name="phone" type="tel" />
              <FloatingField label="Company / Farm Name" name="company" />
            </div>

            <div className="relative">
              <select
                name="product"
                required
                defaultValue=""
                className="w-full appearance-none rounded-2xl border border-border bg-background px-4 py-4 text-sm text-foreground focus:border-leaf focus:outline-none focus:ring-2 focus:ring-leaf/30"
              >
                <option value="" disabled>
                  Product of Interest
                </option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <textarea
                name="message"
                required
                rows={5}
                placeholder=" "
                className="peer w-full resize-none rounded-2xl border border-border bg-background px-4 pb-2 pt-6 text-sm text-foreground transition-colors focus:border-leaf focus:outline-none focus:ring-2 focus:ring-leaf/30"
              />
              <label className="pointer-events-none absolute left-4 top-4 font-mono text-xs uppercase tracking-wide text-muted-foreground transition-all peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-leaf peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px]">
                Message
              </label>
            </div>

            <button
              type="submit"
              className="mt-2 rounded-full bg-gold px-8 py-4 font-mono text-sm font-medium text-deep transition-transform hover:scale-[1.02]"
            >
              Send Message
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
