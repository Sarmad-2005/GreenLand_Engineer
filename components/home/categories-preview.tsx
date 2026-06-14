'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { StageSlider } from '@/components/home/stage-slider'
import type { PublicCategory } from '@/lib/queries'

export function CategoriesPreview({ categories }: { categories: PublicCategory[] }) {
  return (
    <StageSlider
      items={categories}
      getKey={(c) => c.slug}
      enterFrom="left"
      eyebrow="What We Make"
      title="Our Categories"
      headerLink={{ href: '/products', label: 'View all products' }}
      renderSlide={(cat) => (
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-14">
          {/* image — left */}
          <div className="relative aspect-square w-56 shrink-0 overflow-hidden blob-1 bg-background md:w-72">
            <Image
              src={cat.image || '/placeholder.svg'}
              alt={cat.name}
              fill
              sizes="(min-width: 768px) 288px, 224px"
              className="object-cover"
              draggable={false}
            />
          </div>
          {/* text — right */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-serif text-3xl font-semibold text-deep md:text-4xl">{cat.name}</h3>
            {cat.tagline ? (
              <p className="mt-3 font-mono text-xs uppercase tracking-widest text-leaf">{cat.tagline}</p>
            ) : null}
            <p className="mx-auto mt-5 max-w-md text-pretty leading-relaxed text-muted-foreground md:mx-0">
              {cat.description}
            </p>
            <Link
              href={`/products/${cat.slug}`}
              className="group mt-7 inline-flex items-center gap-2 font-mono text-sm font-medium text-deep hover:text-leaf"
            >
              View category
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      )}
    />
  )
}
