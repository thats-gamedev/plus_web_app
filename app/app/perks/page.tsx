import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { CodeCard, CodingAppCard } from "@/components/perks/code-card"
import { Skeleton } from "@/components/ui/skeleton"
import { requirePlus } from "@/lib/dal/auth"
import { getMemberCodes } from "@/lib/dal/perks"

export const metadata: Metadata = { title: "Perks" }

export default function PerksPage() {
  return (
    <>
      <PageHeader title="Perks" />
      <p className="-mt-4 mb-6 hidden text-muted-foreground md:block">
        Your codes work as long as your membership is active.
      </p>
      <Suspense fallback={<PerksSkeleton />}>
        <Perks />
      </Suspense>
    </>
  )
}

async function Perks() {
  await requirePlus()
  const codes = await getMemberCodes()

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <CodeCard kind="merch" code={codes.find((c) => c.kind === "merch")} />
      <CodeCard kind="promotion" code={codes.find((c) => c.kind === "promotion")} />
      <CodingAppCard />
    </div>
  )
}

function PerksSkeleton() {
  return (
    <div aria-hidden className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-60 rounded-card" />
      ))}
    </div>
  )
}
