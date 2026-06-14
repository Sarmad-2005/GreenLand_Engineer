'use client'

import { useRef, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion } from 'framer-motion'

// Heavy R3F canvas — load on the client only, like the hero scene.
const FloatingModel = dynamic(() => import('./floating-model'), { ssr: false })

export function BelowHeroStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  // 0 when this block's top hits the viewport top, 1 when its bottom does.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  // Fade the tractor in as the block enters, so it appears smoothly (no pop-in).
  const opacity = useTransform(scrollYProgress, [0, 0.05], [0, 1])
  // Only capture pointer events while the block is in view (so it never blocks the hero).
  const [active, setActive] = useState(false)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setActive(v > 0.02 && v < 0.999))

  return (
    <div ref={ref} className="relative">
      {/* Background tractor — a fixed, viewport-pinned canvas behind the (transparent)
          content. Its 3D position is driven by scroll progress (floats down, zig-zags,
          then parks above the footer). The content layer lets empty/transparent areas
          fall through so the tractor can be grabbed; real UI stays interactive. */}
      <motion.div
        // When inactive the `none` must also reach the inner <canvas>: r3f gives the
        // canvas its own `pointer-events:auto`, which defeats `none` set only on this
        // wrapper — so the full-screen, invisible canvas would otherwise sit over the
        // hero and swallow every pointer event, killing the hero tractor's 360° drag.
        className={`fixed inset-0 z-0 ${active ? '' : 'pointer-events-none [&_*]:!pointer-events-none'}`}
        // Only show while this block is actually in view — otherwise (notably with
        // reduced motion, where the scroll-driven fade is off) the fixed canvas
        // would paint this tractor over the hero and its own 360° viewer.
        style={{ opacity: reduce ? (active ? 1 : 0) : opacity }}
        aria-hidden
      >
        <FloatingModel progress={scrollYProgress} reduce={!!reduce} />
      </motion.div>

      {/* `below-hero-content` (globals.css) makes empty/transparent areas click-through
          to the tractor while real UI (links, buttons, slider, footer) stays interactive. */}
      <div className="below-hero-content relative z-10">{children}</div>
    </div>
  )
}
