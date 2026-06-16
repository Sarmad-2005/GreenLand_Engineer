'use client'

import { motion } from 'framer-motion'
import { Eye, Target, Hammer, Heart, Scale, Award, type LucideIcon } from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'
import { aboutVision, aboutMission, aboutValues } from '@/lib/about-data'

const valueIcons: Record<string, LucideIcon> = {
  hammer: Hammer,
  heart: Heart,
  scale: Scale,
  award: Award,
}

const pillars = [
  { icon: Eye, label: 'Vision', body: aboutVision },
  { icon: Target, label: 'Mission', body: aboutMission },
]

export function AboutPillars() {
  return (
    <section className="bg-sage/40">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        {/* vision + mission */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-6 md:grid-cols-2"
        >
          {pillars.map((p) => (
            <motion.div
              key={p.label}
              variants={fadeUp}
              className="rounded-3xl border border-deep/10 bg-card p-8 shadow-sm"
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-deep text-background">
                <p.icon className="size-6" />
              </span>
              <h3 className="mt-5 font-serif text-2xl font-semibold text-deep">{p.label}</h3>
              <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{p.body}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* values */}
        <div className="mt-16 text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-leaf">
            What we stand for
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-deep sm:text-4xl md:text-5xl">
            Our Values
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            The core values of Green Land Engineers are built on four guiding principles.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {aboutValues.map((v, i) => {
            const Icon = valueIcons[v.icon]
            return (
              <motion.div
                key={v.key}
                variants={fadeUp}
                className="group flex flex-col rounded-3xl border border-deep/10 bg-card p-7 transition-shadow hover:shadow-lg"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-leaf/15 text-leaf transition-colors group-hover:bg-leaf group-hover:text-background">
                  {Icon ? <Icon className="size-5" /> : null}
                </span>
                <span className="mt-5 font-mono text-[0.7rem] uppercase tracking-widest text-soil">
                  0{i + 1}
                </span>
                <h3 className="mt-1 font-serif text-xl font-semibold text-deep">{v.title}</h3>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {v.body}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
