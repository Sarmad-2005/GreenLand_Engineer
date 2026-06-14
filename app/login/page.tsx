import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/admin/auth-shell'
import { LoginForm } from '@/components/admin/login-form'

export const metadata: Metadata = {
  title: 'Admin Login — Green Land Engineers',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Admin sign in"
      subtitle="Access the Green Land content dashboard."
      footer={
        <Link href="/" className="hover:text-background">
          ← Back to website
        </Link>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
