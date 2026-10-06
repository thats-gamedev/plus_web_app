import "server-only"
import type Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/database.types"
import type { WebhookStore } from "./webhook"

const UNIQUE_VIOLATION = "23505"
const FOREIGN_KEY_VIOLATION = "23503"

/** WebhookStore backed by Supabase with the secret key (bypasses RLS). */
export function createWebhookStore(): WebhookStore {
  const db = createAdminClient()

  return {
    async recordEvent(event: Stripe.Event) {
      const { error } = await db.from("webhook_events").insert({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event as unknown as Json,
      })
      if (!error) return "new"
      if (error.code !== UNIQUE_VIOLATION) throw new Error(`webhook_events insert: ${error.message}`)

      const { data, error: readError } = await db
        .from("webhook_events")
        .select("processed_at")
        .eq("stripe_event_id", event.id)
        .single()
      if (readError) throw new Error(`webhook_events read: ${readError.message}`)
      return data.processed_at ? "processed" : "unprocessed"
    },

    async markProcessed(eventId) {
      const { error } = await db
        .from("webhook_events")
        .update({ processed_at: new Date().toISOString(), error: null })
        .eq("stripe_event_id", eventId)
      if (error) throw new Error(`webhook_events update: ${error.message}`)
    },

    async markFailed(eventId, message) {
      // Best effort: the 500 response already makes Stripe retry.
      await db.from("webhook_events").update({ error: message.slice(0, 2000) }).eq("stripe_event_id", eventId)
    },

    async setCustomerId(userId, customerId) {
      const { error } = await db
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId)
      if (error) throw new Error(`profiles update: ${error.message}`)
    },

    async findUserIdByCustomer(customerId) {
      const { data, error } = await db
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle()
      if (error) throw new Error(`profiles read: ${error.message}`)
      return data?.id ?? null
    },

    async upsertSubscription(row) {
      let { error } = await db.from("subscriptions").upsert(row, { onConflict: "stripe_subscription_id" })
      // The member was deleted meanwhile: keep the anonymised row for the KPIs.
      if (error?.code === FOREIGN_KEY_VIOLATION && row.user_id) {
        ;({ error } = await db
          .from("subscriptions")
          .upsert({ ...row, user_id: null }, { onConflict: "stripe_subscription_id" }))
      }
      if (error) throw new Error(`subscriptions upsert: ${error.message}`)
    },
  }
}
