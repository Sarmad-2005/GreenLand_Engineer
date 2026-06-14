/**
 * Normalizes product images so they're consistently framed:
 *  - trims the surrounding white margin (removes baked-in whitespace)
 *  - removes the white studio background (incl. the faint grey watermark) so the
 *    product is transparent
 *  - re-centers the product on a uniform square TRANSPARENT canvas with an even margin
 *
 * Re-reads originals from the source "Category & Machines WEBP" folders so it's
 * repeatable and never compounds. Run: npx tsx scripts/normalize-product-images.ts
 */
import sharp from 'sharp'
import { existsSync, readdirSync, mkdirSync, renameSync } from 'fs'
import path from 'path'
import { categories, getCategoryProducts } from '../lib/site-data'

const PUBLIC = path.join(process.cwd(), 'public')
const SRC_ROOT = path.join(PUBLIC, 'Category & Machines WEBP')

const LETTER_TO_SLUG: Record<string, string> = {
  A: 'primary-tillage', B: 'secondary-tillage', C: 'seeding-planting',
  D: 'harvesting-cutting', E: 'post-harvest-processing', F: 'manual-walk-behind', G: 'others',
}

const CANVAS = 1000     // final square size
const MARGIN = 0.06     // 6% even margin around the product
const TRIM_THRESHOLD = 45

// Background-removal tuning:
const WHITE = 234         // min(r,g,b) strictly above this = background white (keeps silver machines)
const ISLAND_MAX = 0.02   // remove kept islands smaller than this fraction of the image…
const ISLAND_MIN_LIGHT = 150 // …whose mean min-channel is at least this (light)…
const ISLAND_MAX_CHROMA = 24 // …and mean chroma below this (grey) — i.e. leftover watermark/specks

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
function leadingNumber(s: string) {
  const m = s.match(/^\s*(\d+)/)
  return m ? parseInt(m[1], 10) : 9999
}

/**
 * Keys out the white studio background of a product photo, returning an RGBA PNG buffer.
 * Strategy: flood-fill near-white from the edges (decided on a median-denoised copy so
 * webp speckle doesn't leave stripes), drop leftover grey "watermark" islands via
 * connected components, then erode 1px + feather to kill the white halo.
 */
async function removeBackground(buf: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const N = width * height
  const den = await sharp(buf).median(3).ensureAlpha().raw().toBuffer()
  const isBg = (p: number) => Math.min(den[p * 4], den[p * 4 + 1], den[p * 4 + 2]) > WHITE

  // 1) flood-fill background from the four edges
  const removed = new Uint8Array(N)
  const st: number[] = []
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const p = y * width + x
    if (removed[p] || !isBg(p)) return
    removed[p] = 1
    st.push(p)
  }
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1) }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y) }
  while (st.length) {
    const p = st.pop()!
    const x = p % width, y = (p / width) | 0
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1)
  }

  // 2) drop leftover background islands (grey watermark text / specks)
  const areaMax = ISLAND_MAX * N
  const label = new Int32Array(N).fill(-1)
  const q = new Int32Array(N)
  for (let start = 0; start < N; start++) {
    if (removed[start] || label[start] !== -1) continue
    let tail = 0, head = 0
    q[tail++] = start; label[start] = start
    let area = 0, sumMin = 0, sumChroma = 0
    const members: number[] = []
    while (head < tail) {
      const p = q[head++]
      members.push(p); area++
      const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2]
      sumMin += Math.min(r, g, b)
      sumChroma += Math.max(r, g, b) - Math.min(r, g, b)
      const x = p % width, y = (p / width) | 0
      const nb = [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, y > 0 ? p - width : -1, y < height - 1 ? p + width : -1]
      for (const nq of nb) {
        if (nq < 0 || removed[nq] || label[nq] !== -1) continue
        label[nq] = start; q[tail++] = nq
      }
    }
    if (area < areaMax && sumMin / area > ISLAND_MIN_LIGHT && sumChroma / area < ISLAND_MAX_CHROMA) {
      for (const p of members) removed[p] = 1
    }
  }

  // 3) erode kept region 1px (trim light fringe) + 3x3 feather, write into alpha
  const remD = new Uint8Array(N)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x
      if (removed[p]) { remD[p] = 1; continue }
      if ((x > 0 && removed[p - 1]) || (x < width - 1 && removed[p + 1]) ||
          (y > 0 && removed[p - width]) || (y < height - 1 && removed[p + width])) remD[p] = 1
    }
  }
  const a0 = new Uint8Array(N)
  for (let p = 0; p < N; p++) a0[p] = remD[p] ? 0 : 255
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let s = 0, c = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy
          if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue
          s += a0[yy * width + xx]; c++
        }
      }
      data[(y * width + x) * 4 + 3] = (s / c) | 0
    }
  }
  return sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer()
}

async function normalizeOne(srcFile: string, destFile: string) {
  // 1) trim white border → tight crop around the product
  const trimmed = await sharp(srcFile).trim({ threshold: TRIM_THRESHOLD }).toBuffer()
  // 2) key out the white studio background → transparent product
  const cut = await removeBackground(trimmed)
  // 3) scale to fit inside the inner box (canvas minus margins), preserving alpha
  const inner = Math.round(CANVAS * (1 - MARGIN * 2))
  const resized = await sharp(cut)
    .resize({ width: inner, height: inner, fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer()
  // 4) composite centered on a clean TRANSPARENT square
  const tmp = destFile + '.tmp.webp'
  await sharp({
    create: { width: CANVAS, height: CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(tmp)
  renameSync(tmp, destFile)
}

async function main() {
  if (!existsSync(SRC_ROOT)) throw new Error(`Source folder not found: ${SRC_ROOT}`)

  const folderBySlug = new Map<string, string>()
  for (const dir of readdirSync(SRC_ROOT, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue
    const slug = LETTER_TO_SLUG[dir.name.trim().charAt(0).toUpperCase()]
    if (slug) folderBySlug.set(slug, path.join(SRC_ROOT, dir.name))
  }

  let total = 0
  for (const cat of categories) {
    const folder = folderBySlug.get(cat.slug)
    if (!folder) continue
    const files = readdirSync(folder)
      .filter((f) => f.toLowerCase().endsWith('.webp'))
      .sort((a, b) => leadingNumber(a) - leadingNumber(b))
    const names = getCategoryProducts(cat.slug).map((p) => p.name)
    const destDir = path.join(PUBLIC, 'products', cat.slug)
    mkdirSync(destDir, { recursive: true })

    const count = Math.min(files.length, names.length)
    for (let i = 0; i < count; i++) {
      const dest = path.join(destDir, `${i + 1}-${slugify(names[i])}.webp`)
      await normalizeOne(path.join(folder, files[i]), dest)
      total++
    }
    console.log(`✓ ${cat.slug}: ${count} normalized`)
  }
  console.log(`✓ ${total} product images normalized to ${CANVAS}×${CANVAS}`)
}

main().catch((e) => { console.error('❌', e); process.exit(1) })
