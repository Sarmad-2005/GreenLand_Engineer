import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Reveal } from '@/components/reveal'
import { SupplierForm } from '@/components/supplier/supplier-form'
import { ShieldCheck, Handshake, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Become a Supplier | Green Land Engineers',
  description:
    'Partner with Green Land Engineers. Apply to join our supplier network — share your company details and authenticity documents and our procurement team will be in touch.',
}

const perks = [
  {
    icon: Handshake,
    title: 'Long-term partnerships',
    body: 'We build lasting relationships with reliable suppliers across materials, parts and services.',
  },
  {
    icon: Globe,
    title: 'Global reach',
    body: 'Supply into our manufacturing serving farms across 40+ countries.',
  },
  {
    icon: ShieldCheck,
    title: 'Fair, vetted process',
    body: 'Submit your documents once; our procurement team reviews every application carefully.',
  },
]

export default function BecomeSupplierPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-32 md:pt-40">
        <Reveal>
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-leaf">Partner with us</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-deep sm:text-4xl md:text-6xl">
            Become a Supplier
          </h1>
          <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-text/70">
            Want to supply Green Land Engineers? Fill in your company details and attach documents that
            verify your business is authentic. Our procurement team will review and reach out.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <Reveal>
            <SupplierForm />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex flex-col gap-6 rounded-3xl bg-sage p-8">
              <h2 className="font-serif text-2xl font-semibold text-deep">Why supply Green Land</h2>
              <ul className="flex flex-col gap-5">
                {perks.map((item) => (
                  <li key={item.title} className="flex items-start gap-4">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-deep text-background">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium text-deep">{item.title}</p>
                      <p className="mt-1 leading-relaxed text-text/70">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl border border-deep/10 bg-background/60 p-5">
                <p className="font-mono text-xs uppercase tracking-wider text-soil">Accepted documents</p>
                <p className="mt-2 text-sm leading-relaxed text-text">
                  Business registration / licence, tax certificate, ISO or quality certifications, or any
                  official document that proves your company is legitimate. PDF or image, up to 5 files.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  )
}
