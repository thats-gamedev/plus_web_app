import { createHash, randomBytes } from "node:crypto"

// Statutory cancellation (§ 312k BGB, spec "Cancellation: two entry points").
// Independent of Next, Supabase and Stripe so the token flow is unit-tested;
// app/cancel/actions.ts wires the real dependencies.
//
//   1. Every request is stored and the receipt goes out immediately.
//   2. Logged in: the member's own membership is cancelled at period end now.
//   3. Otherwise, if the email belongs to an active membership, a
//      single-use link (7 days) goes to that account's address.
//   4. Otherwise the request waits in the admin inbox.
// Logged-out visitors always get the same answer, so the form can't be used
// to find out who is a member.

export const TOKEN_DAYS = 7
export const RATE_LIMIT = { perEmailPerHour: 3, perMinute: 30 } as const

export function createToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url")
  return { token, hash: hashToken(token) }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export type CancelOutcome = { ok: true; endsAt: string | null } | { ok: false; message: string }

export type CancelRequestDeps = {
  now(): Date
  /** Requests for this email in the last hour, and from anyone in the last minute. */
  recentRequests(email: string): Promise<{ sameEmailLastHour: number; allLastMinute: number }>
  insertRequest(row: { name: string; email: string; reference: string | null }): Promise<{ id: string; createdAt: string }>
  sendReceipt(row: { id: string; name: string; email: string; reference: string | null; createdAt: string }): Promise<void>
  /** The account behind this email, if it has a live membership. */
  findMember(email: string): Promise<{ userId: string; email: string } | null>
  cancelForUser(userId: string): Promise<CancelOutcome>
  markExecuted(requestId: string, userId: string): Promise<void>
  saveToken(requestId: string, userId: string, hash: string, expiresAt: string): Promise<void>
  sendVerifyLink(link: { to: string; token: string; expiresAt: string; requestId: string; userId: string }): Promise<void>
  /** Links the request to an account without changing its status (for the inbox). */
  linkUser(requestId: string, userId: string): Promise<void>
}

export type CancelRequestInput = { name: string; email: string; reference: string | null; sessionUserId: string | null }

export type CancelRequestResult =
  | { status: "rate_limited" }
  /** Logged in and cancelled right away. */
  | { status: "cancelled"; requestId: string; endsAt: string | null; receivedAt: string }
  /** Receipt sent; a link may have been sent too (not revealed). */
  | { status: "received"; requestId: string; receivedAt: string }

export async function handleCancellationRequest(input: CancelRequestInput, deps: CancelRequestDeps): Promise<CancelRequestResult> {
  const email = input.email.trim().toLowerCase()
  const recent = await deps.recentRequests(email)
  if (recent.sameEmailLastHour >= RATE_LIMIT.perEmailPerHour || recent.allLastMinute >= RATE_LIMIT.perMinute) {
    return { status: "rate_limited" }
  }

  const request = await deps.insertRequest({ name: input.name.trim(), email, reference: input.reference })
  await deps.sendReceipt({ ...request, name: input.name.trim(), email, reference: input.reference })

  if (input.sessionUserId) {
    const result = await deps.cancelForUser(input.sessionUserId)
    if (result.ok) {
      await deps.markExecuted(request.id, input.sessionUserId)
      return { status: "cancelled", requestId: request.id, endsAt: result.endsAt, receivedAt: request.createdAt }
    }
    // No live membership on this account: let the admin look at it.
    await deps.linkUser(request.id, input.sessionUserId)
    return { status: "received", requestId: request.id, receivedAt: request.createdAt }
  }

  const member = await deps.findMember(email)
  if (member) {
    const { token, hash } = createToken()
    const expiresAt = new Date(deps.now().getTime() + TOKEN_DAYS * 86_400_000).toISOString()
    await deps.saveToken(request.id, member.userId, hash, expiresAt)
    await deps.sendVerifyLink({ to: member.email, token, expiresAt, requestId: request.id, userId: member.userId })
  }
  return { status: "received", requestId: request.id, receivedAt: request.createdAt }
}

export type StoredRequest = {
  id: string
  userId: string | null
  status: "received" | "verified" | "executed" | "no_match" | "declined"
  tokenExpiresAt: string | null
  executedAt: string | null
  createdAt: string
}

export type ConfirmDeps = {
  now(): Date
  findByTokenHash(hash: string): Promise<StoredRequest | null>
  cancelForUser(userId: string): Promise<CancelOutcome>
  markVerifiedAndExecuted(requestId: string): Promise<void>
  /** End of access for an already executed request, for the "already done" page. */
  accessEndsAt(userId: string): Promise<string | null>
}

export type ConfirmResult =
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "already_done"; requestId: string; endsAt: string | null; receivedAt: string }
  | { status: "cancelled"; requestId: string; endsAt: string | null; receivedAt: string }
  | { status: "failed"; message: string }

type TokenCheck =
  | Extract<ConfirmResult, { status: "invalid" | "expired" | "already_done" }>
  | { status: "pending"; request: StoredRequest & { userId: string } }

/**
 * What the link would do, without doing it. /cancel/confirm shows the
 * confirm button only for "pending"; opening the link changes nothing, so
 * mail scanners that prefetch links can't cancel a membership.
 */
export async function checkToken(token: string, deps: Pick<ConfirmDeps, "now" | "findByTokenHash" | "accessEndsAt">): Promise<TokenCheck> {
  if (!/^[\w-]{20,100}$/.test(token)) return { status: "invalid" }
  const request = await deps.findByTokenHash(hashToken(token))
  if (!request || !request.userId) return { status: "invalid" }

  if (request.status === "executed") {
    return { status: "already_done", requestId: request.id, endsAt: await deps.accessEndsAt(request.userId), receivedAt: request.createdAt }
  }
  if (!request.tokenExpiresAt || Date.parse(request.tokenExpiresAt) < deps.now().getTime()) return { status: "expired" }
  return { status: "pending", request: { ...request, userId: request.userId } }
}

/** The confirm button behind the emailed link. Single use. */
export async function confirmCancellation(token: string, deps: ConfirmDeps): Promise<ConfirmResult> {
  const check = await checkToken(token, deps)
  if (check.status !== "pending") return check
  const { request } = check

  const result = await deps.cancelForUser(request.userId)
  if (!result.ok) return { status: "failed", message: result.message }
  await deps.markVerifiedAndExecuted(request.id)
  return { status: "cancelled", requestId: request.id, endsAt: result.endsAt, receivedAt: request.createdAt }
}
