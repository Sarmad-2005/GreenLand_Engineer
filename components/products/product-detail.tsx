'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Droplets, Ruler, ShieldCheck, Gauge, Wrench, Leaf } from 'lucide-react'

const features = [
  { icon: ShieldCheck, title: 'Heavy-Duty Build', text: 'Heat-treated steel for long-life performance.' },
  { icon: Ruler, title: 'Precision Engineered', text: 'Tight tolerances for uniform field results.' },
  { icon: Wrench, title: 'Easy Maintenance', text: 'Bolt-on parts for fast field servicing.' },
  { icon: Gauge, title: 'Wide HP Range', text: 'Compatible with 35–120 HP tractors.' },
  { icon: Droplets, title: 'Soil-Friendly', text: 'Minimal compaction, optimum tilth.' },
  { icon: Leaf, title: 'Export Tested', text: 'Validated in 60+ countries worldwide.' },
]

type Related = { slug: string; name: string; image: string }
type Spec = { label: string; value: string }

export function ProductDetail({
  name,
  categorySlug,
  categoryName,
  images,
  specifications = [],
  related,
}: {
  name: string
  categorySlug: string
  categoryName: string
  images: string[]
  specifications?: Spec[]
  related: Related[]
}) {
  const flatImages = images?.length ? images : ['/placeholder.svg']
  const [active, setActive] = useState(0)
  const [openSpecs, setOpenSpecs] = useState(true)

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <div className="grid gap-12 lg:grid-cols-2">

        {/* ── Image gallery ── */}
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border bg-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4 }}
                className="relative h-full w-full"
              >
                <Image
                  src={flatImages[active] || '/placeholder.svg'}
                  alt={name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-3"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Thumbnails (only when there's more than one image) */}
          {flatImages.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {flatImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`relative size-20 overflow-hidden rounded-2xl border border-border bg-white transition-all ${
                    active === i
                      ? 'ring-2 ring-leaf ring-offset-2 ring-offset-background'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img || '/placeholder.svg'}
                    alt={`${name} image ${i + 1}`}
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ── */}
        <div>
          <h1 className="text-balance font-serif text-3xl font-semibold leading-tight text-deep md:text-4xl">
            {name}
          </h1>
          <p className="mt-3 font-mono text-sm text-leaf">{categoryName}</p>
          <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
            The {name} is precision-engineered by Green Land Engineers for reliable, high-efficiency
            field operation. Designed for tractor compatibility across a wide horsepower range, it
            delivers consistent results in diverse soil conditions.
          </p>

          <Link
            href="/contact"
            className="mt-7 inline-block rounded-full bg-gold px-8 py-4 font-mono text-sm font-medium text-deep transition-transform hover:scale-105"
          >
            Request a Quote
          </Link>

          {/* Specs accordion — only shown when the product has specifications */}
          {specifications.length > 0 && (
            <div className="mt-8 rounded-3xl border border-border">
              <button
                type="button"
                onClick={() => setOpenSpecs((v) => !v)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
                aria-expanded={openSpecs}
              >
                <span className="font-serif text-lg font-semibold text-deep">Specifications</span>
                <ChevronDown
                  className={`size-5 text-leaf transition-transform ${openSpecs ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openSpecs && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <dl className="divide-y divide-border px-6 pb-4">
                      {specifications.map((s, i) => (
                        <div key={`${s.label}-${i}`} className="flex flex-wrap justify-between gap-2 py-3">
                          <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                            {s.label}
                          </dt>
                          <dd className="text-right text-sm text-deep">{s.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <section className="mt-20">
        <h2 className="font-serif text-2xl font-semibold text-deep md:text-3xl">Features</h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="rounded-3xl bg-sage/50 p-6"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-leaf text-background">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-deep">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Related products */}
      <section className="mt-20">
        <h2 className="font-serif text-2xl font-semibold text-deep md:text-3xl">Related Products</h2>
        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          More from {categoryName}
        </p>
        <div className="mt-8 flex gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]">
          {related.map((r) => (
            <Link
              key={r.slug}
              href={`/products/${categorySlug}/${r.slug}`}
              className="group w-60 shrink-0 rounded-3xl bg-card p-5 shadow-sm transition-all hover:-translate-y-2 hover:shadow-xl hover:shadow-deep/10"
            >
              <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-border bg-white">
                <Image
                  src={r.image || '/placeholder.svg'}
                  alt={r.name}
                  fill
                  sizes="240px"
                  className="object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <h3 className="mt-4 font-serif text-base font-semibold text-deep">{r.name}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
