import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthHeading, AuthShell, RenderPanel } from "@/components/auth/auth-shell"
import { FormSkeleton } from "@/components/auth/form-skeleton"
import { LoginForm } from "@/components/auth/forms"

// Not a landing page for search: out of the index, links still followed.
export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: true } }

export default function LoginPage() {
  return (
    <AuthShell bare aside={<RenderPanel />}>
      <AuthHeading compact title="Welcome back" lead="Good to see you again." />
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
