import nodemailer, { type Transporter } from 'nodemailer'
import { prisma } from '@/lib/db'

/* ------------------------------------------------------------------ *
 * Transport — Gmail SMTP via an App Password.
 * Set GMAIL_USER + GMAIL_APP_PASSWORD in the environment. When they're
 * missing (e.g. local dev), every send becomes a logged no-op so the
 * app keeps working instead of throwing.
 * ------------------------------------------------------------------ */
const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
const FROM_NAME = 'Green Land Engineers'

// Base URL for links inside emails. Prefer an explicit APP_URL (custom domain);
// otherwise use Vercel's auto-injected production domain (no protocol, e.g.
// "greenland-engineer.vercel.app"); finally fall back to localhost in dev.
function resolveBaseUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return 'http://localhost:3000'
}
const APP_URL = resolveBaseUrl()

let transporter: Transporter | null = null
function getTransporter(): Transporter | null {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      // Fail fast instead of hanging the HTTP response if SMTP is slow/blocked
      // (e.g. wrong app password, or egress throttled on serverless).
      connectionTimeout: 8000,
      greetingTimeout: 7000,
      socketTimeout: 9000,
    })
  }
  return transporter
}

export function emailConfigured(): boolean {
  return Boolean(GMAIL_USER && GMAIL_APP_PASSWORD)
}

interface SendArgs {
  to: string
  subject: string
  html: string
  replyTo?: string
}

/** Best-effort send. Returns true if dispatched, false if not configured/failed. */
export async function sendMail({ to, subject, html, replyTo }: SendArgs): Promise<boolean> {
  const tx = getTransporter()
  if (!tx) {
    console.warn(`[email] GMAIL_USER/GMAIL_APP_PASSWORD not set — skipping email "${subject}" → ${to}`)
    return false
  }
  try {
    // Hard cap the send so a misconfigured/blocked SMTP can never hang the request.
    await Promise.race([
      tx.sendMail({ from: `"${FROM_NAME}" <${GMAIL_USER}>`, to, subject, html, replyTo }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('email send timed out')), 9000),
      ),
    ])
    return true
  } catch (err) {
    console.error('[email] send failed:', err)
    return false
  }
}

/* ------------------------------------------------------------------ *
 * Templates — small, inline-styled HTML so they render in every client.
 * ------------------------------------------------------------------ */
const DEEP = '#226b3a'
const GOLD = '#f1df1d'
const INK = '#20251f'
const MUTED = '#5b6157'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function shell(inner: string): string {
  return `<div style="margin:0;padding:24px;background:#f7f4ec;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK}">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e2d4">
      <div style="background:${DEEP};padding:18px 24px">
        <span style="color:${GOLD};font-weight:700;font-size:18px;letter-spacing:0.3px">Green Land Engineers</span>
      </div>
      <div style="padding:24px">${inner}</div>
    </div>
  </div>`
}

export interface ContactEmailData {
  name: string
  email: string
  phone?: string | null
  company?: string | null
  product?: string | null
  message: string
}

export function contactEmailHtml(d: ContactEmailData): string {
  const row = (label: string, value?: string | null) =>
    value
      ? `<tr>
          <td style="padding:6px 12px 6px 0;color:${MUTED};font-size:13px;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="padding:6px 0;font-size:14px;color:${INK}">${escapeHtml(value)}</td>
        </tr>`
      : ''
  return shell(`
    <h2 style="margin:0 0 4px;font-size:18px;color:${DEEP}">New contact enquiry</h2>
    <p style="margin:0 0 16px;color:${MUTED};font-size:13px">Submitted via the website contact form.</p>
    <table style="width:100%;border-collapse:collapse">
      ${row('Name', d.name)}
      ${row('Email', d.email)}
      ${row('Phone', d.phone)}
      ${row('Company / Farm', d.company)}
      ${row('Product of interest', d.product)}
    </table>
    <div style="margin:16px 0 0;padding:14px 16px;background:#f7f4ec;border-radius:10px;border:1px solid #e7e2d4">
      <div style="color:${MUTED};font-size:12px;margin-bottom:6px">Message</div>
      <div style="font-size:14px;line-height:1.55;white-space:pre-wrap">${escapeHtml(d.message)}</div>
    </div>
    <p style="margin:18px 0 0;color:${MUTED};font-size:12px">Reply directly to this email to reach ${escapeHtml(d.name)}.</p>
  `)
}

export interface SupplierEmailData {
  companyName: string
  contactName: string
  email: string
  phone: string
  whatsapp?: string | null
  country?: string | null
  city?: string | null
  website?: string | null
  productTypes?: string | null
  message?: string | null
  documentCount: number
}

