import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Breadcrumb } from '@/components/breadcrumb'
import { ProductDetail } from '@/components/products/product-detail'
import { getProductBySlug } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; product: string }>
}): Promise<Metadata> {
  const { category, product } = await params
  const item = await getProductBySlug(category, product)
  return {
    title: item ? `${item.name} — Green Land` : 'Product — Green Land',
    description: item?.description,
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; product: string }>
}) {
  const { category, product } = await params
  const item = await getProductBySlug(category, product)
  if (!item) notFound()

  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Products', href: '/products' },
              { label: item.categoryName, href: `/products/${item.categorySlug}` },
              { label: item.name },
            ]}
          />
        </div>
        <ProductDetail
          name={item.name}
          categorySlug={item.categorySlug}
          categoryName={item.categoryName}
          images={item.images}
          specifications={item.specifications}
          related={item.related}
        />
      </main>
      <Footer />
    </>
  )
}
