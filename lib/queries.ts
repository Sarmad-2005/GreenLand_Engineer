import { prisma } from '@/lib/db'
import { NEWS_TYPE_LABELS } from '@/lib/news-types'

// Public read-layer. Server components import these to render live DB content.

export interface PublicCategory {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string
  image: string | null
  gallery: string[]
}

export interface PublicFeaturedProduct {
  slug: string
  name: string
  description: string
  image: string
  categorySlug: string
  categoryName: string
}

export interface PublicTestimonial {
  id: string
  name: string
  role: string | null
  location: string | null
  quote: string
  photo: string | null
  rating: number
}

export async function getActiveCategories() {
  return prisma.category.findMany({
    where: { deletedAt: null, status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      description: true,
      image: true,
      gallery: true,
    },
  })
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findFirst({
    where: { slug, deletedAt: null, status: 'ACTIVE' },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      description: true,
      image: true,
      gallery: true,
    },
  })
}

export async function getCategorySlugs() {
  const cats = await prisma.category.findMany({
    where: { deletedAt: null, status: 'ACTIVE' },
    select: { slug: true },
  })
  return cats.map((c) => c.slug)
}

// Featured products across all categories (featured first, else most recent).
// Powers the home "Featured Products" slider.
export async function getFeaturedProducts(limit = 8): Promise<PublicFeaturedProduct[]> {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, status: 'ACTIVE' },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: limit,
    include: {
      images: { orderBy: { position: 'asc' } },
      category: { select: { slug: true, name: true, image: true } },
    },
  })
  return products.map((p) => ({
    slug: p.slug,
    name: p.name,
    description: p.description,
    image: productImagePaths(p.images, p.category.image)[0] ?? '/placeholder.svg',
    categorySlug: p.category.slug,
    categoryName: p.category.name,
  }))
}

// ── Products ──

function productImagePaths(images: { path: string }[], fallback: string | null): string[] {
  const paths = images.map((i) => i.path)
  return paths.length ? paths : fallback ? [fallback] : []
}

export async function getCategoryProductsBySlug(slug: string) {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, status: 'ACTIVE', category: { slug, deletedAt: null } },
    orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }],
    include: { images: { orderBy: { position: 'asc' } }, category: { select: { image: true } } },
  })
  return products.map((p) => ({
    slug: p.slug,
    name: p.name,
    description: p.description,
    image: productImagePaths(p.images, p.category.image)[0] ?? '/placeholder.svg',
    images: productImagePaths(p.images, p.category.image),
  }))
}

export async function getProductBySlug(categorySlug: string, productSlug: string) {
  const product = await prisma.product.findFirst({
    where: {
      slug: productSlug,
      deletedAt: null,
      status: 'ACTIVE',
      category: { slug: categorySlug, deletedAt: null },
    },
    include: {
      images: { orderBy: { position: 'asc' } },
      category: { select: { slug: true, name: true, image: true } },
    },
  })
  if (!product) return null

  const related = await prisma.product.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      category: { slug: categorySlug },
      slug: { not: productSlug },
    },
    take: 4,
    include: { images: { orderBy: { position: 'asc' } }, category: { select: { image: true } } },
  })

  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price ? product.price.toString() : null,
    sku: product.sku,
    stock: product.stock,
    categorySlug: product.category.slug,
    categoryName: product.category.name,
    specifications: (product.specifications as { label: string; value: string }[] | null) ?? [],
    videos: (product.videos as { title: string; url: string }[] | null) ?? [],
    images: productImagePaths(product.images, product.category.image),
    related: related.map((r) => ({
      slug: r.slug,
      name: r.name,
      image: productImagePaths(r.images, r.category.image)[0] ?? '/placeholder.svg',
    })),
  }
}

// ── News ──

export async function getPublicNews() {
  const entries = await prisma.news.findMany({
    where: { deletedAt: null, status: 'ACTIVE' },
    orderBy: { publicationDate: 'desc' },
  })
  return entries.map((n) => ({
    date: n.publicationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    type: NEWS_TYPE_LABELS[n.type],
    title: n.title,
    summary: n.summary,
    image: n.featuredImage ?? '',
  }))
}

// ── Blogs ──

export async function getPublicBlogs() {
  return prisma.blog.findMany({
    where: { deletedAt: null, status: 'ACTIVE' },
    orderBy: { publishedAt: 'desc' },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      featuredImage: true,
      tag: true,
      author: true,
      featured: true,
      publishedAt: true,
    },
  })
}

export async function getBlogBySlug(slug: string) {
  return prisma.blog.findFirst({
    where: { slug, deletedAt: null, status: 'ACTIVE' },
  })
}

export async function getRelatedBlogs(slug: string, take = 3) {
  return prisma.blog.findMany({
    where: { deletedAt: null, status: 'ACTIVE', slug: { not: slug } },
    orderBy: { publishedAt: 'desc' },
    take,
    select: { slug: true, title: true, excerpt: true, featuredImage: true, tag: true },
  })
}

// ── Testimonials ──

export async function getActiveTestimonials(): Promise<PublicTestimonial[]> {
  return prisma.testimonial.findMany({
    where: { deletedAt: null, status: 'ACTIVE' },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      role: true,
      location: true,
      quote: true,
      photo: true,
      rating: true,
    },
  })
}