export function supplierEmailHtml(d: SupplierEmailData): string {
  const row = (label: string, value?: string | null) =>
    value
      ? `<tr>
          <td style="padding:6px 12px 6px 0;color:${MUTED};font-size:13px;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="padding:6px 0;font-size:14px;color:${INK}">${escapeHtml(value)}</td>
        </tr>`
      : ''
  const location = [d.city, d.country].filter(Boolean).join(', ')
  return shell(`
    <h2 style="margin:0 0 4px;font-size:18px;color:${DEEP}">New supplier application</h2>
    <p style="margin:0 0 16px;color:${MUTED};font-size:13px">Submitted via the “Become a Supplier” form.</p>
    <table style="width:100%;border-collapse:collapse">
      ${row('Company', d.companyName)}
      ${row('Contact', d.contactName)}
      ${row('Email', d.email)}
      ${row('Phone', d.phone)}
      ${row('WhatsApp', d.whatsapp)}
      ${row('Location', location)}
      ${row('Website', d.website)}
      ${row('Supplies', d.productTypes)}
      ${row('Documents', `${d.documentCount} attached`)}
    </table>
    ${
      d.message
        ? `<div style="margin:16px 0 0;padding:14px 16px;background:#f7f4ec;border-radius:10px;border:1px solid #e7e2d4">
            <div style="color:${MUTED};font-size:12px;margin-bottom:6px">Message</div>
            <div style="font-size:14px;line-height:1.55;white-space:pre-wrap">${escapeHtml(d.message)}</div>
          </div>`
        : ''
    }
    <p style="margin:18px 0 0;color:${MUTED};font-size:12px">Review the application and attached documents in the admin dashboard.</p>
  `)
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${GOLD};color:${DEEP};font-weight:600;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px">${label}</a>`
}

export function welcomeHtml(unsubscribeUrl: string): string {
  return shell(`
    <h2 style="margin:0 0 8px;font-size:18px;color:${DEEP}">You're subscribed 🌱</h2>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:${INK}">
      Thanks for subscribing to Green Land Engineers. We'll email you whenever we publish
      new product news or a blog post.
    </p>
    <p style="margin:18px 0 0;color:${MUTED};font-size:12px">
      Changed your mind? <a href="${unsubscribeUrl}" style="color:${MUTED}">Unsubscribe</a>.
    </p>
  `)
}

export interface PostNotification {
  kind: 'news' | 'blog'
  title: string
  summary: string
  url: string
}

function postNotificationHtml(p: PostNotification, unsubscribeUrl: string): string {
  const kindLabel = p.kind === 'news' ? 'News' : 'Blog'
  return shell(`
    <div style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">New ${kindLabel}</div>
    <h2 style="margin:0 0 10px;font-size:20px;line-height:1.3;color:${DEEP}">${escapeHtml(p.title)}</h2>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${INK}">${escapeHtml(p.summary)}</p>
    ${button(p.url, p.kind === 'news' ? 'Read the news' : 'Read the post')}
    <p style="margin:22px 0 0;color:${MUTED};font-size:12px">
      You're receiving this because you subscribed at greenland's website.
      <a href="${unsubscribeUrl}" style="color:${MUTED}">Unsubscribe</a>.
    </p>
  `)
}

function unsubscribeUrlFor(token: string): string {
  return `${APP_URL}/api/subscribe/unsubscribe?token=${encodeURIComponent(token)}`
}

export function buildPostUrl(kind: 'news' | 'blog', slug: string): string {
  // Blogs have a detail page; news is a single timeline listing.
  return kind === 'blog' ? `${APP_URL}/blog/${slug}` : `${APP_URL}/news`
}

/* ------------------------------------------------------------------ *
 * Notify every active subscriber about a freshly published post.
 * Best-effort: never throws into the caller (admin save must not fail
 * because an email bounced).
 * ------------------------------------------------------------------ */
export async function notifySubscribersOfPost(args: {
  kind: 'news' | 'blog'
  title: string
  summary: string
  slug: string
}): Promise<void> {
  try {
    if (!emailConfigured()) {
      console.warn('[email] subscriber notification skipped — email not configured')
      return
    }
    const subscribers = await prisma.subscriber.findMany({
      where: { unsubscribedAt: null },
      select: { email: true, token: true },
    })
    if (subscribers.length === 0) return

    const url = buildPostUrl(args.kind, args.slug)
    const subject =
      args.kind === 'news'
        ? `New from Green Land: ${args.title}`
        : `New blog post: ${args.title}`

    for (const sub of subscribers) {
      const html = postNotificationHtml(
        { kind: args.kind, title: args.title, summary: args.summary, url },
        unsubscribeUrlFor(sub.token),
      )
      await sendMail({ to: sub.email, subject, html })
    }
  } catch (err) {
    console.error('[email] notifySubscribersOfPost failed:', err)
  }
}

/* ------------------------------------------------------------------ *
 * Publish hook — call from the news/blog create + update routes.
 * Sends once per post: only when it's ACTIVE (published) and hasn't been
 * announced yet, then stamps notifiedAt so edits never re-send.
 * No-op (and does NOT burn notifiedAt) when email isn't configured, so a
 * post can still be announced after creds are added.
 * ------------------------------------------------------------------ */
export async function maybeNotifyForPost(opts: {
  kind: 'news' | 'blog'
  id: string
  status: string
  notifiedAt: Date | null
  title: string
  summary: string
  slug: string
}): Promise<void> {
  if (opts.status !== 'ACTIVE' || opts.notifiedAt) return
  if (!emailConfigured()) return

  await notifySubscribersOfPost({
    kind: opts.kind,
    title: opts.title,
    summary: opts.summary,
    slug: opts.slug,
  })

  const data = { notifiedAt: new Date() }
  if (opts.kind === 'news') await prisma.news.update({ where: { id: opts.id }, data })
  else await prisma.blog.update({ where: { id: opts.id }, data })
}

export { unsubscribeUrlFor }
