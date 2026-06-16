'use client'

import dynamic from 'next/dynamic'
import { useReducedMotion } from 'framer-motion'
import { Reveal } from '@/components/reveal'
import { FloatingImage } from '@/components/floating-image'
import { historyParagraphs, ourTeam } from '@/lib/about-data'

// Heavy R3F canvas — load on the client only, like the hero scene.
const AboutModel = dynamic(() => import('./about-model'), { ssr: false })

export function AboutStory() {
  const reduce = useReducedMotion()
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* narrative */}
          <div>
            <Reveal>
              <span className="font-mono text-xs uppercase tracking-widest text-leaf">
                Our Story
              </span>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-deep sm:text-4xl md:text-5xl">
                Five decades in the field
              </h2>
            </Reveal>
            <div className="mt-6 space-y-5">
              {historyParagraphs.map((p, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <p className="text-pretty leading-relaxed text-muted-foreground">{p}</p>
                </Reveal>
              ))}
            </div>
          </div>

          {/* floating image cluster */}
          <Reveal>
            <div className="relative mx-auto h-[22rem] w-full max-w-md sm:h-[26rem]">
              <div className="blob-1 absolute inset-6 bg-sage" />
              {/* Interactive 3D super-seeder in place of the old static tractor
                  image — turns on its own and can be dragged to view in 3D. */}
              <div className="absolute inset-0">
                <AboutModel reduce={!!reduce} />
              </div>
              <FloatingImage
                src="/products/harvesting-cutting/3-multi-purpose-reaper-machine.webp"
                alt=""
                size={120}
                className="absolute bottom-4 left-0"
                duration={6}
                delay={0.6}
              />
              <FloatingImage
                src="/products/secondary-tillage/1-laser-land-leveller-machine.webp"
                alt=""
                size={130}
                className="absolute bottom-0 right-0"
                duration={8}
                delay={0.3}
              />
              <span className="absolute left-0 top-2 rounded-full bg-deep px-4 py-2 font-mono text-xs uppercase tracking-wider text-background shadow-lg">
                Est. 1975
              </span>
            </div>
          </Reveal>
        </div>

        {/* team band */}
        <Reveal className="mt-16">
          <div className="rounded-3xl bg-deep px-7 py-10 text-background md:px-12 md:py-12">
            <span className="font-mono text-xs uppercase tracking-widest text-gold">
              Our Team
            </span>
            <p className="mt-4 max-w-3xl text-pretty text-lg leading-relaxed text-background/90">
              {ourTeam}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
