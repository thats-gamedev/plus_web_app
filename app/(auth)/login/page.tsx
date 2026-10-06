import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthHeading, AuthShell, RenderPanel } from "@/components/auth/auth-shell"
import { FormSkeleton } from "@/components/auth/form-skeleton"
import { LoginForm } from "@/components/auth/forms"

export const metadata: Metadata = { title: "Log in" }

export default function LoginPage() {
  return (
    <AuthShell headerAction={{ href: "/signup", label: "Create account" }} aside={<RenderPanel />}>
      <AuthHeading title="Welcome back" lead="Good to see you again." />
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
