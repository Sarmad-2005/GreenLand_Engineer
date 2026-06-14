'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export interface BlogCard {
  slug: string
  title: string
  excerpt: string
  author: string | null
  date: string
  tag: string | null
  image: string | null
  featured: boolean
}

const PAGE_SIZE = 3

export function BlogList({ blogPosts, blogTags }: { blogPosts: BlogCard[]; blogTags: string[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const featured = blogPosts.find((p) => p.featured) ?? blogPosts[0]
  const rest = useMemo(
    () => blogPosts.filter((p) => p.slug !== featured?.slug),
    [blogPosts, featured?.slug]
  )

  const filtered = useMemo(
    () => (activeTag ? rest.filter((p) => p.tag === activeTag) : rest),
    [activeTag, rest]
  )
  const shown = filtered.slice(0, visible)

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      {/* featured */}
      {featured && (
      <Link href={`/blog/${featured.slug}`} className="group block">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid items-stretch gap-0 overflow-hidden rounded-3xl bg-card shadow-sm md:grid-cols-2"
        >
          <div className="relative h-64 overflow-hidden md:h-auto">
            <Image
              src={featured.image || '/placeholder.svg'}
              alt={featured.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col justify-center p-8 md:p-10">
            <span className="w-fit rounded-full bg-gold/20 px-3 py-1 font-mono text-xs uppercase tracking-wide text-soil">
              Featured · {featured.tag}
            </span>
            <h2 className="mt-4 text-balance font-serif text-3xl font-semibold leading-tight text-deep">
              {featured.title}
            </h2>
            <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
              {featured.excerpt}
            </p>
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              {featured.author} · {featured.date}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 font-mono text-sm text-leaf">
              Read More
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </motion.div>
      </Link>
      )}

      {/* filter pills */}
      <div className="mt-12 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTag(null)
            setVisible(PAGE_SIZE)
          }}
          className={`rounded-full px-4 py-2 font-mono text-xs transition-colors ${
            activeTag === null ? 'bg-deep text-background' : 'bg-sage text-deep'
          }`}
        >
          All
        </button>
        {blogTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => {
              setActiveTag(tag)
              setVisible(PAGE_SIZE)
            }}
            className={`rounded-full px-4 py-2 font-mono text-xs transition-colors ${
              activeTag === tag ? 'bg-deep text-background' : 'bg-sage text-deep'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((post) => (
            <motion.div
              key={post.slug}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-sm transition-shadow hover:shadow-xl hover:shadow-deep/10"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={post.image || '/placeholder.svg'}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-deep">
                    {post.tag}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-serif text-xl font-semibold leading-snug text-deep">
                    {post.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <p className="mt-4 font-mono text-xs text-muted-foreground">
                    {post.date}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {visible < filtered.length && (
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-full border border-deep px-7 py-3 font-mono text-sm text-deep transition-colors hover:bg-deep hover:text-background"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}
