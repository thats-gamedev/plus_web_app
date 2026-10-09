"use server"

import { refresh } from "next/cache"
import type Stripe from "stripe"
import { cancelAtPeriodEnd } from "@/lib/billing/cancel"
import { refundAndEnd } from "@/lib/billing/withdraw"
import { withdrawalAssessment } from "@/lib/cancel/withdrawal"
import { requireAdmin } from "@/lib/dal/auth"
import { sendEmailSafely } from "@/lib/email"
import { cancellationNoMatchEmail, withdrawalConfirmedEmail, withdrawalDeclinedEmail } from "@/lib/email/templates"
import { getSiteUrl } from "@/lib/site-url"
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
 * Closes a statutory cancellation request.
 * - "executed": cancels the member's subscription at period end in Stripe;
 *   the webhook then sends the cancellation confirmation.
 * - "no_match": no account uses the email; sends the no-match reply.
 */
export async function resolveCancellationRequest(
  requestId: string,
  outcome: "executed" | "no_match"
): Promise<InboxActionResult> {
  await requireAdmin()
  if (outcome !== "executed" && outcome !== "no_match") return { ok: false, message: "Unknown outcome." }

  const db = createAdminClient()
  const { data: request } = await db
    .from("cancellation_requests")
    .select("id, email, user_id, status")
    .eq("id", requestId)
    .eq("kind", "cancellation")
    .maybeSingle()
  if (!request || !["received", "verified"].includes(request.status)) {
    return { ok: false, message: "This request is already handled." }
  }

  if (outcome === "executed") {
    if (!request.user_id) return { ok: false, message: "No account is linked to this request." }
    const result = await cancelAtPeriodEnd(request.user_id)
    if (!result.ok) return result
  } else {
    await sendEmailSafely({
      to: request.email,
      userId: null,
      kind: "cancellation_no_match",
      refId: request.id,
      content: cancellationNoMatchEmail({ email: request.email, siteUrl: await getSiteUrl() }),
    })
  }

  const { error } = await db
    .from("cancellation_requests")
    .update({ status: outcome, executed_at: outcome === "executed" ? new Date().toISOString() : null })
    .eq("id", requestId)
    .in("status", ["received", "verified"])
  if (error) return { ok: false, message: `Couldn't update the request: ${error.message}` }

  refresh()
  return {
    ok: true,
    message: outcome === "executed" ? "Cancelled at period end. The member gets the confirmation email." : "No-match reply sent.",
  }
}

/**
 * Closes a withdrawal request (/withdraw). The admin judges it in the inbox:
 * - "refund": the withdrawal is valid; refunds the last payment, ends the
 *   membership now and emails the member.
 * - "decline": the right had expired (waiver at checkout, or after 14 days);
 *   emails the reason and how to cancel instead. Refused while the request
 *   is inside the 14 days without a waiver, as those must be accepted.
 * - "no_match": no account uses the email; sends the no-match reply.
 */
export async function resolveWithdrawalRequest(
  requestId: string,
  outcome: "refund" | "decline" | "no_match"
): Promise<InboxActionResult> {
  await requireAdmin()
  if (!["refund", "decline", "no_match"].includes(outcome)) return { ok: false, message: "Unknown outcome." }

  const db = createAdminClient()
  const { data: request } = await db
    .from("cancellation_requests")
    .select("id, name, email, user_id, status, created_at")
    .eq("id", requestId)
    .eq("kind", "withdrawal")
    .maybeSingle()
  if (!request || !["received", "verified"].includes(request.status)) {
    return { ok: false, message: "This request is already handled." }
  }
  const siteUrl = await getSiteUrl()

  if (outcome === "no_match") {
    await sendEmailSafely({
      to: request.email,
      userId: null,
      kind: "cancellation_no_match",
      refId: request.id,
      content: cancellationNoMatchEmail({ email: request.email, siteUrl, kind: "withdrawal" }),
    })
    return closeRequest(db, request.id, "no_match", "No-match reply sent.")
  }

  if (!request.user_id) return { ok: false, message: "No account is linked to this request." }
  const { data: profile } = await db.from("profiles").select("email, display_name").eq("id", request.user_id).maybeSingle()
  if (!profile) return { ok: false, message: "The linked account no longer exists." }

  if (outcome === "refund") {
    const result = await refundAndEnd(request.user_id, request.id)
    if (!result.ok) return result
    await sendEmailSafely({
      to: profile.email,
      userId: request.user_id,
      kind: "withdrawal_confirmed",
      refId: request.id,
      content: withdrawalConfirmedEmail({ name: profile.display_name, refund: result.refunded }),
    })
    return closeRequest(
      db,
      request.id,
      "executed",
      result.refunded ? `Refunded ${result.refunded} and ended the membership.` : "Ended the membership; there was nothing to refund."
    )
  }

  const { data: sub } = await db
    .from("subscriptions")
    .select("created_at, waiver_consent_at")
    .eq("user_id", request.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  const assessment = withdrawalAssessment({
    startedAt: sub?.created_at ?? null,
    waiverConsentAt: sub?.waiver_consent_at ?? null,
    receivedAt: request.created_at,
  })
  if (assessment === "within_period" || assessment === "no_subscription") {
    return {
      ok: false,
      message:
        assessment === "within_period"
          ? "This withdrawal came within 14 days and there's no waiver on record, so it has to be accepted."
          : "This account has no subscription to withdraw from. Send the no-match reply instead.",
    }
  }
  await sendEmailSafely({
    to: profile.email,
    userId: request.user_id,
    kind: "withdrawal_declined",
    refId: request.id,
    content: withdrawalDeclinedEmail({
      name: profile.display_name,
      reason: assessment,
      waiverAt: sub?.waiver_consent_at ?? null,
      startedAt: sub?.created_at ?? null,
      siteUrl,
    }),
  })
  return closeRequest(db, request.id, "declined", "Declined; the member got the reason and the cancel link.")
}

async function closeRequest(
  db: ReturnType<typeof createAdminClient>,
  id: string,
  status: "executed" | "declined" | "no_match",
  message: string
): Promise<InboxActionResult> {
  const { error } = await db
    .from("cancellation_requests")
    .update({ status, executed_at: status === "executed" ? new Date().toISOString() : null })
    .eq("id", id)
    .in("status", ["received", "verified"])
  if (error) return { ok: false, message: `Couldn't update the request: ${error.message}` }
  refresh()
  return { ok: true, message }
}
