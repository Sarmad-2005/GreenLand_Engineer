import { PrismaClient, Prisma, type NewsType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { categories, getCategoryProducts, blogPosts, newsEntries } from '../lib/site-data'
import { productImages } from '../lib/product-images'

const prisma = new PrismaClient()

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Example spec sheet attached to one demo product so the public page shows a
// fully-populated Specifications table out of the box.
const EXAMPLE_SPECS: Prisma.InputJsonValue = [
  { label: 'Model', value: 'ALQ-SS-05' },
  { label: 'Working Width', value: '2000' },
  { label: 'Tractor Power (HP)', value: '65' },
  { label: 'No. of Blade', value: '54' },
  { label: 'Type of Blade', value: 'LJF Types' },
  { label: 'Thickness of Blade (mm)', value: '7mm' },
  { label: 'Gear Box', value: 'Multispeed 13/25' },
  { label: 'Side Driver', value: 'Gear Driver 23/25/26' },
  { label: 'Seed & Fertilizer Mechanism', value: 'Aluminum Fluted Roller Type' },
  { label: 'Press Roller', value: 'Available' },
  { label: 'No. of Tynes', value: '11' },
  { label: 'Weight (Kg. Approx.)', value: '1025' },
  { label: 'Overall Length (mm)', value: '2530' },
  { label: 'Overall Width (mm)', value: '1780' },
  { label: 'Overall Height (mm)', value: '1530' },
]

const NEWS_TYPE_MAP: Record<string, NewsType> = {
  'Meeting Notes': 'MEETING_NOTES',
  Announcements: 'ANNOUNCEMENTS',
  Events: 'EVENTS',
  Press: 'PRESS',
}

/** Build rich HTML body for a blog from its excerpt (the public detail page used to hardcode this). */
function blogContent(excerpt: string): string {
  return `
<p class="text-lg">${excerpt}</p>
<p>At Green Land, we believe the best farming decisions are grounded in both tradition and science. In this article we break down the practical steps you can take this season to improve your results while protecting the land for the next generation.</p>
<h2>Start with the soil</h2>
<p>Healthy soil is the foundation of every good harvest. Before reaching for inputs, take time to understand your soil's structure, organic matter and nutrient balance. Small adjustments here pay off across the entire growing cycle.</p>
<blockquote>"The farmer who looks after the soil finds the soil looks after the crop."</blockquote>
<h2>Apply with precision</h2>
<p>Whether it's water, nutrients or crop protection, precision is what separates waste from results. Our machinery is designed to put exactly what your crop needs exactly where it needs it — reducing cost and environmental impact at the same time.</p>
<p>Have questions about applying these ideas on your farm? Our engineering team is always happy to help you choose the right equipment and approach.</p>
`.trim()
}

async function main() {
  console.log('🌱 Seeding Green Land database…')

  // ── Super Admin ──
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@greenland.ag').toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!'
  const name = process.env.SEED_ADMIN_NAME || 'Super Admin'
  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { email },
    update: { fullName: name, role: 'SUPER_ADMIN', status: 'ACTIVE' },
    create: { email, fullName: name, passwordHash, role: 'SUPER_ADMIN', status: 'ACTIVE' },
  })
  console.log(`   ✓ Super Admin: ${email}`)

  // ── Categories ──
  const categoryIdBySlug = new Map<string, string>()
  for (const cat of categories) {
    const catImgs = productImages[cat.slug] ?? []
    const image = catImgs[0] ?? cat.image
    const gallery = catImgs.length ? catImgs.slice(0, 3) : (cat.images ?? [])
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        tagline: cat.tagline,
        description: cat.description,
        image,
        gallery,
        status: 'ACTIVE',
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        tagline: cat.tagline,
        description: cat.description,
        image,
        gallery,
        status: 'ACTIVE',
      },
    })
    categoryIdBySlug.set(cat.slug, row.id)
  }
  console.log(`   ✓ ${categories.length} categories`)

  // ── Products (generated per category) ──
  let productCount = 0
  let sku = 1
  const usedSlugs = new Set<string>()
  for (const cat of categories) {
    const categoryId = categoryIdBySlug.get(cat.slug)!
    const products = getCategoryProducts(cat.slug)
    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      // globally-unique slug
      let slug = slugify(p.name)
      while (usedSlugs.has(slug)) slug = `${slugify(p.name)}-${cat.slug}`
      usedSlugs.add(slug)

      // Attach the example spec sheet to the very first product as a demo.
      const isDemoSpecProduct = cat.slug === categories[0].slug && i === 0
      const specifications = isDemoSpecProduct ? EXAMPLE_SPECS : undefined

      const product = await prisma.product.upsert({
        where: { slug },
        update: {
          name: p.name,
          description: p.description,
          categoryId,
          featured: i === 0,
          status: 'ACTIVE',
          ...(specifications !== undefined ? { specifications } : {}),
        },
        create: {
          slug,
          name: p.name,
          description: p.description,
          categoryId,
          sku: `GL-${String(sku).padStart(4, '0')}`,
          stock: 10 + ((i * 7) % 40),
          featured: i === 0,
          status: 'ACTIVE',
          ...(specifications !== undefined ? { specifications } : {}),
        },
      })
      sku++
      productCount++

      const existingImg = await prisma.productImage.count({ where: { productId: product.id } })
      if (existingImg === 0) {
        const realImg = productImages[cat.slug]?.[i]
        const imgs = realImg
          ? [realImg]
          : ((p.images && p.images.length ? p.images : [p.image]).filter(Boolean) as string[])
        await prisma.productImage.createMany({
          data: imgs.map((path, position) => ({ productId: product.id, path, position })),
        })
      }
    }
  }
  console.log(`   ✓ ${productCount} products`)

  // ── Blogs ──
  for (const post of blogPosts) {
    await prisma.blog.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: blogContent(post.excerpt),
        featuredImage: post.image,
        tag: post.tag,
        author: post.author,
        featured: post.featured,
        seoTitle: `${post.title} — Green Land Engineers`,
        seoDescription: post.excerpt,
        publishedAt: new Date(post.date),
        status: 'ACTIVE',
      },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: blogContent(post.excerpt),
        featuredImage: post.image,
        tag: post.tag,
        author: post.author,
        featured: post.featured,
        seoTitle: `${post.title} — Green Land Engineers`,
        seoDescription: post.excerpt,
        publishedAt: new Date(post.date),
        status: 'ACTIVE',
      },
    })
  }
  console.log(`   ✓ ${blogPosts.length} blog posts`)

  // ── News ──
  for (const entry of newsEntries) {
    const slug = slugify(`${entry.title}-${entry.date}`)
    await prisma.news.upsert({
      where: { slug },
      update: {
        title: entry.title,
        summary: entry.summary,
        type: NEWS_TYPE_MAP[entry.type] ?? 'ANNOUNCEMENTS',
        featuredImage: entry.image,
        publicationDate: new Date(entry.date),
        author: 'Green Land Engineers',
        status: 'ACTIVE',
      },
      create: {
        slug,
        title: entry.title,
        summary: entry.summary,
        type: NEWS_TYPE_MAP[entry.type] ?? 'ANNOUNCEMENTS',
        featuredImage: entry.image,
        publicationDate: new Date(entry.date),
        author: 'Green Land Engineers',
        status: 'ACTIVE',
      },
    })
  }
  console.log(`   ✓ ${newsEntries.length} news entries`)

  // ── Testimonials (only when none exist, so admin edits aren't overwritten) ──
  const testimonialCount = await prisma.testimonial.count()
  if (testimonialCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        {
          name: 'Amina Okoro',
          role: 'Farm Owner · Green Acres Ltd',
          location: 'Nairobi, Kenya',
          quote:
            "Green Land's machinery transformed our harvest. Yields are up and our running costs are down — the support team genuinely understands farming.",
          rating: 5,
          featured: true,
        },
        {
          name: 'Daniel Mwangi',
          role: 'Operations Manager',
          location: 'Eldoret, Kenya',
          quote:
            'Precision equipment that just works. We apply exactly what each field needs, and the after-sales service is the best we have had.',
          rating: 5,
        },
        {
          name: 'Grace Adebayo',
          role: 'Smallholder Farmer',
          location: 'Kano, Nigeria',
          quote:
            'From soil testing to the right seeds, Green Land guided us every step. Our first season with them was our most productive yet.',
          rating: 4,
        },
        {
          name: 'Joseph Kihara',
          role: 'Co-operative Lead',
          location: 'Nakuru, Kenya',
          quote:
            'Reliable, durable and built for our conditions. The whole co-operative now trusts Green Land for equipment and advice.',
          rating: 5,
        },
      ],
    })
    console.log('   ✓ 4 testimonials')
  } else {
    console.log(`   ✓ testimonials (kept ${testimonialCount} existing)`)
  }

  console.log('✅ Seed complete.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
