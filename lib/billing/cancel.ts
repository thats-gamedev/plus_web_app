import "server-only"
import { LIVE_STATUSES } from "@/lib/billing/status"
import { getStripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Cancels a member's live subscription(s) at the end of the paid period in
 * Stripe, as the Customer Portal does. The webhook then updates Supabase and
 * sends the confirmation email. Callers must have authorised the
 * cancellation (admin, the logged-in member, or a verified /cancel link).
 */
export async function cancelAtPeriodEnd(
  userId: string
): Promise<{ ok: true; endsAt: string | null } | { ok: false; message: string }> {
  const { data: subs, error } = await createAdminClient()
    .from("subscriptions")
    .select("stripe_subscription_id, current_period_end")
    .eq("user_id", userId)
    .in("status", [...LIVE_STATUSES])
  if (error) return { ok: false, message: `Couldn't load the subscription: ${error.message}` }
  if (!subs.length) return { ok: false, message: "There is no active membership to cancel." }

  try {
    for (const sub of subs) {
      await getStripe().subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true })
    }
  } catch (stripeError) {
    return { ok: false, message: `Stripe couldn't cancel it: ${String(stripeError)}` }
  }
  const ends = subs.map((s) => s.current_period_end).filter(Boolean).sort().at(-1) ?? null
  return { ok: true, endsAt: ends }
}
