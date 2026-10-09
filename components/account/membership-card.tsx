import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Banner } from "@/components/ui/banner"
import { Button, buttonVariants } from "@/components/ui/button"
import { openBillingPortal } from "@/lib/billing/actions"
import { membershipBadges, membershipState } from "@/lib/billing/membership"
import type { Membership } from "@/lib/dal/auth"
import { formatDay } from "@/lib/format"
import { PLANS } from "@/lib/plans"

const intervals = { "/mo": "mo", "/yr": "yr" } as Record<string, string>

/** A Server Action form, so the portal opens without client JavaScript. */
function PortalButton({
  variant,
  className,
  children,
}: {
  variant: "outline" | "ghost" | "dark" | "default"
  className?: string
  children: React.ReactNode
}) {
  return (
    <form action={openBillingPortal}>
      <Button type="submit" variant={variant} className={className}>
        {children}
      </Button>
    </form>
  )
}

/** Past-due warning above the membership card (MW12). */
export function PastDueBanner({ canUpdate }: { canUpdate: boolean }) {
  return (
    <Banner
      variant="warning"
      title="Payment failed. Update your card to keep access."
      className="mb-4"
      action={canUpdate ? <PortalButton variant="dark">Update card</PortalButton> : undefined}
    >
      Stripe retries the payment automatically over the next days.
    </Banner>
  )
}

// Membership card on /app/account: active (MW11), past due (MW12), canceled
// at period end (MW13), plus ended and never-subscribed. "Manage billing",
// "Cancel membership" and "Rejoin" all open the Stripe Customer Portal,
// which is configured to cancel at period end.
export function MembershipCard({
  membership,
  hasCustomer,
}: {
  membership: Membership | null
  /** Without a Stripe customer there is no portal to open. */
  hasCustomer: boolean
}) {
  const state = membershipState(membership)
  const plan = membership ? PLANS[membership.plan] : null
  const periodEnd = membership?.currentPeriodEnd ? formatDay(membership.currentPeriodEnd) : null

  const line = {
    active: periodEnd ? `Renews on ${periodEnd}` : "Your membership is active.",
    past_due: "Your last payment didn't go through. Access continues while Stripe retries.",
    ending: periodEnd
      ? `Access until ${periodEnd}. Your perk codes stop working after that.`
      : "Your membership ends at the close of this billing period.",
    ended: periodEnd ? `Your membership ended on ${periodEnd}.` : "Your membership has ended.",
    none: "You're not a member yet.",
  }[state]

  return (
    <section aria-labelledby="membership-title" className="rounded-card border border-border bg-card p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-3 hidden text-sm font-semibold text-muted-foreground md:block">Membership</p>
          <h2 id="membership-title" className="text-xl font-semibold md:text-2xl">
            {plan?.name ?? "No membership"}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-4">
          {state !== "none" && (
            <Badge variant={membershipBadges[state].variant}>{membershipBadges[state].label}</Badge>
          )}
          {plan && (
            <p className="hidden font-mono text-lg md:block">
              {plan.price} / {intervals[plan.interval] ?? plan.interval}
            </p>
          )}
        </div>
      </div>
      <p className="mt-2 text-muted-foreground md:mt-3">{line}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3">
        {(state === "active" || state === "past_due") &&
          (hasCustomer ? (
            <>
              <PortalButton variant="outline" className="flex-1 md:flex-none">
                Manage billing
              </PortalButton>
              <PortalButton variant="ghost" className="flex-1 md:flex-none">
                <span className="md:hidden">Cancel</span>
                <span className="hidden md:inline">Cancel membership</span>
              </PortalButton>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Billing for this account isn&apos;t managed in Stripe.</p>
          ))}

        {state === "ending" && hasCustomer && (
          <>
            {/* Renewing in the portal resumes the same subscription and price. */}
            <PortalButton variant="default">Rejoin</PortalButton>
            <p className="text-sm text-faint">Rejoining keeps your founding price.</p>
          </>
        )}

        {(state === "ended" || state === "none") && (
          <Link href="/app" className={buttonVariants({ variant: "default" })}>
            See plans
          </Link>
        )}
      </div>
    </section>
  )
}
