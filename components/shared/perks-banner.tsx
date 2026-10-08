import Link from "next/link"
import { ChevronRightIcon, TicketPercentIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

// "Your perks are ready" teaser at the bottom of the member home (MW1 / MM2).
export function PerksBanner() {
  return (
    <Link
      href="/app/perks"
      className="group flex items-center gap-4 rounded-card border border-border bg-card px-5 py-4 transition-colors hover:border-ink/30 md:py-5"
    >
      <TicketPercentIcon aria-hidden className="size-6 shrink-0" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold md:text-lg">Your perks are ready</p>
        <p className="hidden text-sm text-muted-foreground md:block">
          15% off clothing and 10% off promotions, with your personal codes.
        </p>
      </div>
      <span className={buttonVariants({ variant: "outline", size: "sm", className: "hidden md:inline-flex" })}>
        See codes
      </span>
      <ChevronRightIcon aria-hidden className="size-5 md:hidden" />
    </Link>
  )
}
