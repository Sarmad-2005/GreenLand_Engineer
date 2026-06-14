'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@/lib/motion'

type Product = {
  slug: string
  name: string
  description: string
  image: string
}

export function ProductGrid({
  products,
  categorySlug,
}: {
  products: Product[]
  categorySlug: string
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {products.map((p) => (
        <motion.div key={p.slug} variants={fadeUp}>
          <Link
            href={`/products/${categorySlug}/${p.slug}`}
            className="group flex h-full flex-col rounded-3xl bg-card p-5 shadow-sm transition-shadow hover:shadow-xl hover:shadow-deep/10"
          >
            <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-border bg-white">
              <motion.div
                whileHover={{ scale: 1.06 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                className="relative h-full w-full"
              >
                <Image
                  src={p.image || '/placeholder.svg'}
                  alt={p.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain"
                />
              </motion.div>
            </div>
            <h3 className="mt-5 font-serif text-xl font-semibold text-deep">
              {p.name}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {p.description}
            </p>
            <span className="mt-4 inline-flex w-fit rounded-full border border-leaf px-4 py-1.5 font-mono text-xs text-leaf transition-colors group-hover:bg-leaf group-hover:text-background">
              View Details
            </span>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
