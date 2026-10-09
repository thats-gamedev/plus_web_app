import { describe, expect, it } from "vitest"
import { RATE_LIMIT } from "./flow"
import { handleWithdrawalRequest, type WithdrawalDeps, withdrawalAssessment } from "./withdrawal"

function world() {
  const rows: { id: string; email: string; userId: string | null; verified: boolean; createdAt: string }[] = []
  const receipts: string[] = []
  const deps: WithdrawalDeps = {
    async recentRequests(email) {
      return { sameEmailLastHour: rows.filter((r) => r.email === email).length, allLastMinute: rows.length }
    },
    async findAccount(email) {
      return email === "mara@example.com" ? { userId: "u-mara" } : null
    },
    async insertWithdrawal(row) {
      const r = { id: `w-${rows.length + 1}`, email: row.email, userId: row.userId, verified: row.verified, createdAt: "2026-10-09T12:00:00Z" }
      rows.push(r)
      return { id: r.id, createdAt: r.createdAt }
    },
    async sendReceipt(row) {
      receipts.push(row.email)
    },
  }
  return { deps, rows, receipts }
}

const input = (email: string, sessionUserId: string | null = null) => ({ name: " Mara ", email, reference: null, sessionUserId })

describe("handleWithdrawalRequest", () => {
  it("stores the request and sends the receipt at once, even without an account", async () => {
    const w = world()
    expect((await handleWithdrawalRequest(input("Nobody@Example.com"), w.deps)).status).toBe("received")
    expect(w.receipts).toEqual(["nobody@example.com"])
    expect(w.rows[0]).toMatchObject({ userId: null, verified: false })
  })

  it("links a logged-out request to the matching account, unverified", async () => {
    const w = world()
    await handleWithdrawalRequest(input("mara@example.com"), w.deps)
    expect(w.rows[0]).toMatchObject({ userId: "u-mara", verified: false })
  })

  it("trusts the session over the typed email", async () => {
    const w = world()
    await handleWithdrawalRequest(input("typo@example.com", "u-mara"), w.deps)
    expect(w.rows[0]).toMatchObject({ userId: "u-mara", verified: true })
  })

  it("rate-limits repeated requests", async () => {
    const w = world()
    for (let i = 0; i < RATE_LIMIT.perEmailPerHour; i++) await handleWithdrawalRequest(input("x@example.com"), w.deps)
    expect(await handleWithdrawalRequest(input("x@example.com"), w.deps)).toEqual({ status: "rate_limited" })
    expect(w.receipts).toHaveLength(RATE_LIMIT.perEmailPerHour)
  })
})

describe("withdrawalAssessment", () => {
  const started = "2026-10-01T10:00:00Z"
  it("is within the period for 14 days without a waiver", () => {
    expect(withdrawalAssessment({ startedAt: started, waiverConsentAt: null, receivedAt: "2026-10-15T09:00:00Z" })).toBe("within_period")
  })
  it("notes the waiver", () => {
    expect(withdrawalAssessment({ startedAt: started, waiverConsentAt: started, receivedAt: "2026-10-02T09:00:00Z" })).toBe("waived")
  })
  it("is too late after 14 days", () => {
    expect(withdrawalAssessment({ startedAt: started, waiverConsentAt: null, receivedAt: "2026-10-15T10:00:01Z" })).toBe("too_late")
  })
  it("has nothing to judge without a subscription", () => {
    expect(withdrawalAssessment({ startedAt: null, waiverConsentAt: null, receivedAt: started })).toBe("no_subscription")
  })
})
