import "server-only"
import { cancelAtPeriodEnd } from "@/lib/billing/cancel"
import { LIVE_STATUSES } from "@/lib/billing/status"
import { sendEmailSafely } from "@/lib/email"
import { cancellationReceiptEmail, cancellationVerifyEmail, withdrawalReceiptEmail } from "@/lib/email/templates"
import { getSiteUrl } from "@/lib/site-url"
import { createAdminClient } from "@/lib/supabase/admin"
import type { TablesUpdate } from "@/lib/supabase/database.types"
import type { CancelRequestDeps, ConfirmDeps, StoredRequest } from "./flow"
import type { WithdrawalDeps } from "./withdrawal"

// The real dependencies of lib/cancel/flow.ts and lib/cancel/withdrawal.ts.
// cancellation_requests (both kinds) has no policies for visitors, so
// everything here uses the service role.

const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

/** Requests of any kind, so cancellations and withdrawals share one limit. */
function recentRequests(db: ReturnType<typeof createAdminClient>) {
  return async (email: string) => {
    const [same, all] = await Promise.all([
      db.from("cancellation_requests").select("id").eq("email", email).gt("created_at", ago(3_600_000)),
      db.from("cancellation_requests").select("id").gt("created_at", ago(60_000)),
    ])
    if (same.error || all.error) throw new Error("Couldn't check the rate limit.")
    return { sameEmailLastHour: same.data.length, allLastMinute: all.data.length }
  }
}

export function createCancelRequestDeps(): CancelRequestDeps {
  const db = createAdminClient()
  const update = async (id: string, values: TablesUpdate<"cancellation_requests">) => {
    const { error } = await db.from("cancellation_requests").update(values).eq("id", id)
    if (error) throw new Error(`Couldn't update the cancellation request: ${error.message}`)
  }

  return {
    now: () => new Date(),

    recentRequests: recentRequests(db),

    async insertRequest(row) {
      const { data, error } = await db.from("cancellation_requests").insert(row).select("id, created_at").single()
      if (error) throw new Error(`Couldn't store the cancellation request: ${error.message}`)
      return { id: data.id, createdAt: data.created_at }
    },

    async sendReceipt(row) {
      const result = await sendEmailSafely({
        to: row.email,
        userId: null,
        kind: "cancellation_receipt",
        refId: row.id,
        content: cancellationReceiptEmail({ requestId: row.id, name: row.name, email: row.email, reference: row.reference, receivedAt: row.createdAt }),
      })
      // A failed receipt stays visible in the admin inbox (receipt_sent_at empty).
      if (result === "sent") await update(row.id, { receipt_sent_at: new Date().toISOString() })
    },

    async findMember(email) {
      const { data: profile } = await db.from("profiles").select("id, email").eq("email", email).maybeSingle()
      if (!profile) return null
      const { data: subs } = await db.from("subscriptions").select("id").eq("user_id", profile.id).in("status", [...LIVE_STATUSES])
      return subs?.length ? { userId: profile.id, email: profile.email } : null
    },

    cancelForUser: cancelAtPeriodEnd,

    async markExecuted(id, userId) {
      await update(id, { status: "executed", user_id: userId, executed_at: new Date().toISOString() })
    },

    async saveToken(id, userId, hash, expiresAt) {
      await update(id, { user_id: userId, token_hash: hash, token_expires_at: expiresAt })
    },

    async sendVerifyLink({ to, token, expiresAt, requestId, userId }) {
      await sendEmailSafely({
        to,
        userId,
        kind: "cancellation_verify",
        refId: requestId,
        content: cancellationVerifyEmail({ confirmUrl: `${await getSiteUrl()}/cancel/confirm?token=${token}`, expiresAt }),
      })
    },

    async linkUser(id, userId) {
      await update(id, { user_id: userId })
    },
  }
}

export function createWithdrawalDeps(): WithdrawalDeps {
  const db = createAdminClient()
  return {
    recentRequests: recentRequests(db),

    async findAccount(email) {
      const { data } = await db.from("profiles").select("id").eq("email", email).maybeSingle()
      return data ? { userId: data.id } : null
    },

    async insertWithdrawal({ name, email, reference, userId, verified }) {
      const { data, error } = await db
        .from("cancellation_requests")
        .insert({ kind: "withdrawal", name, email, reference, user_id: userId, verified_at: verified ? new Date().toISOString() : null })
        .select("id, created_at")
        .single()
      if (error) throw new Error(`Couldn't store the withdrawal: ${error.message}`)
      return { id: data.id, createdAt: data.created_at }
    },

    async sendReceipt(row) {
      const result = await sendEmailSafely({
        to: row.email,
        userId: null,
        kind: "withdrawal_receipt",
        refId: row.id,
        content: withdrawalReceiptEmail({ requestId: row.id, name: row.name, email: row.email, reference: row.reference, receivedAt: row.createdAt }),
      })
      if (result === "sent") {
        await db.from("cancellation_requests").update({ receipt_sent_at: new Date().toISOString() }).eq("id", row.id)
      }
    },
  }
}

export function createConfirmDeps(): ConfirmDeps {
  const db = createAdminClient()
  return {
    now: () => new Date(),

    async findByTokenHash(hash): Promise<StoredRequest | null> {
      const { data } = await db
        .from("cancellation_requests")
        .select("id, user_id, status, token_expires_at, executed_at, created_at")
        .eq("token_hash", hash)
        .eq("kind", "cancellation")
        .maybeSingle()
      if (!data) return null
      return {
        id: data.id,
        userId: data.user_id,
        status: data.status,
        tokenExpiresAt: data.token_expires_at,
        executedAt: data.executed_at,
        createdAt: data.created_at,
      }
    },

    cancelForUser: cancelAtPeriodEnd,

    async markVerifiedAndExecuted(id) {
      const now = new Date().toISOString()
      const { error } = await db
        .from("cancellation_requests")
        .update({ status: "executed", verified_at: now, executed_at: now })
        .eq("id", id)
      if (error) throw new Error(`Couldn't update the cancellation request: ${error.message}`)
    },

    async accessEndsAt(userId) {
      const { data } = await db
        .from("subscriptions")
        .select("current_period_end")
        .eq("user_id", userId)
        .order("current_period_end", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle()
      return data?.current_period_end ?? null
    },
  }
}
