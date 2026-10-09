"use server"

import { refresh } from "next/cache"
import type Stripe from "stripe"
import { requireAdmin } from "@/lib/dal/auth"
import { createWebhookDeps } from "@/lib/stripe/deps"
import { processEvent } from "@/lib/stripe/webhook"
import { createAdminClient } from "@/lib/supabase/admin"

// Inbox actions (AW3). Each checks requireAdmin() first.

export type InboxActionResult = { ok: boolean; message: string }

/**
 * Re-runs a stored Stripe event through the normal webhook processing.
 * Safe to repeat: processing re-reads the subscription from Stripe and
 * every write is an upsert.
 */
export async function replayWebhookEvent(eventId: number): Promise<InboxActionResult> {
  await requireAdmin()
  const db = createAdminClient()
  const { data: row } = await db.from("webhook_events").select("stripe_event_id, payload").eq("id", eventId).maybeSingle()
  if (!row) return { ok: false, message: "That event no longer exists." }

  const deps = createWebhookDeps(null)
  try {
    await processEvent(row.payload as unknown as Stripe.Event, deps)
    await deps.store.markProcessed(row.stripe_event_id)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await deps.store.markFailed(row.stripe_event_id, message)
    return { ok: false, message: `Replay failed again: ${message}` }
  }
  refresh()
  return { ok: true, message: `${row.stripe_event_id} processed.` }
}

/**
 * Closes a statutory cancellation request after the admin cancelled the
 * subscription (in Stripe) or found no matching account. The emails for
 * both outcomes come with Phase 10.
 */
export async function resolveCancellationRequest(
  requestId: string,
  outcome: "executed" | "no_match"
): Promise<InboxActionResult> {
  await requireAdmin()
  if (outcome !== "executed" && outcome !== "no_match") return { ok: false, message: "Unknown outcome." }

  const { error } = await createAdminClient()
    .from("cancellation_requests")
    .update({ status: outcome, executed_at: outcome === "executed" ? new Date().toISOString() : null })
    .eq("id", requestId)
    .in("status", ["received", "verified"])
  if (error) return { ok: false, message: `Couldn't update the request: ${error.message}` }

  refresh()
  return { ok: true, message: outcome === "executed" ? "Marked as cancelled." : "Marked as no match." }
}
