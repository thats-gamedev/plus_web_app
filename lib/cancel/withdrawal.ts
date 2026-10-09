import { RATE_LIMIT } from "./flow"

// Withdrawal function (Art. 11a Consumer Rights Directive, § 356a BGB, in
// force since 19 June 2026): "Withdraw from contract here" leads to /withdraw,
// where the consumer gives name, email and contract and clicks "Confirm
// withdrawal". The request is stored and the receipt with its content, date
// and time goes out at once, as the law requires.
//
// Nothing changes automatically: whether the right still applies (14 days,
// or expired early through the § 356 (5) waiver at checkout) is for the admin
// to judge in the inbox, where they refund and end the membership, or decline.

export type WithdrawalDeps = {
  /** Requests (of any kind) for this email in the last hour, and from anyone in the last minute. */
  recentRequests(email: string): Promise<{ sameEmailLastHour: number; allLastMinute: number }>
  /** The account behind this email, member or not. */
  findAccount(email: string): Promise<{ userId: string } | null>
  insertWithdrawal(row: {
    name: string
    email: string
    reference: string | null
    userId: string | null
    /** Sent while logged in to that account. */
    verified: boolean
  }): Promise<{ id: string; createdAt: string }>
  sendReceipt(row: { id: string; name: string; email: string; reference: string | null; createdAt: string; userId: string | null }): Promise<void>
}

export type WithdrawalInput = { name: string; email: string; reference: string | null; sessionUserId: string | null }

export type WithdrawalResult = { status: "rate_limited" } | { status: "received"; requestId: string; receivedAt: string }

export async function handleWithdrawalRequest(input: WithdrawalInput, deps: WithdrawalDeps): Promise<WithdrawalResult> {
  const email = input.email.trim().toLowerCase()
  const name = input.name.trim()
  const recent = await deps.recentRequests(email)
  if (recent.sameEmailLastHour >= RATE_LIMIT.perEmailPerHour || recent.allLastMinute >= RATE_LIMIT.perMinute) {
    return { status: "rate_limited" }
  }

  // Logged in, the request belongs to that account whatever email was typed.
  // Logged out, a matching account is only a hint for the admin.
  const userId = input.sessionUserId ?? (await deps.findAccount(email))?.userId ?? null
  const request = await deps.insertWithdrawal({ name, email, reference: input.reference, userId, verified: Boolean(input.sessionUserId) })
  await deps.sendReceipt({ ...request, name, email, reference: input.reference, userId })
  return { status: "received", requestId: request.id, receivedAt: request.createdAt }
}

export const WITHDRAWAL_DAYS = 14

/**
 * The admin's starting point for a decision: is the request inside the 14
 * days after the contract started, and did the member waive the right?
 * Only a hint; the admin decides.
 */
export function withdrawalAssessment(
  { startedAt, waiverConsentAt, receivedAt }: { startedAt: string | null; waiverConsentAt: string | null; receivedAt: string }
): "no_subscription" | "too_late" | "waived" | "within_period" {
  if (!startedAt) return "no_subscription"
  if (Date.parse(receivedAt) - Date.parse(startedAt) > WITHDRAWAL_DAYS * 86_400_000) return "too_late"
  return waiverConsentAt ? "waived" : "within_period"
}
