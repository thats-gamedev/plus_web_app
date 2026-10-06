import "server-only"
import Stripe from "stripe"
import type { PlanId } from "@/lib/plans"

let client: Stripe | undefined

/** Server-side Stripe client (secret key). Uses the API version pinned by the SDK. */
export function getStripe(): Stripe {
  if (!client) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY in the server environment.")
    client = new Stripe(secretKey, { appInfo: { name: "thats-gamedev-plus" } })
  }
  return client
}

// Plan ↔ Stripe price. Price ids differ between test and live mode, so they
// come from the environment.
function priceIds(): Record<PlanId, string | undefined> {
  return {
    founding_monthly: process.env.STRIPE_PRICE_FOUNDING_MONTHLY,
    founding_annual: process.env.STRIPE_PRICE_FOUNDING_ANNUAL,
  }
}

export function priceIdForPlan(plan: PlanId): string {
  const priceId = priceIds()[plan]
  if (!priceId) throw new Error(`Missing Stripe price id for ${plan} (STRIPE_PRICE_* env vars).`)
  return priceId
}

export function planForPrice(priceId: string): PlanId | null {
  const match = Object.entries(priceIds()).find(([, id]) => id === priceId)
  return match ? (match[0] as PlanId) : null
}
