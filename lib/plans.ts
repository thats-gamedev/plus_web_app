import type { Enums } from "@/lib/supabase/database.types"

export type PlanId = Enums<"subscription_plan">

// Founding prices are the only plans until the coding app launches.
// Phase 4 maps these ids to Stripe price ids from env vars.
export const PLANS: Record<PlanId, { name: string; price: string; interval: string }> = {
  founding_monthly: { name: "Founding monthly", price: "$7.99", interval: "/mo" },
  founding_annual: { name: "Founding annual", price: "$79", interval: "/yr" },
}

export const DEFAULT_PLAN: PlanId = "founding_monthly"

export function parsePlan(value: unknown): PlanId | null {
  return typeof value === "string" && Object.hasOwn(PLANS, value) ? (value as PlanId) : null
}

export const PLAN_BENEFITS = [
  "Every monthly drop",
  "Full library of lists and prompts",
  "Quarterly e-books",
  "15% merch · 10% promotions",
  "Plus Spotlight · coding app Pro at launch",
]
