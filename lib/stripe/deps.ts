import "server-only"
import { isLiveStatus } from "@/lib/billing/status"
import { syncCodes } from "@/lib/codes/store"
import { sendEmailSafely } from "@/lib/email"
import { cancellationConfirmedEmail, welcomeEmail } from "@/lib/email/templates"
import { getSiteUrl } from "@/lib/site-url"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe, planForPrice } from "./client"
import { createWebhookStore } from "./store"
import type { WebhookDeps } from "./webhook"

async function profileFor(userId: string) {
  const { data } = await createAdminClient().from("profiles").select("email, display_name").eq("id", userId).maybeSingle()
  return data
}

/** "October: Stylized texturing" for the latest live drop, if any. */
async function currentDropTitle(): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("drops")
    .select("month, title, theme")
    .lte("published_at", new Date().toISOString())
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const month = new Date(`${data.month}T00:00:00Z`).toLocaleString("en-US", { month: "long", timeZone: "UTC" })
  return `${month}: ${data.theme ?? data.title}`
}

/**
 * The real dependencies for webhook processing, shared by the webhook route
 * and the admin Replay action so both run exactly the same code. Emails go
 * through sendEmailSafely: a failing email is logged, but never fails the
 * webhook (Stripe would retry everything for an email problem).
 */
export function createWebhookDeps(secret: string | null): WebhookDeps {
  const stripe = getStripe()
  return {
    constructEvent: (body, signature) => {
      if (!secret) throw new Error("Webhook secret not configured")
      return stripe.webhooks.constructEvent(body, signature, secret)
    },
    retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
    planForPrice,
    store: createWebhookStore(),
    // Issue codes when a membership starts, revoke them when it ends.
    // Fourthwall failures leave codes pending for the cron, not a 500.
    onMembershipChange: async (userId) => {
      await syncCodes(userId)
    },

    onCheckoutCompleted: async (userId, subscriptionId) => {
      const profile = await profileFor(userId)
      if (!profile) return
      await sendEmailSafely({
        to: profile.email,
        userId,
        kind: "welcome",
        refId: subscriptionId,
        content: welcomeEmail({ name: profile.display_name, siteUrl: await getSiteUrl(), dropTitle: await currentDropTitle() }),
      })
    },

    // Spec: "When cancel_at_period_end changes to true, send the cancellation
    // confirmation." Keyed by subscription and period end, so retries and
    // later events don't repeat it, but cancelling again in a later period does.
    onSubscriptionSaved: async (row) => {
      if (!row.user_id || !row.cancel_at_period_end || !isLiveStatus(row.status) || !row.current_period_end) return
      const profile = await profileFor(row.user_id)
      if (!profile) return
      await sendEmailSafely({
        to: profile.email,
        userId: row.user_id,
        kind: "cancellation_confirmed",
        refId: `${row.stripe_subscription_id}:${row.current_period_end.slice(0, 10)}`,
        content: cancellationConfirmedEmail({ name: profile.display_name, endsAt: row.current_period_end, siteUrl: await getSiteUrl() }),
      })
    },
  }
}
