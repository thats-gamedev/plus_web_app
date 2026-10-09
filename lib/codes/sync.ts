import { CODE_KINDS, CODE_PERCENT, type CodeKind, generateCode, type RandomBytes } from "./generate"

// Member code lifecycle (spec, "Code design"), independent of Supabase and
// Fourthwall so it can be unit-tested with fakes. lib/codes/store.ts and
// lib/fourthwall/platform.ts provide the real implementations.
//
//   member      → one live merch and one live promotion code
//   not member  → every live code revoked (merch: Fourthwall promotion ended first)
//
// The merch code only works once Fourthwall knows it, so it starts as
// pending_sync and becomes active when the promotion exists. If Fourthwall
// is down, it stays pending and the cron retries.

export type LiveCode = {
  id: string
  kind: CodeKind
  code: string
  status: "active" | "pending_sync"
  externalId: string | null
}

export type CodeStore = {
  isPlus(userId: string): Promise<boolean>
  /** Codes with status active or pending_sync. */
  listLiveCodes(userId: string): Promise<LiveCode[]>
  /**
   * Inserts a live code. "duplicate" means a unique index refused it: the
   * code string is taken, or the user already has a live code of this kind.
   */
  insertCode(row: {
    userId: string
    kind: CodeKind
    code: string
    percent: number
    status: LiveCode["status"]
  }): Promise<{ id: string } | "duplicate">
  markActive(id: string, externalId: string | null): Promise<void>
  markRevoked(id: string): Promise<void>
}

export type ShopPromotions = {
  /** Creates the Fourthwall discount code; returns the promotion id. */
  createPromotion(code: string, percent: number): Promise<string>
  endPromotion(promotionId: string): Promise<void>
}

export type CodeSyncDeps = {
  store: CodeStore
  shop: ShopPromotions
  randomBytes?: RandomBytes
  log?: (message: string, details: Record<string, unknown>) => void
}

export type CodeSyncResult = {
  created: CodeKind[]
  activated: CodeKind[]
  revoked: CodeKind[]
  /** Codes left pending_sync or still live because Fourthwall failed. */
  failed: CodeKind[]
}

const MAX_CODE_ATTEMPTS = 5

/**
 * Brings a user's codes in line with their membership. Idempotent: running
 * it again changes nothing. Fourthwall failures are recorded in `failed`,
 * not thrown; database errors are thrown so the caller can retry.
 *
 * `retryPending` also pushes merch codes that an earlier run left pending.
 * Only the cron and admin retries set it, so two webhook events arriving
 * together can't both create the same Fourthwall promotion.
 */
export async function syncMemberCodes(
  userId: string,
  deps: CodeSyncDeps,
  { retryPending = false } = {}
): Promise<CodeSyncResult> {
  const result: CodeSyncResult = { created: [], activated: [], revoked: [], failed: [] }
  const log = deps.log ?? (() => {})

  if (!(await deps.store.isPlus(userId))) {
    for (const code of await deps.store.listLiveCodes(userId)) {
      if (code.kind === "merch" && code.externalId) {
        try {
          await deps.shop.endPromotion(code.externalId)
        } catch (error) {
          // Keep the row live so the next run tries again; revoking it here
          // would leave a working discount at Fourthwall.
          log("Ending Fourthwall promotion failed", { userId, codeId: code.id, error: String(error) })
          result.failed.push(code.kind)
          continue
        }
      }
      await deps.store.markRevoked(code.id)
      result.revoked.push(code.kind)
    }
    return result
  }

  const live = await deps.store.listLiveCodes(userId)
  const toPush: LiveCode[] = retryPending
    ? live.filter((code) => code.kind === "merch" && code.status === "pending_sync")
    : []

  for (const kind of CODE_KINDS) {
    if (live.some((code) => code.kind === kind)) continue
    const created = await createCode(userId, kind, deps)
    if (!created) continue // another run created it at the same time
    result.created.push(kind)
    if (created.status === "pending_sync") toPush.push(created)
  }

  for (const code of toPush) {
    try {
      const promotionId = await deps.shop.createPromotion(code.code, CODE_PERCENT.merch)
      await deps.store.markActive(code.id, promotionId)
      result.activated.push(code.kind)
    } catch (error) {
      log("Creating Fourthwall promotion failed", { userId, codeId: code.id, error: String(error) })
      result.failed.push(code.kind)
    }
  }

  return result
}

/** Inserts a new live code, or returns null if the user already got one. */
async function createCode(userId: string, kind: CodeKind, deps: CodeSyncDeps): Promise<LiveCode | null> {
  // Promotion codes live only in our database; merch codes wait for Fourthwall.
  const status = kind === "merch" ? "pending_sync" : "active"

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateCode(kind, deps.randomBytes)
    const inserted = await deps.store.insertCode({ userId, kind, code, percent: CODE_PERCENT[kind], status })
    if (inserted !== "duplicate") return { id: inserted.id, kind, code, status, externalId: null }
    // Either a concurrent run won (stop) or the code string collided (retry).
    if ((await deps.store.listLiveCodes(userId)).some((c) => c.kind === kind)) return null
  }
  throw new Error(`Could not generate a unique ${kind} code after ${MAX_CODE_ATTEMPTS} attempts`)
}
