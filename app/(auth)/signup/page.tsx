import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthHeading, AuthShell } from "@/components/auth/auth-shell"
import { FormSkeleton } from "@/components/auth/form-skeleton"
import { SignUpForm } from "@/components/auth/forms"
import { PlanBar, PlanPanel } from "@/components/auth/plan-summary"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Create your account",
  description: "Join That's Game Dev Plus: curated tools, assets, AI prompts and guides for game devs and 3D artists, with a new drop every month.",
  path: "/signup",
})

export default function SignUpPage() {
  return (
    <AuthShell
      bare
      aside={
        <Suspense>
          <PlanPanel />
        </Suspense>
      }
    >
      <Suspense>
        <PlanBar />
      </Suspense>
      <AuthHeading compact title="Create your account" />
      <Suspense fallback={<FormSkeleton fields={4} />}>
        <SignUpForm />
      </Suspense>
    </AuthShell>
  )
}
