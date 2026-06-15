'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

// Positions + motion for up to 4 floating product images, clustered on the
// right. Each drifts on its own duration/offset so the group moves like it's
// suspended in fluid rather than bobbing in sync.
type Slot = {
  pos: React.CSSProperties
  size: string // square width via clamp() so it scales with the viewport
  z: number
  opacity: number
  delay: number
  float: { y: number[]; x?: number[]; rotate: number[]; duration: number }
}

const SLOTS: Slot[] = [
  {
    pos: { right: '7%', top: '18%' },
    size: 'clamp(120px, 25vw, 215px)',
    z: 40,
    opacity: 1,
    delay: 0,
    float: { y: [-16, 16], x: [-5, 5], rotate: [-3, 3], duration: 6 },
  },
  {
    pos: { left: '1%', top: '8%' },
    size: 'clamp(78px, 15vw, 140px)',
    z: 30,
    opacity: 0.96,
    delay: 0.5,
    float: { y: [13, -13], rotate: [3, -3], duration: 7.4 },
  },
  {
    pos: { left: '13%', bottom: '9%' },
    size: 'clamp(82px, 16vw, 150px)',
    z: 30,
    opacity: 0.96,
    delay: 0.9,
    float: { y: [14, -14], x: [6, -6], rotate: [-2, 2], duration: 8.2 },
  },
  {
    pos: { right: '2%', bottom: '17%' },
    size: 'clamp(62px, 12vw, 110px)',
    z: 20,
    opacity: 0.92,
    delay: 0.3,
    float: { y: [-11, 11], rotate: [2, -2], duration: 6.6 },
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
    <div className="relative h-[44vh] min-h-72 w-full overflow-hidden bg-background md:h-[56vh]">
      {/* Floating product cluster — right side. z-0 keeps the whole group below
          the title's stacking layer so the heading stays readable on top. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[64%] sm:w-[60%] md:w-[56%]">
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
                className="relative h-full w-full drop-shadow-[0_22px_38px_rgba(31,58,46,0.20)]"
              >
                <Image src={src || '/placeholder.svg'} alt="" fill sizes="240px" className="object-contain" />
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Left-to-right fade so the title is always readable over the cluster */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-background via-background/80 to-transparent" />

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
