import { LockIcon } from "lucide-react"
import { PlanCards } from "@/components/billing/plan-card"
import type { PlanId } from "@/lib/plans"

/** What a signed-in non-member sees on /app (MW3, MM4). */
export function Paywall({
  name,
  selected,
  consentAt,
}: {
  name: string
  selected: PlanId | null
  consentAt: string | null
}) {
  return (
    <div className="py-4 md:py-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
          Unlock the full toolkit{name ? `, ${name}` : ""}.
        </h1>
        <p className="mt-3 text-muted-foreground md:text-lg">
          Pick a plan to open the library, this month&apos;s drop, the shop discount and Spotlight.
        </p>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
          <LockIcon aria-hidden className="size-4" />
          Lists · e-books · the monthly drop
        </p>
      </div>
      <div className="mt-8">
        <PlanCards selected={selected} consentAt={consentAt} />
      </div>
    </div>
  )
}
