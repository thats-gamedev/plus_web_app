import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthHeading, AuthShell } from "@/components/auth/auth-shell"
import { FormSkeleton } from "@/components/auth/form-skeleton"
import { SignUpForm } from "@/components/auth/forms"
import { PlanBar, PlanPanel } from "@/components/auth/plan-summary"

export const metadata: Metadata = { title: "Create your account" }

export default function SignUpPage() {
  return (
    <AuthShell
      headerAction={{ href: "/login", label: "Log in" }}
      aside={
        <Suspense>
          <PlanPanel />
        </Suspense>
      }
    >
      <Suspense>
        <PlanBar />
      </Suspense>
      <AuthHeading title="Create your account" />
      <Suspense fallback={<FormSkeleton fields={4} />}>
        <SignUpForm />
      </Suspense>
    </AuthShell>
  )
}
