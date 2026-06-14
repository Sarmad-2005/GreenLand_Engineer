import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Breadcrumb } from '@/components/breadcrumb'
import { ReadingProgress } from '@/components/blog/reading-progress'
import { getBlogBySlug, getRelatedBlogs } from '@/lib/queries'

export const dynamic = 'force-dynamic'

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogBySlug(slug)
  return {
    title: post ? `${post.seoTitle || post.title} — Green Land` : 'Blog — Green Land',
    description: post?.seoDescription || post?.excerpt,
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogBySlug(slug)
  if (!post) notFound()

  const related = await getRelatedBlogs(slug, 3)

  return (
    <>
      <ReadingProgress />
      <Navbar />
      <main className="pt-24 md:pt-28">
        <article className="mx-auto max-w-3xl px-5 py-10 md:px-8">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Blog', href: '/blog' },
              { label: post.tag || post.title },
            ]}
          />

          {post.featuredImage && (
            <div className="relative mt-6 h-72 w-full overflow-hidden rounded-3xl md:h-96">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          {post.tag && (
            <span className="mt-8 inline-block rounded-full bg-gold/20 px-3 py-1 font-mono text-xs uppercase tracking-wide text-soil">
              {post.tag}
            </span>
          )}
          <h1 className="mt-4 text-balance font-serif text-4xl font-semibold leading-tight text-deep md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 font-mono text-sm text-muted-foreground">
            {post.author ? `By ${post.author} · ` : ''}
            {formatDate(post.publishedAt)}
          </p>

          <div
            className="prose prose-green mt-8 max-w-none leading-relaxed text-foreground/90 prose-headings:font-serif prose-headings:text-deep prose-blockquote:border-leaf prose-blockquote:bg-sage/50 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:font-serif prose-blockquote:not-italic"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {related.length > 0 && (
          <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
            <h2 className="font-serif text-2xl font-semibold text-deep md:text-3xl">Related Posts</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group flex flex-col overflow-hidden rounded-3xl bg-card shadow-sm transition-shadow hover:shadow-xl hover:shadow-deep/10"
                >
                  <div className="relative h-44 overflow-hidden">
                    {r.featuredImage && (
                      <Image
                        src={r.featuredImage}
                        alt={r.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-6">
                    {r.tag && (
                      <span className="font-mono text-xs uppercase tracking-wide text-leaf">{r.tag}</span>
                    )}
                    <h3 className="mt-2 font-serif text-lg font-semibold leading-snug text-deep">
                      {r.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
