import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ChevronRightIcon } from "lucide-react"
import { MembershipCard, PastDueBanner } from "@/components/account/membership-card"
import { SettingsList } from "@/components/account/settings-list"
import { contractLinks, legalLinks } from "@/components/layout/nav-config"
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
      <ContractLinks />
      <div className="mt-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <a href={contactMailto("Data export or deletion request")} className="text-brand hover:underline">
          Request data export or deletion
        </a>
        <LogoutButton className="font-semibold hover:underline">Log out</LogoutButton>
      </div>
    </div>
  )
}

/**
 * The statutory cancel and withdraw links (§ 312k, § 356a BGB) and the legal
 * pages. They used to sit at the bottom of the member sidebar; the Account
 * page is one click from every member page, and the public footer has them
 * too. Outside the Suspense boundary, so they show while the account loads.
 */
function ContractLinks() {
  return (
    <section aria-labelledby="contract-legal" className="mt-8 rounded-card border border-border bg-card p-5 md:p-6">
      <h2 id="contract-legal" className="text-lg font-bold">
        Contract &amp; legal
      </h2>
      <ul className="mt-3 divide-y divide-border">
        {contractLinks.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex items-center justify-between py-3 font-medium hover:text-brand">
              {l.label}
              <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
      <nav aria-label="Legal" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {legalLinks.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </nav>
    </section>
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
