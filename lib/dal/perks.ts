import "server-only"
import { cache } from "react"
import { getUser } from "@/lib/dal/auth"
import { createClient } from "@/lib/supabase/server"

// Data Access Layer for member codes. RLS returns a member's own codes only
// while they are Plus; Phase 6 adds the codes themselves.

export type MemberCode = {
  kind: "merch" | "promotion"
  code: string
  percent: number
  /** pending_sync: issued, but Fourthwall doesn't know it yet. */
  status: "active" | "pending_sync"
}

/** The user's live codes (at most one per kind). */
export const getMemberCodes = cache(async (): Promise<MemberCode[]> => {
  const user = await getUser()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("member_codes")
    .select("kind, code, percent, status")
    .eq("user_id", user.id)
    .neq("status", "revoked")
  return (data ?? []).map((row) => ({
    kind: row.kind,
    code: row.code,
    percent: row.percent,
    status: row.status as MemberCode["status"],
  }))
})

/** Number of the user's active perk codes (merch and promotion). */
export const getActiveCodeCount = cache(async (): Promise<number> => {
  const user = await getUser()
  if (!user) return 0

  // A member has at most two codes, so count the rows; a `head: true` count
  // would be a HEAD request, which hung under Next's patched fetch in dev.
  const supabase = await createClient()
  const { data } = await supabase
    .from("member_codes")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
  return data?.length ?? 0
})
