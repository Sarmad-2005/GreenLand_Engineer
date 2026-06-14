import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/admin/auth-shell'
import { ResetForm } from '@/components/admin/reset-form'

export const metadata: Metadata = {
  title: 'Set New Password — Green Land Engineers',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password for your account."
      footer={
        <Link href="/login" className="hover:text-background">
          ← Back to sign in
        </Link>
      }
    >
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  )
}
