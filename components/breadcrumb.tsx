'use client'

import Link from 'next/link'
import { Fragment } from 'react'
import { motion } from 'framer-motion'

export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[]
}) {
  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground"
    >
      {items.map((item, i) => (
        <Fragment key={i}>
          {item.href ? (
            <Link href={item.href} className="hover:text-deep">
              {item.label}
            </Link>
          ) : (
            <span className="text-deep">{item.label}</span>
          )}
          {i < items.length - 1 && <span className="opacity-50">/</span>}
        </Fragment>
      ))}
    </motion.nav>
  )
}
