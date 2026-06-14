'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Target, Eye, Scale, TrendingUp, Lightbulb, type LucideIcon } from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'
import { mission, type Mission } from '@/lib/site-data'

// Per-item visual config keyed by Mission.key. Class strings are written out in
// full (no interpolation) so Tailwind v4 detects and emits them.
const visuals: Record<
  Mission['key'],
  { icon: LucideIcon; text: string; dot: string; line: string }
> = {
  mission: {
    icon: Target,
    text: 'text-amber-500',
    dot: 'bg-amber-400',
    line: 'border-amber-400',
  },
  vision: {
    icon: Eye,
    text: 'text-orange-500',
    dot: 'bg-orange-500',
    line: 'border-orange-500',
  },
  values: {
    icon: Scale,
    text: 'text-pink-600',
    dot: 'bg-pink-500',
    line: 'border-pink-500',
  },
  goal: {
    icon: TrendingUp,
    text: 'text-violet-600',
    dot: 'bg-violet-500',
    line: 'border-violet-500',
  },
  strategies: {
    icon: Lightbulb,
    text: 'text-sky-600',
    dot: 'bg-sky-500',
    line: 'border-sky-500',
  },
}

function IconBadge({
  Icon,
  border,
  text,
  float,
  size = 'size-20',
}: {
  Icon: LucideIcon
  border: string
  text: string
  float: boolean
  size?: string
}) {
  return (
    <motion.div
      animate={float ? { y: [0, -6, 0] } : undefined}
      transition={float ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : undefined}
      className={`flex ${size} shrink-0 items-center justify-center rounded-full border-2 bg-transparent ${border}`}
    >
      <Icon className={`size-8 ${text}`} strokeWidth={2} />
    </motion.div>
  )
}

export function OurMission() {
  const reduce = useReducedMotion()
  const float = !reduce

  return (
    <section className="bg-transparent">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        {/* Heading */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-leaf">
            What drives us
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-deep sm:text-4xl md:text-5xl">
            Our Mission
          </h2>
        </motion.div>

        {/* ── Desktop: horizontal connected zigzag diagram ───────────────── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="relative mt-16 hidden lg:block"
        >
          {/* Flowing connector track through the centre */}
          <div className="pointer-events-none absolute inset-x-4 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-sky-500 opacity-70" />

          <div className="relative grid grid-cols-5">
            {mission.map((item, i) => {
              const v = visuals[item.key]
              const up = i % 2 === 0
              return (
                <motion.div
                  key={item.key}
                  variants={fadeUp}
                  className="relative flex min-h-[36rem] flex-col items-center"
                >
                  {/* node content, anchored to the centre track and growing outward */}
                  <div
                    className={`absolute left-1/2 flex w-[15rem] -translate-x-1/2 flex-col items-center text-center ${
                      up ? 'bottom-1/2 justify-end' : 'top-1/2 justify-start'
                    }`}
                  >
                    {up ? (
                      <>
                        <h3
                          className={`font-mono text-sm font-bold uppercase tracking-widest ${v.text}`}
                        >
                          {item.label}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {item.body}
                        </p>
                        <IconBadge Icon={v.icon} border={v.line} text={v.text} float={float} />
                        <span className={`h-7 w-0 border-l-2 border-dashed ${v.line} opacity-60`} />
                      </>
                    ) : (
                      <>
                        <span className={`h-7 w-0 border-l-2 border-dashed ${v.line} opacity-60`} />
                        <IconBadge Icon={v.icon} border={v.line} text={v.text} float={float} />
                        <h3
                          className={`mt-4 font-mono text-sm font-bold uppercase tracking-widest ${v.text}`}
                        >
                          {item.label}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {item.body}
                        </p>
                      </>
                    )}
                  </div>

                  {/* colored node dot sitting on the track */}
                  <span
                    className={`absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-white ${v.dot}`}
                  />
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Mobile / tablet: connected vertical timeline ───────────────── */}
        <motion.ol
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="relative mt-12 lg:hidden"
        >
          {/* vertical connector line running through the badge centres */}
          <div className="pointer-events-none absolute bottom-10 left-8 top-10 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-400 via-pink-500 to-sky-500 opacity-70" />

          {mission.map((item) => {
            const v = visuals[item.key]
            return (
              <motion.li
                key={item.key}
                variants={fadeUp}
                className="relative flex gap-5 pb-12 last:pb-0"
              >
                <div className="relative z-10">
                  <IconBadge
                    Icon={v.icon}
                    border={v.line}
                    text={v.text}
                    float={float}
                    size="size-16"
                  />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <h3
                    className={`font-mono text-sm font-bold uppercase tracking-widest ${v.text}`}
                  >
                    {item.label}
                  </h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </motion.li>
            )
          })}
        </motion.ol>
      </div>
    </section>
  )
}
