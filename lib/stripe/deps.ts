import "server-only"
import { syncCodes } from "@/lib/codes/store"
import { getStripe, planForPrice } from "./client"
import { createWebhookStore } from "./store"
import type { WebhookDeps } from "./webhook"

/**
 * The real dependencies for webhook processing, shared by the webhook route
 * and the admin Replay action so both run exactly the same code.
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
  }
}
