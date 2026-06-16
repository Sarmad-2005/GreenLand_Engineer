'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { Reveal } from '@/components/reveal'
import { partners, additionalPartners } from '@/lib/about-data'

function LogoCard({
  name,
  logo,
  width,
  height,
}: {
  name: string
  logo: string
  width: number
  height: number
}) {
  return (
    <div
      title={name}
      className="mx-3 flex h-24 w-44 flex-none items-center justify-center rounded-2xl border border-deep/10 bg-card px-6 shadow-sm"
    >
      <Image
        src={logo}
        alt={name}
        width={width}
        height={height}
        className="h-14 w-auto max-w-full object-contain grayscale transition duration-300 hover:grayscale-0"
      />
    </div>
  )
}

export function PartnersMarquee() {
  const reduce = useReducedMotion()

  return (
    <section className="bg-sage">
      <div className="mx-auto max-w-7xl px-5 pt-16 md:px-8 md:pt-24">
        <Reveal className="text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-leaf">
            Stronger together
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-deep sm:text-4xl md:text-5xl">
            Research &amp; Development Partners
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            We collaborate with national and international research institutions, universities and
            development organizations to keep our machinery at the cutting edge.
          </p>
        </Reveal>
      </div>

      {/* logo marquee */}
      <div className="relative mt-12 overflow-hidden py-4">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-sage to-transparent md:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-sage to-transparent md:w-32" />

        {reduce ? (
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-5">
            {partners.map((p) => (
              <LogoCard key={p.name} {...p} />
            ))}
          </div>
        ) : (
          <motion.div
            className="flex w-max"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          >
            {[...partners, ...partners].map((p, i) => (
              <LogoCard key={`${p.name}-${i}`} {...p} />
            ))}
          </motion.div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-5 pb-16 md:px-8 md:pb-24">
        <Reveal className="mt-6 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-soil">
            In collaboration with {additionalPartners.join(' · ')} and more
          </p>
        </Reveal>
      </div>
    </section>
  )
}
