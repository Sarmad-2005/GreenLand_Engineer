'use client'

import { motion } from 'framer-motion'
import { FloatingImage } from '@/components/floating-image'
import { staggerContainer, fadeUp } from '@/lib/motion'
import { aboutHero, aboutFacts } from '@/lib/about-data'

export function AboutHero() {
  return (
    <section className="relative overflow-hidden">
      {/* low-intensity floating motif behind the copy */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06]">
        <FloatingImage
          src="/products/tractor.png"
          alt=""
          className="absolute left-[3%] top-[24%] w-48"
          duration={7}
        />
        <FloatingImage
          src="/products/seeds-bag.png"
          alt=""
          className="absolute right-[6%] top-[14%] w-40"
          duration={8}
          delay={1}
        />
        <FloatingImage
          src="/products/greenhouse.png"
          alt=""
          className="absolute bottom-[8%] left-[18%] w-44"
          duration={6}
          delay={0.5}
        />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-32 md:px-8 md:pb-24 md:pt-40"
      >
        <motion.p
          variants={fadeUp}
          className="font-mono text-xs uppercase tracking-[0.2em] text-leaf"
        >
          {aboutHero.eyebrow}
        </motion.p>

        <motion.h1
          variants={fadeUp}
          className="mt-4 max-w-4xl text-balance font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-deep sm:text-5xl md:text-7xl"
        >
          {aboutHero.title}
        </motion.h1>

        <motion.div
          variants={fadeUp}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-deep/15 bg-card/60 px-4 py-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
          <span className="font-mono text-xs uppercase tracking-wider text-soil">
            {aboutHero.tagline}
          </span>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground"
        >
          {aboutHero.intro}
        </motion.p>

        <motion.p
          variants={fadeUp}
          className="mt-4 max-w-3xl text-pretty leading-relaxed text-foreground/80"
        >
          {aboutHero.whoWeAre}
        </motion.p>

        <motion.dl
          variants={fadeUp}
          className="mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {aboutFacts.map((f) => (
            <div
              key={f.label}
              className="rounded-2xl border border-deep/10 bg-card/70 px-5 py-4"
            >
              <dt className="font-serif text-2xl font-semibold text-deep">{f.value}</dt>
              <dd className="mt-1 font-mono text-[0.7rem] uppercase tracking-wider text-soil">
                {f.label}
              </dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  )
}
