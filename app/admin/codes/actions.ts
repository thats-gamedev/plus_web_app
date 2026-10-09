"use server"

import { refresh } from "next/cache"
import { syncCodes } from "@/lib/codes/store"
import { requireAdmin } from "@/lib/dal/auth"
import { createFourthwallPromotions } from "@/lib/fourthwall/platform"
import { createAdminClient } from "@/lib/supabase/admin"

// Admin code actions (AW8). Each checks requireAdmin() first and only then
// uses the service-role client. They return a message for a toast.

export type CodeActionResult = { ok: boolean; message: string }

/**
 * Revokes one code (e.g. it leaked). A member who is still Plus gets a new
 * code of the same kind right away, so revoking works as "rotate".
 */
export async function revokeCode(codeId: string): Promise<CodeActionResult> {
  await requireAdmin()
  const db = createAdminClient()
  const { data: code } = await db
    .from("member_codes")
    .select("id, user_id, kind, code, status, external_id")
    .eq("id", codeId)
    .maybeSingle()
  if (!code) return { ok: false, message: "That code no longer exists." }
  if (code.status === "revoked") return { ok: true, message: `${code.code} was already revoked.` }

  if (code.kind === "merch" && code.external_id) {
    try {
      await createFourthwallPromotions().endPromotion(code.external_id)
    } catch (error) {
      return { ok: false, message: `Fourthwall couldn't end ${code.code}: ${String(error)}. Nothing changed.` }
    }
  }

  const { error } = await db
    .from("member_codes")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", code.id)
  if (error) return { ok: false, message: `Couldn't revoke: ${error.message}` }

  const result = await syncCodes(code.user_id)
  refresh()
  return {
    ok: true,
    message: result.created.length
      ? `${code.code} revoked. The member got a new ${code.kind} code.`
      : `${code.code} revoked.`,
  }
}

/** Issues missing codes for a member (no-op unless they are Plus). */
export async function reissueCodes(userId: string): Promise<CodeActionResult> {
  await requireAdmin()
  const result = await syncCodes(userId, { retryPending: true })
  refresh()
  if (result.created.length) return { ok: true, message: `Issued: ${result.created.join(" + ")}.` }
  if (result.failed.length) return { ok: false, message: "The code is issued but still waiting for Fourthwall." }
  return { ok: true, message: "Nothing to issue: the member already has live codes, or isn't a member." }
}

/** "Retry now": pushes every pending merch code to Fourthwall again. */
export async function retryPendingCodes(): Promise<CodeActionResult> {
  await requireAdmin()
  const db = createAdminClient()
  const { data, error } = await db.from("member_codes").select("user_id").eq("status", "pending_sync")
  if (error) return { ok: false, message: `Couldn't load pending codes: ${error.message}` }

  let activated = 0
  let failed = 0
  for (const userId of new Set(data.map((row) => row.user_id))) {
    const result = await syncCodes(userId, { retryPending: true })
    activated += result.activated.length
    failed += result.failed.length
  }
  refresh()
  if (failed) return { ok: false, message: `${activated} synced, ${failed} still failing. Check the Fourthwall settings.` }
  return { ok: true, message: activated ? `${activated} code${activated === 1 ? "" : "s"} synced.` : "Nothing was pending." }
}
