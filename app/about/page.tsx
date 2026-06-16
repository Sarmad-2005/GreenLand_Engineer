import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { AboutHero } from '@/components/about/about-hero'
import { AboutStory } from '@/components/about/about-story'
import { AboutPillars } from '@/components/about/about-pillars'
import { Certifications } from '@/components/about/certifications'
import { PartnersMarquee } from '@/components/about/partners-marquee'

export const metadata: Metadata = {
  title: 'About Us — Green Land Engineers',
  description:
    'Green Land Engineers is a pioneering Pakistani manufacturer of high-quality agricultural implements since 1975. Discover our history, vision, mission, values, certifications and research & development partners.',
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="bg-background">
        <AboutHero />
        <AboutStory />
        <AboutPillars />
        <Certifications />
        <PartnersMarquee />

        {/* closing call to action */}
        <section className="bg-deep">
          <div className="mx-auto max-w-7xl px-5 py-16 text-center md:px-8 md:py-20">
            <h2 className="font-serif text-3xl font-semibold text-background sm:text-4xl">
              Let&apos;s build the future of farming together
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-background/80">
              Explore our complete range of agricultural implements or talk to our team about your
              requirements.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/products"
                className="rounded-full bg-leaf px-7 py-3.5 font-medium text-background transition hover:scale-105"
              >
                Explore Products
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-background/30 px-7 py-3.5 font-medium text-background transition hover:bg-background/10"
              >
                Get a Quote
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
