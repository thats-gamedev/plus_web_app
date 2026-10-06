import type Stripe from "stripe"
import { isKnownStatus } from "@/lib/billing/status"
import type { PlanId } from "@/lib/plans"
import type { TablesInsert } from "@/lib/supabase/database.types"

export type SubscriptionRow = TablesInsert<"subscriptions">

const iso = (seconds: number | null | undefined) =>
  seconds == null ? null : new Date(seconds * 1000).toISOString()

/**
 * Maps a Stripe subscription (always freshly retrieved, never the event
 * payload) to its row in public.subscriptions. Pure, so the webhook logic is
 * unit-testable. Throws for prices or statuses we don't know, which marks the
 * webhook event as failed so it shows up in the admin log.
 */
export function toSubscriptionRow(
  subscription: Stripe.Subscription,
  {
    userId,
    planForPrice,
    now = new Date(),
  }: { userId: string | null; planForPrice: (priceId: string) => PlanId | null; now?: Date },
): SubscriptionRow {
  const item = subscription.items.data[0]
  if (!item) throw new Error(`Subscription ${subscription.id} has no items`)

  const priceId = item.price.id
  const plan = planForPrice(priceId)
  if (!plan) throw new Error(`Unknown price ${priceId} on subscription ${subscription.id}`)

  if (!isKnownStatus(subscription.status)) {
    throw new Error(`Unknown status ${subscription.status} on subscription ${subscription.id}`)
  }

  return {
    stripe_subscription_id: subscription.id,
    user_id: userId,
    stripe_price_id: priceId,
    plan,
    status: subscription.status,
    // The Customer Portal may schedule the end via cancel_at instead of
    // cancel_at_period_end; either way the member has cancelled.
    cancel_at_period_end: subscription.cancel_at_period_end || subscription.cancel_at != null,
    current_period_end: iso(item.current_period_end),
    created_at: iso(subscription.created)!,
    canceled_at: iso(subscription.canceled_at),
    ended_at: iso(subscription.ended_at),
    updated_at: now.toISOString(),
  }
}

/** The customer id whether Stripe sent it expanded or as a plain id. */
export function customerId(customer: string | { id: string } | null): string | null {
  if (!customer) return null
  return typeof customer === "string" ? customer : customer.id
}
