'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@/lib/motion'
import { certifications } from '@/lib/about-data'

export function Certifications() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-leaf">
            Quality you can trust
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-deep sm:text-4xl md:text-5xl">
            Certified &amp; Compliant
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Our manufacturing meets international quality and environmental standards, recognized
            by leading certification bodies.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-12 grid gap-6 sm:grid-cols-3"
        >
          {certifications.map((c) => (
            <motion.div
              key={c.name}
              variants={fadeUp}
              className="flex flex-col items-center rounded-3xl border border-deep/10 bg-card p-8 text-center shadow-sm"
            >
              <div className="flex h-28 items-center justify-center">
                <Image
                  src={c.logo}
                  alt={c.name}
                  width={c.width}
                  height={c.height}
                  className="h-24 w-auto object-contain"
                />
              </div>
              <h3 className="mt-5 font-serif text-lg font-semibold text-deep">{c.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.caption}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
