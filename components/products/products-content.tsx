'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { PublicCategory } from '@/lib/queries'

export function ProductsContent({ categories }: { categories: PublicCategory[] }) {
  const [active, setActive] = useState(categories[0]?.slug ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    categories.forEach((c) => {
      const el = document.getElementById(c.slug)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      {/* mobile pill nav */}
      <div className="sticky top-16 z-30 -mx-5 mb-8 flex gap-2 overflow-x-auto bg-background/90 px-5 py-3 backdrop-blur lg:hidden [scrollbar-width:none]">
        {categories.map((c) => (
          <a
            key={c.slug}
            href={`#${c.slug}`}
            className={`shrink-0 rounded-full px-4 py-2 font-mono text-xs transition-colors ${
              active === c.slug
                ? 'bg-deep text-background'
                : 'bg-sage text-deep'
            }`}
          >
            {c.name.split(' ')[0]}
          </a>
        ))}
      </div>

      <div className="flex gap-12">
        {/* desktop sticky nav */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <nav className="sticky top-28 space-y-1">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Categories
            </p>
            {categories.map((c) => (
              <a
                key={c.slug}
                href={`#${c.slug}`}
                className={`block rounded-lg border-l-2 px-3 py-2 text-sm transition-colors ${
                  active === c.slug
                    ? 'border-leaf bg-sage font-medium text-deep'
                    : 'border-transparent text-muted-foreground hover:text-deep'
                }`}
              >
                {c.name}
              </a>
            ))}
          </nav>
        </aside>

        {/* sections */}
        <div className="min-w-0 flex-1 space-y-24 md:space-y-32">
          {categories.map((cat, idx) => {
            const reversed = idx % 2 === 1
            return (
              <section
                key={cat.slug}
                id={cat.slug}
                className="scroll-mt-28"
              >
                <div
                  className={`flex flex-col items-stretch gap-10 lg:flex-row lg:items-center ${
                    reversed ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  <motion.div
                    initial={{ opacity: 0, x: reversed ? 40 : -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="flex-1"
                  >
                    <span className="font-mono text-xs uppercase tracking-widest text-leaf">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h2 className="mt-3 text-balance font-serif text-2xl font-semibold tracking-tight text-deep sm:text-3xl md:text-4xl">
                      {cat.name}
                    </h2>
                    <p className="mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">
                      {cat.description}
                    </p>
                    <Link
                      href={`/products/${cat.slug}`}
                      className="group mt-7 inline-flex items-center gap-2 rounded-full bg-leaf px-6 py-3 font-mono text-sm font-medium text-background transition-transform hover:scale-105"
                    >
                      View All Products
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>

                  {/* image cluster */}
                  <div className="relative flex h-64 w-full items-center justify-center overflow-hidden sm:h-72 lg:h-80 lg:flex-1">
                    {[0, 1, 2].map((n) => {
                      const positions = [
                        'left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2 sm:size-44 lg:size-52',
                        'left-2 top-2 size-20 sm:left-4 sm:top-6 sm:size-24 lg:size-28',
                        'bottom-2 right-2 size-24 sm:bottom-4 sm:right-4 sm:size-28 lg:size-32',
                      ]
                      const imgSrc = cat.gallery?.[n] ?? cat.gallery?.[0] ?? cat.image ?? '/placeholder.svg'
                      return (
                        <motion.div
                          key={n}
                          initial={{ opacity: 0, scale: 0.6 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true, margin: '-40px' }}
                          transition={{ duration: 0.5, delay: n * 0.12 }}
                          className={`absolute overflow-hidden ${positions[n]} ${
                            n === 0 ? 'blob-1 bg-sage' : 'blob-2 bg-background'
                          } shadow-lg shadow-deep/10`}
                        >
                          <motion.div
                            animate={{ y: [-8, 8] }}
                            transition={{
                              duration: 5 + n,
                              repeat: Infinity,
                              repeatType: 'mirror',
                              ease: 'easeInOut',
                            }}
                            className="relative h-full w-full"
                          >
                            <Image
                              src={imgSrc}
                              alt={cat.name}
                              fill
                              sizes="200px"
                              className="object-cover"
                            />
                          </motion.div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
