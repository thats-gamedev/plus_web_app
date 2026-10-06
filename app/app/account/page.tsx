import type { Metadata } from "next"
import { Suspense } from "react"
import { ComingInPhase, PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { openBillingPortal } from "@/lib/billing/actions"
import { isLiveStatus } from "@/lib/billing/status"
import { getMembership, getProfile, requireUser } from "@/lib/dal/auth"
import { PLANS } from "@/lib/plans"

export const metadata: Metadata = { title: "Account" }

export default function AccountPage() {
  return (
    <>
      <PageHeader title="Account" />
      <Suspense fallback={<Skeleton className="mb-8 h-32 w-full rounded-card" />}>
        <Billing />
      </Suspense>
      <ComingInPhase phase={5}>
        Membership states, email and password settings, drop emails and data requests.
      </ComingInPhase>
    </>
  )
}

const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" })

// Minimal billing block so Phase 4 can be tested end to end; Phase 5 builds
// the full account page (MW11–13).
async function Billing() {
  await requireUser()
  const [profile, membership] = await Promise.all([getProfile(), getMembership()])
  const live = membership && isLiveStatus(membership.status)
  const periodEnd = membership?.currentPeriodEnd ? dateFormat.format(new Date(membership.currentPeriodEnd)) : null

  return (
    <section className="mb-8 rounded-card border border-border bg-card p-5 md:p-6">
      <h2 className="font-semibold">Membership</h2>
      <p className="mt-1 text-muted-foreground">
        {live ? PLANS[membership.plan].name : "No active membership"}
        {live && periodEnd && (membership.cancelAtPeriodEnd ? ` · access ends ${periodEnd}` : ` · renews ${periodEnd}`)}
      </p>
      {profile?.stripeCustomerId && (
        <form action={openBillingPortal} className="mt-4">
          <Button type="submit" variant="outline">
            Manage billing
          </Button>
        </form>
      )}
    </section>
  )
}
