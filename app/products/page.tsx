import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Reveal } from '@/components/reveal'
import { ProductsContent } from '@/components/products/products-content'
import { getActiveCategories } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Products — Green Land',
  description:
    'Explore Green Land\'s seven product categories: seeds, fertilizers, crop protection, irrigation, machinery, greenhouses and post-harvest solutions.',
}

export default async function ProductsPage() {
  const categories = await getActiveCategories()
  return (
    <>
      <Navbar />
      <main className="pb-24 pt-28 md:pt-36">
        <div className="mx-auto mb-16 max-w-7xl px-5 md:px-8">
          <Reveal>
            <span className="font-mono text-xs uppercase tracking-widest text-leaf">
              Our Catalogue
            </span>
            <h1 className="mt-3 max-w-2xl text-balance font-serif text-4xl font-semibold tracking-tight text-deep md:text-6xl">
              Our Product Categories
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Seven families of agricultural products, each engineered and
              manufactured to help your farm grow more sustainably from soil to
              shelf.
            </p>
          </Reveal>
        </div>
        <ProductsContent categories={categories} />
      </main>
      <Footer />
    </>
  )
}
