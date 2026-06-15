import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Breadcrumb } from '@/components/breadcrumb'
import { ParallaxBanner } from '@/components/parallax-banner'
import { ProductGrid } from '@/components/products/product-grid'
import { Reveal } from '@/components/reveal'
import { getCategoryBySlug, getCategoryProductsBySlug } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const cat = await getCategoryBySlug(category)
  return {
    title: cat ? `${cat.name} — Green Land` : 'Products — Green Land',
    description: cat?.description,
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const cat = await getCategoryBySlug(category)
  if (!cat) notFound()

  const products = await getCategoryProductsBySlug(category)

  // A few distinct product images from this category to float in the hero
  // (fall back to the category gallery/cover so it's never empty).
  const heroImages = Array.from(
    new Set(
      [...products.flatMap((p) => p.images), ...(cat.gallery ?? []), cat.image].filter(
        Boolean,
      ) as string[],
    ),
  ).slice(0, 4)

  return (
    <>
      <Navbar />
      <main>
        <ParallaxBanner
          images={heroImages.length ? heroImages : ['/placeholder.svg']}
          title={cat.name}
        />
        <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Products', href: '/products' },
              { label: cat.name },
            ]}
          />
          <Reveal className="mt-6 max-w-2xl">
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
              {cat.description}
            </p>
          </Reveal>

          <div className="mt-12">
            <ProductGrid products={products} categorySlug={cat.slug} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
