import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/admin/auth-shell'
import { ForgotForm } from '@/components/admin/forgot-form'

export const metadata: Metadata = {
  title: 'Reset Password — Green Land Engineers',
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link href="/login" className="hover:text-background">
          ← Back to sign in
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  )
}
