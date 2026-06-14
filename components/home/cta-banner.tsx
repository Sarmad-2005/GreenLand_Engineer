'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function CtaBanner() {
  return (
    <section className="bg-transparent py-20 text-deep md:py-28">
      <div className="mx-auto max-w-4xl px-5 text-center md:px-8">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-mono text-xs uppercase tracking-widest text-leaf"
        >
          Partner with us
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mx-auto mt-4 max-w-2xl text-balance font-serif text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl"
        >
          Let&apos;s grow something{' '}
          <span className="text-gold">remarkable</span> together.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-muted-foreground"
        >
          From smallholder farms to industrial operations, Green Land supplies
          the products and expertise to help you farm better. Tell us what you
          need.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <Link
            href="/contact"
            className="mt-9 inline-block rounded-full bg-gold px-8 py-4 font-mono text-sm font-medium text-deep transition-transform hover:scale-105"
          >
            Get in touch
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
