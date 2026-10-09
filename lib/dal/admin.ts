import "server-only"
import { cache } from "react"
import type { MemberRow } from "@/lib/admin/members"
import type { SubscriptionFacts } from "@/lib/admin/metrics"
import { requireAdmin } from "@/lib/dal/auth"
import type { Enums, Json } from "@/lib/supabase/database.types"
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

const memberColumns =
  "id, email, display_name, role, created_at, stripe_customer_id, subscriptions (stripe_subscription_id, plan, status, cancel_at_period_end, current_period_end, created_at, canceled_at, ended_at)"

type MemberQueryRow = {
  id: string
  email: string
  display_name: string
  role: "member" | "admin"
  created_at: string
  stripe_customer_id: string | null
  subscriptions: {
    stripe_subscription_id: string
    plan: MemberRow["subscriptions"][number]["plan"]
    status: MemberRow["subscriptions"][number]["status"]
    cancel_at_period_end: boolean
    current_period_end: string | null
    created_at: string
    canceled_at: string | null
    ended_at: string | null
  }[]
}

function toMemberRow(row: MemberQueryRow): MemberRow {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
    stripeCustomerId: row.stripe_customer_id,
    subscriptions: row.subscriptions
      .map((s) => ({
        stripeSubscriptionId: s.stripe_subscription_id,
        plan: s.plan,
        status: s.status,
        cancelAtPeriodEnd: s.cancel_at_period_end,
        currentPeriodEnd: s.current_period_end,
        createdAt: s.created_at,
        canceledAt: s.canceled_at,
        endedAt: s.ended_at,
      }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  }
}

/** Every account with its subscriptions, newest account first. */
export const getMembers = cache(async (): Promise<MemberRow[]> => {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").select(memberColumns).order("created_at", { ascending: false })
  if (error) throw new Error(`profiles read: ${error.message}`)
  return data.map(toMemberRow)
})

export type MemberDetail = {
  member: MemberRow
  codes: { kind: "merch" | "promotion"; code: string; percent: number; status: string; createdAt: string; revokedAt: string | null }[]
  emails: { kind: string; refId: string; sentAt: string }[]
}

/** One account with codes and sent emails, for the member drawer. */
export async function getMemberDetail(id: string): Promise<MemberDetail | null> {
  await requireAdmin()
  const supabase = await createClient()
  const [member, codes, emails] = await Promise.all([
    supabase.from("profiles").select(memberColumns).eq("id", id).maybeSingle(),
    supabase
      .from("member_codes")
      .select("kind, code, percent, status, created_at, revoked_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("email_log").select("kind, ref_id, sent_at").eq("user_id", id).order("sent_at", { ascending: false }),
  ])
  if (member.error) throw new Error(`profiles read: ${member.error.message}`)
  if (!member.data) return null

  return {
    member: toMemberRow(member.data),
    codes: (codes.data ?? []).map((c) => ({
      kind: c.kind,
      code: c.code,
      percent: c.percent,
      status: c.status,
      createdAt: c.created_at,
      revokedAt: c.revoked_at,
    })),
    emails: (emails.data ?? []).map((e) => ({ kind: e.kind, refId: e.ref_id, sentAt: e.sent_at })),
  }
}

export type AdminCode = {
  id: string
  code: string
  kind: "merch" | "promotion"
  percent: number
  status: "active" | "pending_sync" | "revoked"
  createdAt: string
  revokedAt: string | null
  userId: string
  email: string
}

/** Every member code with its owner, newest first. */
export async function getAdminCodes(): Promise<AdminCode[]> {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("member_codes")
    .select("id, code, kind, percent, status, created_at, revoked_at, user_id, profile:profiles (email)")
    .order("created_at", { ascending: false })
  if (error) throw new Error(`member_codes read: ${error.message}`)
  return data.map((row) => ({
    id: row.id,
    code: row.code,
    kind: row.kind,
    percent: row.percent,
    status: row.status,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
    userId: row.user_id,
    email: row.profile?.email ?? "deleted member",
  }))
}

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
  status: Enums<"cancellation_status">
  userId: string | null
}

/** Cancellation requests that still need the admin (received or verified). */
export const getOpenCancellationRequests = cache(async (): Promise<CancellationRequest[]> => {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cancellation_requests")
    .select("id, created_at, name, email, status, user_id")
    .eq("kind", "cancellation")
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

export type WithdrawalRequest = CancellationRequest & {
  reference: string | null
  /** Sent while logged in to the linked account. */
  verified: boolean
  /** The member's latest subscription, to judge the 14 days and the waiver. */
  subscription: { startedAt: string; waiverConsentAt: string | null; status: string; endedAt: string | null } | null
}

/** Withdrawal requests that still need the admin. */
export const getOpenWithdrawalRequests = cache(async (): Promise<WithdrawalRequest[]> => {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cancellation_requests")
    .select("id, created_at, name, email, status, user_id, reference, verified_at")
    .eq("kind", "withdrawal")
    .in("status", ["received", "verified"])
    .order("created_at", { ascending: true })
  if (error) throw new Error(`withdrawal requests read: ${error.message}`)

  const userIds = [...new Set(data.map((r) => r.user_id).filter((id): id is string => Boolean(id)))]
  const { data: subs, error: subsError } = userIds.length
    ? await supabase
        .from("subscriptions")
        .select("user_id, created_at, waiver_consent_at, status, ended_at")
        .in("user_id", userIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null }
  if (subsError) throw new Error(`subscriptions read: ${subsError.message}`)

  return data.map((row) => {
    const sub = subs.find((s) => s.user_id === row.user_id)
    return {
      id: row.id,
      createdAt: row.created_at,
      name: row.name,
      email: row.email,
      status: row.status,
      userId: row.user_id,
      reference: row.reference,
      verified: Boolean(row.verified_at),
      subscription: sub
        ? { startedAt: sub.created_at, waiverConsentAt: sub.waiver_consent_at, status: sub.status, endedAt: sub.ended_at }
        : null,
    }
  })
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
