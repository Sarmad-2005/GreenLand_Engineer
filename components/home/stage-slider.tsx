'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Reveal } from '@/components/reveal'

const EASE = [0.22, 1, 0.36, 1] as const

type StageSliderProps<T> = {
  items: T[]
  getKey: (item: T) => string
  renderSlide: (item: T, index: number) => ReactNode
  /** appear-on-scroll direction — drives the zig-zag between sections */
  enterFrom: 'left' | 'right'
  eyebrow: string
  title: string
  headerLink?: { href: string; label: string }
}

export function StageSlider<T>({
  items,
  getKey,
  renderSlide,
  enterFrom,
  eyebrow,
  title,
  headerLink,
}: StageSliderProps<T>) {
  const reduce = useReducedMotion()
  // [activeIndex, lastDirection] — direction drives which way slides morph.
  const [[index, direction], setPage] = useState<[number, number]>([0, 0])

  if (items.length === 0) return null

  const count = items.length

  const paginate = (dir: number) => setPage(([prev]) => [(prev + dir + count) % count, dir])
  const goTo = (i: number) => {
    if (i !== index) setPage([i, i > index ? 1 : -1])
  }

  const variants: Variants = {
    enter: (dir: number) =>
      reduce ? { opacity: 0 } : { opacity: 0, x: dir > 0 ? 64 : -64, scale: 0.94, filter: 'blur(6px)' },
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: { duration: reduce ? 0.3 : 0.55, ease: EASE },
    },
    exit: (dir: number) =>
      reduce
        ? { opacity: 0, transition: { duration: 0.2 } }
        : {
            opacity: 0,
            x: dir > 0 ? -64 : 64,
            scale: 0.94,
            filter: 'blur(6px)',
            transition: { duration: 0.4, ease: EASE },
          },
  }

  return (
    <section className="bg-transparent py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-leaf">{eyebrow}</span>
            <h2 className="mt-3 max-w-xl text-balance font-serif text-3xl font-semibold tracking-tight text-deep sm:text-4xl md:text-5xl">
              {title}
            </h2>
          </div>
          {headerLink ? (
            <Link
              href={headerLink.href}
              className="group inline-flex items-center gap-2 font-mono text-sm text-deep"
            >
              {headerLink.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : null}
        </Reveal>

        {/* Stage morphs into view from the section's side (zig-zag), then holds its place */}
        <motion.div
          initial={
            reduce
              ? { opacity: 0 }
              : { opacity: 0, x: enterFrom === 'left' ? -64 : 64, scale: 0.96 }
          }
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative mt-12"
        >
          {/* One item floats here at a time; min-h keeps the frame steady between slides */}
          <div className="relative min-h-[560px] sm:min-h-[420px] md:min-h-[360px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={getKey(items[index])}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {renderSlide(items[index], index)}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Manual controls (borderless) */}
          {count > 1 ? (
            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {items.map((item, i) => (
                  <button
                    key={getKey(item)}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === index}
                    className={`h-2 rounded-full transition-all ${
                      i === index ? 'w-6 bg-leaf' : 'w-2 bg-deep/20 hover:bg-deep/40'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => paginate(-1)}
                    aria-label="Previous"
                    className="grid size-9 place-items-center rounded-full text-deep/50 transition-colors hover:bg-sage/60 hover:text-deep"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => paginate(1)}
                    aria-label="Next"
                    className="grid size-9 place-items-center rounded-full text-deep/50 transition-colors hover:bg-sage/60 hover:text-deep"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </section>
  )
}
