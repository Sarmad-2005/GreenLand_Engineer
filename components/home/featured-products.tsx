'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { StageSlider } from '@/components/home/stage-slider'
import type { PublicFeaturedProduct } from '@/lib/queries'

export function FeaturedProducts({ products }: { products: PublicFeaturedProduct[] }) {
  return (
    <StageSlider
      items={products}
      getKey={(p) => `${p.categorySlug}/${p.slug}`}
      enterFrom="right"
      eyebrow="Featured"
      title="Featured Products"
      renderSlide={(p) => (
        <div className="flex flex-col items-center gap-8 md:flex-row-reverse md:items-center md:gap-14">
          {/* image — right */}
          <div className="relative aspect-[4/3] w-full max-w-sm shrink-0 bg-background md:w-80">
            <Image
              src={p.image || '/placeholder.svg'}
              alt={p.name}
              fill
              sizes="(min-width: 768px) 320px, 90vw"
              className="object-contain"
              draggable={false}
            />
          </div>
          {/* text — left */}
          <div className="flex-1 text-center md:text-left">
            <Link
              href={`/products/${p.categorySlug}`}
              className="font-mono text-xs uppercase tracking-widest text-leaf hover:underline"
            >
              {p.categoryName}
            </Link>
            <h3 className="mt-3 font-serif text-3xl font-semibold text-deep md:text-4xl">{p.name}</h3>
            <p className="mx-auto mt-5 max-w-md text-pretty leading-relaxed text-muted-foreground md:mx-0">
              {p.description}
            </p>
            <Link
              href={`/products/${p.categorySlug}/${p.slug}`}
              className="group mt-7 inline-flex items-center gap-2 font-mono text-sm font-medium text-deep hover:text-leaf"
            >
              View product
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      )}
    />
  )
}
