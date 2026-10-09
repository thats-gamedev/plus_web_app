import type { NextRequest } from "next/server"
import { LIVE_STATUSES } from "@/lib/billing/status"
import { syncCodes } from "@/lib/codes/store"
import { isCronRequest } from "@/lib/cron"
import { createAdminClient } from "@/lib/supabase/admin"

// Daily safety net for member codes (vercel.json). Vercel sends
// "Authorization: Bearer $CRON_SECRET". It syncs everyone who is a member or
// still holds a live code, which covers:
//   - merch codes left pending_sync because Fourthwall was down
//   - members without codes (a missed webhook)
//   - live codes of people whose membership ended (e.g. a failed revoke)

export async function GET(request: NextRequest) {
  if (!isCronRequest(request)) return new Response("Unauthorized", { status: 401 })

  const db = createAdminClient()
  const [members, holders] = await Promise.all([
    db.from("subscriptions").select("user_id").in("status", [...LIVE_STATUSES]).not("user_id", "is", null),
    db.from("member_codes").select("user_id").neq("status", "revoked"),
  ])
  if (members.error || holders.error) {
    return Response.json({ error: (members.error ?? holders.error)!.message }, { status: 500 })
  }

  const userIds = [...new Set([...members.data, ...holders.data].map((row) => row.user_id).filter(Boolean))] as string[]
  const totals = { users: userIds.length, created: 0, activated: 0, revoked: 0, failed: 0, errors: 0 }

  // One at a time: few users, and it keeps Fourthwall's rate limits safe.
  for (const userId of userIds) {
    try {
      const result = await syncCodes(userId, { retryPending: true })
      totals.created += result.created.length
      totals.activated += result.activated.length
      totals.revoked += result.revoked.length
      totals.failed += result.failed.length
    } catch (error) {
      totals.errors++
      console.error("Code sync failed", { userId, error: String(error) })
    }
  }

  return Response.json(totals, { status: totals.errors ? 500 : 200 })
}
