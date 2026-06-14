'use client'

import { motion } from 'framer-motion'
import { CountUp } from '@/components/count-up'
import { staggerContainer, fadeUp } from '@/lib/motion'
import { stats } from '@/lib/site-data'

export function StatsStrip() {
  return (
    <section className="bg-transparent">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 gap-6 md:grid-cols-4"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              className="p-6 text-center md:p-8"
            >
              <div className="font-serif text-3xl font-semibold text-deep sm:text-4xl md:text-5xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </div>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
