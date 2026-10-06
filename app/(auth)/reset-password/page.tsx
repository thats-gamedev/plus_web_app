import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { AuthHeading, AuthShell, RenderPanel } from "@/components/auth/auth-shell"
import { FormSkeleton } from "@/components/auth/form-skeleton"
import { ResetPasswordForm } from "@/components/auth/forms"
import { Banner } from "@/components/ui/banner"
import { getUser } from "@/lib/dal/auth"

export const metadata: Metadata = { title: "Set a new password" }

// Reached from the reset email via /auth/callback, which signs the user in.
export default function ResetPasswordPage() {
  return (
    <AuthShell aside={<RenderPanel />}>
      <AuthHeading title="Set a new password" lead="This signs you out on all other devices." />
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <ResetPasswordGate />
      </Suspense>
    </AuthShell>
  )
}

async function ResetPasswordGate() {
  if (await getUser()) return <ResetPasswordForm />

  return (
    <Banner variant="warning" title="This reset link has expired">
      <Link href="/forgot-password" className="font-semibold text-brand hover:underline">
        Request a new link
      </Link>
    </Banner>
  )
}
