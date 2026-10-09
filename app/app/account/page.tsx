import type { Metadata } from "next"
import { Suspense } from "react"
import { MembershipCard, PastDueBanner } from "@/components/account/membership-card"
import { SettingsList } from "@/components/account/settings-list"
import { PageHeader } from "@/components/layout/page-header"
import { LogoutButton } from "@/components/layout/member-user"
import { Skeleton } from "@/components/ui/skeleton"
import { membershipState } from "@/lib/billing/membership"
import { getMembership, getProfile, requireUser } from "@/lib/dal/auth"
import { getActiveCodeCount } from "@/lib/dal/perks"
import { contactMailto } from "@/lib/site"

export const metadata: Metadata = { title: "Account" }

// Open to every signed-in user, not only members: people whose membership
// ended still need billing history, settings and "See plans".
export default function AccountPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Account" />
      <Suspense fallback={<AccountSkeleton />}>
        <Account />
      </Suspense>
    </div>
  )
}

async function Account() {
  const user = await requireUser()
  const [profile, membership, activeCodes] = await Promise.all([
    getProfile(),
    getMembership(),
    getActiveCodeCount(),
  ])
  const hasCustomer = Boolean(profile?.stripeCustomerId)

  return (
    <>
      {membershipState(membership) === "past_due" && <PastDueBanner canUpdate={hasCustomer} />}
      <MembershipCard membership={membership} hasCustomer={hasCustomer} />

      <div className="mt-5">
        <SettingsList
          displayName={profile?.displayName ?? ""}
          email={user.email}
          activeCodes={activeCodes}
          dropEmails={profile?.dropEmails ?? true}
        />
      </div>

      <div className="mt-5 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <a href={contactMailto("Data export or deletion request")} className="text-brand hover:underline">
          Request data export or deletion
        </a>
        <LogoutButton className="font-semibold hover:underline">Log out</LogoutButton>
      </div>
    </>
  )
}

function AccountSkeleton() {
  return (
    <div aria-hidden className="space-y-5">
      <Skeleton className="h-44 w-full rounded-card" />
      <Skeleton className="h-96 w-full rounded-card" />
    </div>
  )
}
