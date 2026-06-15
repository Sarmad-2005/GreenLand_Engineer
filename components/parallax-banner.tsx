'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

// Positions + motion for up to 4 floating product images spread across the
// whole hero (left, center, right) as a background layer. Each drifts on its
// own duration/offset so the group moves like it's suspended in fluid rather
// than bobbing in sync.
type Slot = {
  pos: React.CSSProperties
  size: string // square width via clamp() so it scales with the viewport
  z: number
  opacity: number
  delay: number
  float: { y: number[]; x?: number[]; rotate: number[]; duration: number }
}

const SLOTS: Slot[] = [
  // large — right
  {
    pos: { right: '2%', top: '12%' },
    size: 'clamp(165px, 30vw, 360px)',
    z: 40,
    opacity: 1,
    delay: 0,
    float: { y: [-16, 16], x: [-4, 4], rotate: [-3, 3], duration: 6.2 },
  },
  // large — left
  {
    pos: { left: '2%', top: '15%' },
    size: 'clamp(140px, 26vw, 300px)',
    z: 35,
    opacity: 0.95,
    delay: 0.5,
    float: { y: [14, -14], rotate: [3, -3], duration: 7.4 },
  },
  // center — high
  {
    pos: { left: '37%', top: '5%' },
    size: 'clamp(120px, 22vw, 250px)',
    z: 30,
    opacity: 0.9,
    delay: 0.9,
    float: { y: [12, -12], x: [6, -6], rotate: [-2, 2], duration: 8.2 },
  },
  // center — low
  {
    pos: { left: '47%', bottom: '6%' },
    size: 'clamp(130px, 23vw, 265px)',
    z: 30,
    opacity: 0.92,
    delay: 0.3,
    float: { y: [-13, 13], rotate: [2, -2], duration: 6.8 },
  },
]

export function ParallaxBanner({
  images,
  title,
}: {
  images: string[]
  title: string
}) {
  const reduce = useReducedMotion()
  const imgs = (images.length ? images : ['/placeholder.svg']).slice(0, SLOTS.length)

  return (
    <div className="relative h-[46vh] min-h-80 w-full overflow-hidden bg-background md:h-[58vh]">
      {/* Floating product images spread across the full hero. z-0 keeps the
          whole group below the title's stacking layer so it reads as a
          background while the heading stays on top. */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {imgs.map((src, i) => {
          const slot = SLOTS[i]
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: slot.opacity, scale: 1 }}
              transition={{ duration: 0.9, delay: slot.delay, ease: [0.22, 1, 0.36, 1] }}
              className="absolute aspect-square"
              style={{ ...slot.pos, width: slot.size, zIndex: slot.z }}
            >
              <motion.div
                animate={reduce ? {} : { y: slot.float.y, x: slot.float.x, rotate: slot.float.rotate }}
                transition={
                  reduce
                    ? undefined
                    : {
                        duration: slot.float.duration,
                        repeat: Infinity,
                        repeatType: 'mirror',
                        ease: 'easeInOut',
                        delay: slot.delay,
                      }
                }
                className="relative h-full w-full drop-shadow-[0_24px_42px_rgba(31,58,46,0.20)]"
              >
                <Image src={src || '/placeholder.svg'} alt="" fill sizes="360px" className="object-contain" />
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Bottom-left scrim: a soft cream wash only behind the title so it stays
          readable, fading out across the rest so the images show through. */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(to top right, var(--background) 0%, rgba(247,244,236,0.6) 20%, transparent 48%)',
        }}
      />

      {/* Subtle dot pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #226b3a 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Bottom divider */}
      <div className="absolute inset-x-0 bottom-0 z-[1] h-px bg-deep/10" />

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
