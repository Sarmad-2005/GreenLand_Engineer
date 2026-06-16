'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { navLinks } from '@/lib/site-data'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? 'bg-deep text-background shadow-lg shadow-deep/10'
          : 'bg-transparent text-deep'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 md:gap-2.5" aria-label="Green Land Engineers — home">
          {/* Logo mark (favicon) — always visible */}
          <Image
            src="/logo-mark.png"
            alt=""
            width={40}
            height={40}
            priority
            className={`h-8 w-auto animate-[spin-y_5s_linear_infinite] [transform-style:preserve-3d] md:h-10 ${
              scrolled ? 'drop-shadow-[0_1px_2px_rgba(247,244,236,0.45)]' : ''
            }`}
          />
          {/* Wordmark — desktop only */}
          <Image
            src="/navbarlogo1.webp"
            alt=""
            width={221}
            height={40}
            priority
            className={`hidden h-8 w-auto md:block md:h-10 ${
              scrolled ? 'drop-shadow-[0_1px_2px_rgba(247,244,236,0.45)]' : ''
            }`}
          />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-sm tracking-wide transition-opacity hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/become-supplier"
            className="font-mono text-sm tracking-wide transition-opacity hover:opacity-70"
          >
            Become a Supplier
          </Link>
          <Link
            href="/login"
            className="font-mono text-sm tracking-wide transition-opacity hover:opacity-70"
          >
            Login
          </Link>
          <Link
            href="/contact"
            className="rounded-full bg-gold px-5 py-2 font-mono text-sm font-medium text-deep transition-transform hover:scale-105"
          >
            Get a Quote
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-deep text-background md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 pb-6 pt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 font-mono text-sm hover:bg-leaf/30"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/become-supplier"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 font-mono text-sm hover:bg-leaf/30"
              >
                Become a Supplier
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 font-mono text-sm hover:bg-leaf/30"
              >
                Login
              </Link>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-full bg-gold px-5 py-3 text-center font-mono text-sm font-medium text-deep"
              >
                Get a Quote
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
