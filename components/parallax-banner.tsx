'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

export function ParallaxBanner({
  image,
  title,
}: {
  image: string
  title: string
}) {
  const reduce = useReducedMotion()

  return (
    <div className="relative h-[44vh] min-h-72 w-full overflow-hidden bg-background md:h-[56vh]">
      {/* Floating product illustration — right side */}
      <motion.div
        initial={{ opacity: 0, scale: 0.55 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-[6%] top-1/2 -translate-y-1/2 md:right-[10%]"
        style={{ width: 220, height: 220 }}
      >
        <motion.div
          animate={reduce ? {} : { y: [-14, 14] }}
          transition={
            reduce
              ? undefined
              : { duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
          }
          className="relative h-full w-full drop-shadow-[0_28px_45px_rgba(31,58,46,0.18)]"
        >
          <Image src={image || '/placeholder.svg'} alt={title} fill sizes="260px" className="object-contain" />
        </motion.div>
      </motion.div>

      {/* Left-to-right fade so text is always readable */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />

      {/* Subtle dot pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #226b3a 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Bottom divider */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-deep/10" />

      {/* Title */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-5 pb-10 md:px-8 md:pb-14">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl text-balance font-serif text-3xl font-semibold leading-tight text-deep sm:text-4xl md:text-6xl"
        >
          {title}
        </motion.h1>
      </div>
    </div>
  )
}
