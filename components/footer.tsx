'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, MapPin } from 'lucide-react'
import { contactInfo, socialLinks } from '@/lib/site-data'
import { apiErrorMessage } from '@/lib/form-error'
import {
  Facebook,
  Instagram,
  Youtube,
  Tiktok,
  Linkedin,
  Whatsapp,
} from '@/components/icons/social-icons'

const company = {
  blurb:
    'Precision tillage, seeding and harvesting machinery, trusted by farmers in 60+ countries.',
}

const quickLinks = [
  { label: 'About Us', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'News', href: '/news' },
  { label: 'Blog', href: '/blog' },
]

const mapsLink = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

const contact = [
  {
    icon: Phone,
    label: contactInfo.phone,
    href: `tel:${contactInfo.phone.replace(/[^\d+]/g, '')}`,
  },
  {
    icon: Mail,
    label: contactInfo.email,
    href: `mailto:${contactInfo.email}`,
  },
  {
    icon: MapPin,
    label: contactInfo.officeAddress,
    href: mapsLink(contactInfo.officeAddress),
    external: true,
  },
  {
    icon: MapPin,
    label: contactInfo.factoryAddress,
    href: mapsLink(contactInfo.factoryAddress),
    external: true,
  },
]

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Tiktok,
  linkedin: Linkedin,
  whatsapp: Whatsapp,
} as const

const socials = socialLinks.map((s) => ({
  ...s,
  Icon: socialIcons[s.key],
}))

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setError(null)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(apiErrorMessage(body, 'Could not subscribe. Please try again.'))
      }
      setStatus('success')
      setEmail('')
    } catch (err) {
      setStatus('error')
      setError((err as Error).message)
    }
  }

  if (status === 'success') {
    return (
      <p className="mt-4 max-w-sm rounded-full bg-gold/15 px-4 py-2.5 text-sm text-background">
        Thanks for subscribing! A welcome email is on its way.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 max-w-sm">
      <div className="flex gap-2">
        <label htmlFor="footer-email" className="sr-only">
          Email address
        </label>
        <input
          id="footer-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@farm.com"
          className="min-w-0 flex-1 rounded-full border border-background/25 bg-card px-4 py-2 text-sm text-deep placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="shrink-0 rounded-full bg-gold px-4 py-2 font-mono text-sm font-medium text-deep transition-transform hover:scale-105 disabled:opacity-60"
        >
          {status === 'sending' ? '…' : 'Subscribe'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </form>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-deep bg-deep text-background">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">

        {/* Top: logo + subscribe + blurb (full width on mobile, left column on desktop) */}
        <div className="md:flex md:items-start md:justify-between md:gap-12">
          <div className="md:max-w-sm">
            <Link href="/" className="inline-flex items-center" aria-label="Green Land Engineers — home">
              <Image
                src="/navbarlogo1.webp"
                alt="Green Land Engineers"
                width={221}
                height={40}
                className="h-8 w-auto"
              />
            </Link>

            <NewsletterForm />

            <p className="mt-4 text-sm leading-relaxed text-background/70">
              {company.blurb}
            </p>
          </div>

          {/* On desktop: contact + quick links side by side in right column */}
          <div className="hidden md:flex md:gap-16">
            {/* Contact */}
            <div>
              <h3 className="font-mono text-[11px] font-medium uppercase tracking-widest text-background">
                Contact
              </h3>
              <ul className="mt-4 space-y-2.5">
                {contact.map(({ icon: Icon, label, href, external }) => (
                  <li key={label}>
                    <a
                      href={href}
                      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                      className="group flex items-start gap-2.5 text-sm text-background/70 transition-colors hover:text-background"
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-gold" />
                      <span>{label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-mono text-[11px] font-medium uppercase tracking-widest text-background">
                Quick Links
              </h3>
              <ul className="mt-4 space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm leading-snug text-background/70 transition-colors hover:text-background"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Mobile only: contact + quick links stacked */}
        <div className="mt-6 flex flex-col gap-6 md:hidden">
          {/* Contact */}
          <div>
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-widest text-background">
              Contact
            </h3>
            <ul className="mt-3 space-y-2.5">
              {contact.map(({ icon: Icon, label, href, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                    className="group flex items-start gap-2 text-sm text-background/70 transition-colors hover:text-background"
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span className="break-words">{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-widest text-background">
              Quick Links
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm leading-snug text-background/70 transition-colors hover:text-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col-reverse gap-4 border-t border-background/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-background/60">
            © {new Date().getFullYear()} Green Land Engineers. All rights reserved.
          </p>
          <div className="flex gap-2">
            {socials.map(({ key, label, href, Icon }) => (
              <a
                key={key}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noreferrer"
                className="flex size-8 items-center justify-center rounded-full border border-background/25 text-background transition-colors hover:bg-gold hover:text-deep"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
