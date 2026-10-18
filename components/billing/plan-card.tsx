"use client"

import Link from "next/link"
import { useActionState } from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Banner } from "@/components/ui/banner"
import { Button, buttonVariants } from "@/components/ui/button"
import { startCheckout } from "@/lib/billing/actions"
import { idleState } from "@/lib/auth/form-state"
import { PLAN_BENEFITS, type PlanId } from "@/lib/plans"

const COPY: Record<
  PlanId,
  {
    name: string
    price: string
    per: string
    badge: { label: string; variant: "new" | "success" }
    note: string
    cta: string
    featured: boolean
  }
> = {
  founding_monthly: {
    name: "Founding monthly",
    price: "$7.99",
    per: "/ month",
    badge: { label: "Most flexible", variant: "new" },
    note: "Price locked as long as you stay.",
    cta: "Join monthly",
    featured: true,
  },
  founding_annual: {
    name: "Founding annual",
    price: "$79",
    per: "/ year",
    badge: { label: "2 months free", variant: "success" },
    note: "That's $6.58 a month. You save $16.88 compared to 12 months at $7.99 ($95.88). Price locked as long as you stay.",
    cta: "Join annual",
    featured: false,
  },
}

/**
 * Pricing card (LW5, MW3). On the landing page, Join leads to sign-up with
 * the plan; on the paywall (checkout), it opens Stripe Checkout. Everything
 * is accepted with the sign-up checkbox, so the cards ask for nothing.
 */
export function PlanCard({ plan, checkout = false }: { plan: PlanId; checkout?: boolean }) {
  const copy = COPY[plan]
  const [state, action, pending] = useActionState(startCheckout, idleState)

  return (
    <div
      className={cn(
        "flex flex-col rounded-card border bg-card p-6 md:p-7",
        copy.featured ? "border-2 border-brand shadow-[0_4px_0_var(--brand-shadow)]" : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{copy.name}</h3>
        <Badge variant={copy.badge.variant}>{copy.badge.label}</Badge>
      </div>
      <p className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-bold tracking-tight md:text-5xl">{copy.price}</span>
        <span className="text-muted-foreground">{copy.per}</span>
      </p>
      <p className="mt-4 text-sm text-muted-foreground">{copy.note}</p>
      <ul className="mt-5 mb-6 space-y-2.5 text-sm">
        {PLAN_BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-center gap-3">
            <CheckIcon aria-hidden className="size-4 shrink-0 text-success" />
            {benefit}
          </li>
        ))}
      </ul>

      {checkout ? (
        <form action={action} className="mt-auto space-y-4">
          <input type="hidden" name="plan" value={plan} />
          {state.message && <Banner variant="danger">{state.message}</Banner>}
          <Button
            type="submit"
            size="lg"
            variant={copy.featured ? "default" : "dark"}
            className="w-full"
            disabled={pending}
          >
            {pending ? "Opening checkout…" : copy.cta}
          </Button>
        </form>
      ) : (
        <Link
          href={`/signup?plan=${plan}`}
          className={buttonVariants({ size: "lg", variant: copy.featured ? "default" : "dark", className: "mt-auto w-full" })}
        >
          {copy.cta}
        </Link>
      )}
    </div>
  )
}

/** Both founding plans side by side, with the VAT note (pricing section, paywall). */
export function PlanCards({
  checkout = false,
}: {
  /** On the paywall: Join opens Stripe Checkout. */
  checkout?: boolean
}) {
  return (
    <div>
      <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2">
        {(Object.keys(COPY) as PlanId[]).map((plan) => (
          <PlanCard key={plan} plan={plan} checkout={checkout} />
        ))}
      </div>
      <p className="mt-5 text-center text-sm text-muted-foreground">Cancel anytime · Prices include VAT</p>
    </div>
  )
}
