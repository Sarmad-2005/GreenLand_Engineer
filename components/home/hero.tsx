'use client'

import Link from 'next/link'
import React from 'react'
import dynamic from 'next/dynamic'
import { motion, useReducedMotion } from 'framer-motion'

const HeroScene = dynamic(() => import('./hero-scene'), { ssr: false })

const WORDS = ['Innovative', 'Machinery', '—', 'Progressive', 'Farmers']

// Modern animated gradient "sheen" applied per word — flows green → gold → green.
// motion-reduce keeps it static for users who prefer reduced motion.
const SHEEN =
  'inline-block bg-clip-text text-transparent [-webkit-text-fill-color:transparent] ' +
  '[background-image:linear-gradient(110deg,#1f6a39_0%,#2f8a4d_28%,#74cf89_47%,#cdb43a_50%,#74cf89_53%,#2f8a4d_72%,#1f6a39_100%)] ' +
  '[background-size:200%_auto] [background-position:0%_center] ' +
  'animate-[hero-sheen_6s_linear_infinite] motion-reduce:animate-none'

const MARQUEE =
  '· Primary Tillage · Secondary Tillage · Seeding & Planting · Harvesting & Cutting · Post-Harvest Processing · Walk-Behind Machinery · Versatile Equipment '

export function Hero() {
  const reduce = useReducedMotion()
  const d = (n: number) => (reduce ? 0 : n)

  return (
    <section className="relative flex min-h-svh flex-col items-center overflow-hidden">
      {/* Sky gradient sits behind the transparent 3D canvas */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #2f80d4 0%, #4f9ade 20%, #82bbe8 40%, #b4d8f0 56%, #d6e9f5 70%, #e3eff7 100%)',
        }}
      />

      {/* 3D field: tractor drives in, rice grows, clouds + birds overhead */}
      <div className="absolute inset-0">
        <HeroScene reduce={!!reduce} />
      </div>

      {/* Readability scrim over the upper sky where the copy lives */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-2/3"
        style={{
          background:
            'radial-gradient(ellipse 64% 74% at 50% 20%, rgba(246,250,253,0.5) 0%, rgba(246,250,253,0.2) 45%, transparent 70%)',
        }}
      />

      {/* Headline + CTAs — single flex column so nothing overlaps on small screens */}
      <div className="pointer-events-none relative z-10 flex w-full max-w-4xl flex-1 flex-col items-center px-6 pb-16 pt-36 text-center sm:pt-40 md:pt-[16vh]">
        <h1
          className="whitespace-nowrap font-serif font-bold tracking-tight text-deep [text-shadow:0_2px_18px_rgba(247,244,236,0.85)]"
          style={{ fontSize: 'clamp(0.85rem, 4vw, 4rem)', lineHeight: 1.1 }}
        >
          <motion.span
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1, delayChildren: d(0.5) } },
            }}
          >
            {WORDS.map((word, i) => (
              <React.Fragment key={i}>
                <span className="inline-block overflow-hidden py-[0.04em]">
                  <motion.span
                    className={SHEEN}
                    variants={{
                      hidden: { y: '110%', opacity: 0 },
                      visible: {
                        y: 0,
                        opacity: 1,
                        transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
                      },
                    }}
                  >
                    {word}
                  </motion.span>
                </span>
                {i < WORDS.length - 1 ? ' ' : ''}
              </React.Fragment>
            ))}
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: d(1.5) }}
          className="mx-auto mt-6 hidden max-w-md text-pretty text-base font-bold leading-relaxed text-gold [text-shadow:0_1px_10px_rgba(20,37,31,0.6)] sm:block"
        >
          Precision tillage, seeding, harvesting and post-harvest machinery — engineered for
          farmers across&nbsp;60+ countries.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: d(1.7) }}
          className="pointer-events-auto mt-7 flex flex-wrap items-center justify-center gap-3 sm:mt-8"
        >
          <Link
            href="/products"
            className="rounded-full bg-leaf px-7 py-3.5 font-mono text-sm font-medium text-background shadow-lg shadow-deep/10 transition-all duration-300 hover:scale-[1.04] hover:bg-leaf/90 active:scale-95"
          >
            Explore Products
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-deep/25 bg-background/40 px-7 py-3.5 font-mono text-sm font-medium text-deep backdrop-blur-sm transition-all duration-300 hover:border-deep/50 hover:bg-background/60"
          >
            Contact Us
          </Link>
        </motion.div>

        {/* Hint that the parked tractor is an interactive 3D model — pinned to
            the bottom of the column so it never overlaps the buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduce ? 0 : 7.4 }}
          className="pointer-events-none mt-auto flex w-full justify-center pt-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-deep/15 bg-background/70 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-deep/70 backdrop-blur-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 12a9 3 0 1 0 18 0 9 3 0 1 0-18 0" />
              <path d="M12 3v18" opacity="0.5" />
            </svg>
            Drag the tractor to view in 3D
          </span>
        </motion.div>
      </div>

      {/* Scrolling marquee */}
      <div className="absolute inset-x-0 bottom-0 z-10 overflow-hidden border-t border-deep/10 bg-background/70 backdrop-blur-sm">
        <div className="py-3">
          <motion.div
            className="flex shrink-0 whitespace-nowrap"
            animate={reduce ? {} : { x: ['0%', '-50%'] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            {[...Array(8)].map((_, i) => (
              <span key={i} className="font-mono text-[10px] uppercase tracking-[0.2em] text-deep/30">
                {MARQUEE}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
