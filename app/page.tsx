import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Hero } from '@/components/home/hero'
import { StatsStrip } from '@/components/home/stats-strip'
import { CategoriesPreview } from '@/components/home/categories-preview'
import { FeaturedProducts } from '@/components/home/featured-products'
import { OurMission } from '@/components/home/our-mission'
import { CtaBanner } from '@/components/home/cta-banner'
import { Testimonials } from '@/components/home/testimonials'
import { getActiveCategories, getFeaturedProducts, getActiveTestimonials } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [categories, featuredProducts, testimonials] = await Promise.all([
    getActiveCategories(),
    getFeaturedProducts(),
    getActiveTestimonials(),
  ])

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsStrip />
        <CategoriesPreview categories={categories} />
        <FeaturedProducts products={featuredProducts} />
        <OurMission />
        <CtaBanner />
        <Testimonials testimonials={testimonials} />
        <Footer />
      </main>
    </>
  )
}
