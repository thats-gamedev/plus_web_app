"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
 * Pricing card (LW5, MW3). Join stays disabled until the § 356 (5) BGB
 * waiver is ticked; the tick time is sent along and stored on the
 * subscription. Logged-out visitors are sent to sign-up with plan and tick.
 */
export function PlanCard({ plan, consentAt: initialConsent = null }: { plan: PlanId; consentAt?: string | null }) {
  const copy = COPY[plan]
  const [state, action, pending] = useActionState(startCheckout, idleState)
  const [consentAt, setConsentAt] = useState<string | null>(initialConsent)
  const checkboxId = `waiver-${plan}`

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
        <span className="text-5xl font-bold tracking-tight">{copy.price}</span>
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

      <form action={action} className="mt-auto space-y-4">
        <input type="hidden" name="plan" value={plan} />
        <input type="hidden" name="consentAt" value={consentAt ?? ""} />
        <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-3">
          <Checkbox
            id={checkboxId}
            checked={consentAt !== null}
            onCheckedChange={(checked) => setConsentAt(checked === true ? new Date().toISOString() : null)}
            className="mt-0.5"
          />
          <label htmlFor={checkboxId} className="text-xs leading-relaxed text-muted-foreground">
            I want access right away and understand that my 14-day right of withdrawal ends once
            access starts.{" "}
            <Link href="/withdrawal" className="underline hover:text-foreground">
              Withdrawal policy
            </Link>
          </label>
        </div>
        {state.message && <Banner variant="danger">{state.message}</Banner>}
        <Button
          type="submit"
          size="lg"
          variant={copy.featured ? "default" : "dark"}
          className="w-full"
          disabled={consentAt === null || pending}
        >
          {pending ? "Opening checkout…" : copy.cta}
        </Button>
      </form>
    </div>
  )
}

/** Both founding plans side by side, with the VAT note (pricing section, paywall). */
export function PlanCards({
  selected,
  consentAt,
}: {
  /** Plan the visitor already picked; it keeps their earlier waiver tick. */
  selected?: PlanId | null
  consentAt?: string | null
}) {
  return (
    <div>
      <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2">
        {(Object.keys(COPY) as PlanId[]).map((plan) => (
          <PlanCard key={plan} plan={plan} consentAt={plan === selected ? consentAt : null} />
        ))}
      </div>
      <p className="mt-5 text-center text-sm text-muted-foreground">Cancel anytime · Prices include VAT</p>
    </div>
  )
}
