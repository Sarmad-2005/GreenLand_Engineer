'use client'

import Image from 'next/image'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { NEWS_FILTER_LABELS } from '@/lib/news-types'

export interface NewsEntry {
  date: string
  type: string
  title: string
  summary: string
  image: string
}

const typeColors: Record<string, string> = {
  'Meeting Notes': 'bg-leaf/20 text-leaf',
  Announcements: 'bg-gold/25 text-soil',
  Events: 'bg-sage text-deep',
  Press: 'bg-soil/20 text-soil',
}

export function NewsTimeline({ newsEntries }: { newsEntries: NewsEntry[] }) {
  const [filter, setFilter] = useState('All')

  const entries = useMemo(
    () =>
      filter === 'All'
        ? newsEntries
        : newsEntries.filter((e) => e.type === filter),
    [filter, newsEntries]
  )

  return (
    <div className="mx-auto max-w-4xl px-5 md:px-8">
      {/* filter pills */}
      <div className="flex flex-wrap gap-2">
        {NEWS_FILTER_LABELS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={`rounded-full px-4 py-2 font-mono text-xs transition-colors ${
              filter === t ? 'bg-deep text-background' : 'bg-sage text-deep'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* timeline */}
      <div className="relative mt-12">
        <div className="absolute bottom-0 left-4 top-0 w-px bg-border md:left-1/2" />
        <div className="space-y-10">
          {entries.map((entry, i) => {
            const left = i % 2 === 0
            return (
              <motion.div
                key={entry.title + entry.date}
                initial={{ opacity: 0, x: left ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5 }}
                className={`relative pl-12 md:w-1/2 md:pl-0 ${
                  left ? 'md:pr-12' : 'md:ml-auto md:pl-12'
                }`}
              >
                {/* node */}
                <span
                  className={`absolute top-2 z-10 flex size-3 -translate-x-1/2 rounded-full bg-leaf ring-4 ring-background left-4 ${
                    left ? 'md:left-full' : 'md:left-0'
                  }`}
                />
                <div className="rounded-3xl bg-card p-6 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {entry.date}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wide ${
                        typeColors[entry.type] ?? 'bg-sage text-deep'
                      }`}
                    >
                      {entry.type}
                    </span>
                  </div>
                  <h3 className="mt-3 font-serif text-xl font-semibold text-deep">
                    {entry.title}
                  </h3>
                  <div className="mt-3 flex gap-4">
                    {entry.image && (
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-sage/60">
                        <Image
                          src={entry.image || '/placeholder.svg'}
                          alt={entry.title}
                          fill
                          sizes="80px"
                          className="object-contain p-2"
                        />
                      </div>
                    )}
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {entry.summary}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
