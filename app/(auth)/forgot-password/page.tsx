import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthHeading, AuthShell, RenderPanel } from "@/components/auth/auth-shell"
import { FormSkeleton } from "@/components/auth/form-skeleton"
import { ForgotPasswordForm } from "@/components/auth/forms"

export const metadata: Metadata = { title: "Reset your password" }

export default function ForgotPasswordPage() {
  return (
    <AuthShell headerAction={{ href: "/login", label: "Log in" }} aside={<RenderPanel />}>
      <AuthHeading title="Reset your password" lead="We'll email you a link. It works for 1 hour." />
      <Suspense fallback={<FormSkeleton fields={1} />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  )
}
