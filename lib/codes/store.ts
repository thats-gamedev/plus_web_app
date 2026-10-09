import "server-only"
import { createFourthwallPromotions } from "@/lib/fourthwall/platform"
import { createAdminClient } from "@/lib/supabase/admin"
import { type CodeStore, type CodeSyncResult, syncMemberCodes } from "./sync"

const UNIQUE_VIOLATION = "23505"

/**
 * CodeStore backed by Supabase with the secret key. Members can't write
 * member_codes (RLS); only the webhook, the cron and admin actions call this.
 */
export function createCodeStore(): CodeStore {
  const db = createAdminClient()

  return {
    async isPlus(userId) {
      const { data, error } = await db.rpc("is_plus", { uid: userId })
      if (error) throw new Error(`is_plus: ${error.message}`)
      return data === true
    },

    async listLiveCodes(userId) {
      const { data, error } = await db
        .from("member_codes")
        .select("id, kind, code, status, external_id")
        .eq("user_id", userId)
        .neq("status", "revoked")
      if (error) throw new Error(`member_codes read: ${error.message}`)
      return data.map((row) => ({
        id: row.id,
        kind: row.kind,
        code: row.code,
        status: row.status as "active" | "pending_sync",
        externalId: row.external_id,
      }))
    },

    async insertCode({ userId, kind, code, percent, status }) {
      const { data, error } = await db
        .from("member_codes")
        .insert({ user_id: userId, kind, code, percent, status })
        .select("id")
        .single()
      if (error?.code === UNIQUE_VIOLATION) return "duplicate"
      if (error) throw new Error(`member_codes insert: ${error.message}`)
      return { id: data.id }
    },

    async markActive(id, externalId) {
      const { error } = await db
        .from("member_codes")
        .update({ status: "active", external_id: externalId })
        .eq("id", id)
      if (error) throw new Error(`member_codes update: ${error.message}`)
    },

    async markRevoked(id) {
      const { error } = await db
        .from("member_codes")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw new Error(`member_codes revoke: ${error.message}`)
    },
  }
}

/** syncMemberCodes with the real Supabase store and Fourthwall client. */
export function syncCodes(userId: string, options?: { retryPending?: boolean }): Promise<CodeSyncResult> {
  return syncMemberCodes(
    userId,
    {
      store: createCodeStore(),
      shop: createFourthwallPromotions(),
      log: (message, details) => console.error(message, details),
    },
    options
  )
}
