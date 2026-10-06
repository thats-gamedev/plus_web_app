import type { Metadata } from "next"
import { Suspense } from "react"
import { Paywall } from "@/components/billing/paywall"
import { ComingInPhase, PageHeader } from "@/components/layout/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { DarkPanel, Eyebrow } from "@/components/ui/typography"
import { parseConsent } from "@/lib/billing/consent"
import { getIsPlus, getProfile, requireUser } from "@/lib/dal/auth"
import { parsePlan } from "@/lib/plans"

export const metadata: Metadata = { title: "Home" }

export default function MemberHomePage({ searchParams }: PageProps<"/app">) {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home searchParams={searchParams} />
    </Suspense>
  )
}

// Members see their home; everyone else signed in sees the paywall. Other
// member pages use requirePlus(), which sends non-members back here.
async function Home({ searchParams }: Pick<PageProps<"/app">, "searchParams">) {
  await requireUser()
  const [isPlus, profile] = await Promise.all([getIsPlus(), getProfile()])
  const name = profile?.displayName ?? ""

  if (!isPlus) {
    const params = await searchParams
    return (
      <Paywall
        name={name}
        selected={parsePlan(params.plan)}
        consentAt={parseConsent(params.consent)}
      />
    )
  }

  return (
    <>
      <PageHeader title={name ? `Hey ${name}, the October drop is live.` : "The October drop is live."} />
      <DarkPanel className="mb-8">
        <Eyebrow>This month</Eyebrow>
        <h2 className="mt-3 text-4xl font-bold">
          October:
          <br />
          Stylized texturing
        </h2>
      </DarkPanel>
      <ComingInPhase phase={5}>
        This month&apos;s drop, recently added resources, new merch and the perks banner.
      </ComingInPhase>
    </>
  )
}

function HomeSkeleton() {
  return (
    <div aria-hidden className="space-y-6">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-48 w-full rounded-panel" />
    </div>
  )
}
