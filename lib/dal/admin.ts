import "server-only"
import { cache } from "react"
import type { SubscriptionFacts } from "@/lib/admin/metrics"
import { requireAdmin } from "@/lib/dal/auth"
import type { Json } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

// Data Access Layer for the admin area. Every function checks the admin role
// itself (pages can be rendered outside the layout), then reads as the
// signed-in admin: the RLS policies let admins read all rows, so no
// service-role client is needed for reading.
//
// Counts select ids instead of `head: true`: head-only counts hung under
// Next's patched fetch in dev (docs/Open_Items.md, "Gotchas").

export const getSubscriptionFacts = cache(async (): Promise<SubscriptionFacts[]> => {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, user_id, plan, status, cancel_at_period_end, created_at, canceled_at, ended_at, updated_at, profile:profiles (email)"
    )
    .order("created_at", { ascending: false })
  if (error) throw new Error(`subscriptions read: ${error.message}`)

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    email: row.profile?.email ?? null,
    plan: row.plan,
    status: row.status,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    createdAt: row.created_at,
    canceledAt: row.canceled_at,
    endedAt: row.ended_at,
    updatedAt: row.updated_at,
  }))
})

export type Snapshot = { day: string; activeMembers: number; mrrCents: number }

/** Daily snapshots for the last `days` days, oldest first. */
export async function getSnapshots(days: number): Promise<Snapshot[]> {
  await requireAdmin()
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("member_snapshots")
    .select("day, active_members, mrr_cents")
    .gte("day", since)
    .order("day", { ascending: true })
  if (error) throw new Error(`member_snapshots read: ${error.message}`)
  return data.map((row) => ({ day: row.day, activeMembers: row.active_members, mrrCents: row.mrr_cents }))
}

export type CancellationRequest = {
  id: string
  createdAt: string
  name: string
  email: string
  status: "received" | "verified" | "executed" | "no_match"
  userId: string | null
}

/** Cancellation requests that still need the admin (received or verified). */
export const getOpenCancellationRequests = cache(async (): Promise<CancellationRequest[]> => {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cancellation_requests")
    .select("id, created_at, name, email, status, user_id")
    .in("status", ["received", "verified"])
    .order("created_at", { ascending: true })
  if (error) throw new Error(`cancellation_requests read: ${error.message}`)
  return data.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    email: row.email,
    status: row.status,
    userId: row.user_id,
  }))
})

export type WebhookEvent = {
  id: number
  stripeEventId: string
  type: string
  receivedAt: string
  processedAt: string | null
  error: string | null
  payload: Json
}

const webhookColumns = "id, stripe_event_id, event_type, received_at, processed_at, error, payload"

function toWebhookEvent(row: {
  id: number
  stripe_event_id: string
  event_type: string
  received_at: string
  processed_at: string | null
  error: string | null
  payload: Json
}): WebhookEvent {
  return {
    id: row.id,
    stripeEventId: row.stripe_event_id,
    type: row.event_type,
    receivedAt: row.received_at,
    processedAt: row.processed_at,
    error: row.error,
    payload: row.payload,
  }
}

/** Webhook events that failed and were never processed. */
export const getFailedWebhookEvents = cache(async (): Promise<WebhookEvent[]> => {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("webhook_events")
    .select(webhookColumns)
    .is("processed_at", null)
    .not("error", "is", null)
    .order("received_at", { ascending: false })
    .limit(50)
  if (error) throw new Error(`webhook_events read: ${error.message}`)
  return data.map(toWebhookEvent)
})

/** The most recent webhook events, for the webhook log. */
export async function getWebhookLog(limit = 50): Promise<WebhookEvent[]> {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("webhook_events")
    .select(webhookColumns)
    .order("received_at", { ascending: false })
    .limit(limit)
  if (error) throw new Error(`webhook_events read: ${error.message}`)
  return data.map(toWebhookEvent)
}

export type AdminNavCounts = { pendingCodes: number; inbox: number; spotlight: number }

/** Orange counts in the admin sidebar: things waiting for the admin. */
export const getAdminNavCounts = cache(async (): Promise<AdminNavCounts> => {
  await requireAdmin()
  const supabase = await createClient()
  const month = new Date().toISOString().slice(0, 8) + "01"
  const [codes, requests, failed, spotlight] = await Promise.all([
    supabase.from("member_codes").select("id").eq("status", "pending_sync"),
    supabase.from("cancellation_requests").select("id").in("status", ["received", "verified"]),
    supabase.from("webhook_events").select("id").is("processed_at", null).not("error", "is", null),
    supabase.from("spotlight_submissions").select("id").eq("month", month).eq("status", "submitted"),
  ])
  return {
    pendingCodes: codes.data?.length ?? 0,
    inbox: (requests.data?.length ?? 0) + (failed.data?.length ?? 0),
    spotlight: spotlight.data?.length ?? 0,
  }
})
