import type { NextRequest } from "next/server"
import { computeKpis, type SubscriptionFacts } from "@/lib/admin/metrics"
import { isCronRequest } from "@/lib/cron"
import { createAdminClient } from "@/lib/supabase/admin"

// Daily member snapshot for the admin chart (vercel.json, 03:00 UTC). One
// row per day; running it again the same day overwrites that day's row.

export async function GET(request: NextRequest) {
  if (!isCronRequest(request)) return new Response("Unauthorized", { status: 401 })

  const db = createAdminClient()
  const { data, error } = await db
    .from("subscriptions")
    .select("id, user_id, plan, status, cancel_at_period_end, created_at, canceled_at, ended_at, updated_at")
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const facts: SubscriptionFacts[] = data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    email: null,
    plan: row.plan,
    status: row.status,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    createdAt: row.created_at,
    canceledAt: row.canceled_at,
    endedAt: row.ended_at,
    updatedAt: row.updated_at,
  }))
  const now = new Date()
  const kpis = computeKpis(facts, now)
  const day = now.toISOString().slice(0, 10)

  const { error: upsertError } = await db
    .from("member_snapshots")
    .upsert({ day, active_members: kpis.activeMembers, mrr_cents: kpis.mrrCents }, { onConflict: "day" })
  if (upsertError) return Response.json({ error: upsertError.message }, { status: 500 })

  return Response.json({ day, activeMembers: kpis.activeMembers, mrrCents: kpis.mrrCents })
}
