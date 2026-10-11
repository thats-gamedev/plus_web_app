import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { CodeCard, CodingAppCard } from "@/components/perks/code-card"
import { Skeleton } from "@/components/ui/skeleton"
import { requirePlus } from "@/lib/dal/auth"
import { getMemberCodes } from "@/lib/dal/perks"
import { Stagger, StaggerItem } from "@/components/ui/motion"

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
    <Stagger when="mount" stagger={0.06} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <StaggerItem variant="subtle" className="grid">
        <CodeCard kind="merch" code={codes.find((c) => c.kind === "merch")} />
      </StaggerItem>
      <StaggerItem variant="subtle" className="grid">
        <CodeCard kind="promotion" code={codes.find((c) => c.kind === "promotion")} />
      </StaggerItem>
      <StaggerItem variant="subtle" className="grid">
        <CodingAppCard />
      </StaggerItem>
    </Stagger>
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
