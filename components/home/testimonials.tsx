'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Star } from 'lucide-react'
import type { PublicTestimonial } from '@/lib/queries'

const ROTATE_MS = 10_000

export function Testimonials({ testimonials }: { testimonials: PublicTestimonial[] }) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const [paused, setPaused] = useState(false)

  const count = testimonials.length

  const go = useCallback(
    (next: number) => {
      setDir(next >= index ? 1 : -1)
      setIndex(next)
    },
    [index],
  )

  // Auto-advance every 10s. The timer resets whenever the index changes (incl.
  // manual jumps), the section is hovered, or the testimonial count changes.
  useEffect(() => {
    if (count <= 1 || paused) return
    const t = setTimeout(() => {
      setDir(1)
      setIndex((i) => (i + 1) % count)
    }, ROTATE_MS)
    return () => clearTimeout(t)
  }, [index, paused, count])

  if (count === 0) return null

  const active = testimonials[index]

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 60, scale: reduce ? 1 : 0.97 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -60, scale: reduce ? 1 : 0.97 }),
  }

  return (
    <section
      className="bg-transparent"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-4xl px-5 py-16 text-center md:py-24">
        <span className="font-mono text-xs uppercase tracking-widest text-leaf">Kind words</span>
        <h2 className="mt-3 font-serif text-3xl font-semibold text-deep sm:text-4xl md:text-5xl">
          What growers say
        </h2>

        <div className="relative mt-12 min-h-[22rem] sm:min-h-[20rem]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.figure
              key={active.id}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-center"
            >
              <span className="relative size-16 overflow-hidden rounded-full bg-sage/50 ring-2 ring-leaf/20">
                {active.photo ? (
                  <Image src={active.photo} alt={active.name} fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center font-serif text-xl font-semibold text-leaf">
                    {active.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="mt-4 font-semibold text-deep">{active.name}</span>
              {active.role && <span className="text-sm text-muted-foreground">{active.role}</span>}

              <div className="mt-5 flex items-center gap-1 text-gold" aria-label={`Rated ${active.rating} out of 5`}>
                {Array.from({ length: active.rating }).map((_, i) => (
                  <Star key={i} className="size-5 fill-gold" />
                ))}
              </div>

              <blockquote className="mt-6 max-w-2xl text-balance font-serif text-xl leading-relaxed text-deep sm:text-2xl">
                &ldquo;{active.quote}&rdquo;
              </blockquote>

              {active.location && (
                <figcaption className="mt-6 font-mono text-xs uppercase tracking-wide text-muted-foreground/80">
                  {active.location}
                </figcaption>
              )}
            </motion.figure>
          </AnimatePresence>
        </div>

        {count > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show testimonial ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-8 bg-leaf' : 'w-2 bg-leaf/30 hover:bg-leaf/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
