"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ContactForm } from "@/components/contact/contact-form"
import { Reveal } from "@/components/reveal"
import { FloatingImage } from "@/components/floating-image"
import { MapPin, Phone, Mail, Clock } from "lucide-react"
import { contactInfo, socialLinks } from "@/lib/site-data"
import { Facebook, Instagram, Youtube, Tiktok, Linkedin, Whatsapp } from "@/components/icons/social-icons"

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Tiktok,
  linkedin: Linkedin,
  whatsapp: Whatsapp,
} as const

const socials = socialLinks.map((s) => ({ ...s, icon: socialIcons[s.key] }))

const info = [
  { icon: MapPin, label: "Sales Office", lines: [contactInfo.officeAddress] },
  { icon: MapPin, label: "Factory", lines: [contactInfo.factoryAddress] },
  { icon: Phone, label: "Phone / WhatsApp", lines: contactInfo.phones },
  { icon: Mail, label: "Email", lines: [contactInfo.email] },
  { icon: Clock, label: "Working Hours", lines: [contactInfo.hours] },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* low-intensity floating motif */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.06]">
        <FloatingImage src="/products/seeds-bag.png" alt="" className="absolute left-[6%] top-[18%] w-40" duration={7} />
        <FloatingImage
          src="/products/fertilizer-sack.png"
          alt=""
          className="absolute right-[8%] top-[30%] w-44"
          duration={8}
          delay={1}
        />
        <FloatingImage
          src="/products/irrigation-pipe.png"
          alt=""
          className="absolute bottom-[12%] left-[14%] w-48"
          duration={6}
          delay={0.5}
        />
      </div>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-32 md:pt-40">
        <Reveal>
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-leaf">Get in touch</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-deep sm:text-4xl md:text-6xl">
            Let&apos;s grow together
          </h1>
          <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-text/70">
            Questions about our products, partnerships, or distribution? Reach out and our team will get back to you
            within one business day.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <Reveal>
            <ContactForm />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex flex-col gap-6 rounded-3xl bg-sage p-8">
              <h2 className="font-serif text-2xl font-semibold text-deep">Company information</h2>
              <ul className="flex flex-col gap-5">
                {info.map((item) => (
                  <li key={item.label} className="flex items-start gap-4">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-deep text-background">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-soil">{item.label}</p>
                      <div className="mt-1 leading-relaxed text-text">
                        {item.lines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-deep/20 text-deep transition-colors hover:bg-deep hover:text-background"
                  >
                    <s.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl border border-deep/10">
                <iframe
                  title="Green Land location map"
                  className="h-64 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://maps.google.com/maps?q=Green+Land+Engineers+Circular+Rd+Qazi+Town+Daska&z=14&output=embed"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  )
}
