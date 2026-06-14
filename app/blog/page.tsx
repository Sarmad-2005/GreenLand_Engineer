import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Reveal } from '@/components/reveal'
import { BlogList } from '@/components/blog/blog-list'
import { getPublicBlogs } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog — Green Land',
  description:
    'Farming tips, product guides and sustainability insights from the Green Land team.',
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogPage() {
  const posts = await getPublicBlogs()
  const blogPosts = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    author: p.author,
    date: formatDate(p.publishedAt),
    tag: p.tag,
    image: p.featuredImage,
    featured: p.featured,
  }))
  const blogTags = Array.from(new Set(posts.map((p) => p.tag).filter(Boolean))) as string[]

  return (
    <>
      <Navbar />
      <main className="pb-24 pt-28 md:pt-36">
        <div className="mx-auto mb-12 max-w-7xl px-5 md:px-8">
          <Reveal>
            <span className="font-mono text-xs uppercase tracking-widest text-leaf">
              Insights
            </span>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-deep md:text-6xl">
              Green Land Blog
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Practical farming tips, product guides and ideas for farming more
              sustainably.
            </p>
          </Reveal>
        </div>
        <BlogList blogPosts={blogPosts} blogTags={blogTags} />
      </main>
      <Footer />
    </>
  )
}
