import type { Enums } from "@/lib/supabase/database.types"

export type SubscriptionStatus = Enums<"subscription_status">

// Must match public.is_plus(): these statuses grant access. Stripe keeps a
// subscription that cancels at period end 'active' until the period is over.
export const LIVE_STATUSES: readonly SubscriptionStatus[] = ["active", "trialing", "past_due"]

export function isLiveStatus(status: string): boolean {
  return (LIVE_STATUSES as readonly string[]).includes(status)
}

const ALL_STATUSES: readonly SubscriptionStatus[] = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "canceled",
  "paused",
]

export function isKnownStatus(status: string): status is SubscriptionStatus {
  return (ALL_STATUSES as readonly string[]).includes(status)
}
