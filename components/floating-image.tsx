'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

export function FloatingImage({
  src,
  alt,
  size = 160,
  duration = 6,
  delay = 0,
  className,
}: {
  src: string
  alt: string
  size?: number
  duration?: number
  delay?: number
  className?: string
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay }}
    >
      <motion.div
        animate={reduce ? undefined : { y: [-12, 12] }}
        transition={
          reduce
            ? undefined
            : {
                duration,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
                delay,
              }
        }
        className="relative h-full w-full drop-shadow-[0_18px_30px_rgba(31,58,46,0.18)]"
      >
        <Image
          src={src || '/placeholder.svg'}
          alt={alt}
          fill
          sizes="200px"
          className="object-contain"
        />
      </motion.div>
    </motion.div>
  )
}
