import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Reveal } from '@/components/reveal'
import { NewsTimeline } from '@/components/news/news-timeline'
import { getPublicNews } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'News & Updates — Green Land',
  description:
    'Meeting notes, announcements, events and press from across Green Land.',
}

export default async function NewsPage() {
  const newsEntries = await getPublicNews()
  return (
    <>
      <Navbar />
      <main className="pb-24 pt-28 md:pt-36">
        <div className="mx-auto mb-12 max-w-4xl px-5 md:px-8">
          <Reveal>
            <span className="font-mono text-xs uppercase tracking-widest text-leaf">
              From the team
            </span>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-deep md:text-6xl">
              News &amp; Updates
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Daily meeting summaries, factory announcements and the latest from
              Green Land, all in one place.
            </p>
          </Reveal>
        </div>
        <NewsTimeline newsEntries={newsEntries} />
      </main>
      <Footer />
    </>
  )
}
