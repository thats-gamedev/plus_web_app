import { describe, expect, it } from "vitest"
import {
  type CancelRequestDeps,
  type ConfirmDeps,
  checkToken,
  confirmCancellation,
  handleCancellationRequest,
  hashToken,
  RATE_LIMIT,
  type StoredRequest,
} from "./flow"

const NOW = new Date("2026-10-09T12:00:00Z")

/** In-memory world: one member (mara) with a live membership, Stripe and the outbox. */
function world() {
  const requests: (StoredRequest & { email: string; tokenHash: string | null })[] = []
  const outbox: { kind: string; to: string; token?: string }[] = []
  const cancelled: string[] = []
  const members = new Map([["mara@example.com", { userId: "u-mara", email: "mara@example.com", endsAt: "2026-11-08T00:00:00Z" }]])
  let now = NOW

  const cancelForUser = async (userId: string) => {
    const m = [...members.values()].find((x) => x.userId === userId)
    if (!m) return { ok: false as const, message: "There is no active membership to cancel." }
    cancelled.push(userId)
    return { ok: true as const, endsAt: m.endsAt }
  }

  const deps: CancelRequestDeps = {
    now: () => now,
    async recentRequests(email) {
      const hour = now.getTime() - 3_600_000
      const minute = now.getTime() - 60_000
      return {
        sameEmailLastHour: requests.filter((r) => r.email === email && Date.parse(r.createdAt) > hour).length,
        allLastMinute: requests.filter((r) => Date.parse(r.createdAt) > minute).length,
      }
    },
    async insertRequest(row) {
      const r = { id: `req-${requests.length + 1}`, userId: null, status: "received" as const, tokenExpiresAt: null, executedAt: null, createdAt: now.toISOString(), email: row.email, tokenHash: null }
      requests.push(r)
      return { id: r.id, createdAt: r.createdAt }
    },
    async sendReceipt(row) {
      outbox.push({ kind: "receipt", to: row.email })
    },
    async findMember(email) {
      const m = members.get(email)
      return m ? { userId: m.userId, email: m.email } : null
    },
    cancelForUser,
    async markExecuted(id, userId) {
      Object.assign(requests.find((r) => r.id === id)!, { status: "executed", userId, executedAt: now.toISOString() })
    },
    async saveToken(id, userId, hash, expiresAt) {
      Object.assign(requests.find((r) => r.id === id)!, { userId, tokenHash: hash, tokenExpiresAt: expiresAt })
    },
    async sendVerifyLink({ to, token }) {
      outbox.push({ kind: "verify", to, token })
    },
    async linkUser(id, userId) {
      requests.find((r) => r.id === id)!.userId = userId
    },
  }

  const confirmDeps: ConfirmDeps = {
    now: () => now,
    async findByTokenHash(hash) {
      return requests.find((r) => r.tokenHash === hash) ?? null
    },
    cancelForUser,
    async markVerifiedAndExecuted(id) {
      Object.assign(requests.find((r) => r.id === id)!, { status: "executed", executedAt: now.toISOString() })
    },
    async accessEndsAt(userId) {
      return [...members.values()].find((m) => m.userId === userId)?.endsAt ?? null
    },
  }

  return { deps, confirmDeps, requests, outbox, cancelled, setNow: (d: Date) => (now = d) }
}

const request = (email: string, sessionUserId: string | null = null) => ({ name: "Mara M.", email, reference: null, sessionUserId })

describe("handleCancellationRequest", () => {
  it("always sends the receipt immediately", async () => {
    const w = world()
    await handleCancellationRequest(request("nobody@example.com"), w.deps)
    expect(w.outbox).toEqual([{ kind: "receipt", to: "nobody@example.com" }])
  })

  it("cancels at once for a logged-in member", async () => {
    const w = world()
    const result = await handleCancellationRequest(request("whatever@example.com", "u-mara"), w.deps)
    expect(result).toMatchObject({ status: "cancelled", endsAt: "2026-11-08T00:00:00Z" })
    expect(w.cancelled).toEqual(["u-mara"])
    expect(w.requests[0]).toMatchObject({ status: "executed", userId: "u-mara" })
  })

  it("emails a single-use link when the address belongs to a member", async () => {
    const w = world()
    const result = await handleCancellationRequest(request(" Mara@Example.com "), w.deps)
    expect(result.status).toBe("received")
    expect(w.outbox.map((m) => `${m.kind}:${m.to}`)).toEqual(["receipt:mara@example.com", "verify:mara@example.com"])
    expect(w.cancelled).toEqual([]) // nothing happens before the click
    // Only the hash is stored.
    expect(w.requests[0].tokenHash).toBe(hashToken(w.outbox[1].token!))
    expect(w.requests[0].tokenExpiresAt).toBe("2026-10-16T12:00:00.000Z")
  })

  it("leaves a foreign email for the admin, without a link or a hint", async () => {
    const w = world()
    const member = await handleCancellationRequest(request("mara@example.com"), w.deps)
    const foreign = await handleCancellationRequest(request("stranger@example.com"), w.deps)
    expect(Object.keys(member).sort()).toEqual(Object.keys(foreign).sort())
    expect(foreign.status).toBe("received")
    expect(w.outbox.filter((m) => m.to === "stranger@example.com").map((m) => m.kind)).toEqual(["receipt"])
    expect(w.requests[1]).toMatchObject({ status: "received", userId: null, tokenHash: null })
  })

  it("rate-limits repeated requests for the same email", async () => {
    const w = world()
    for (let i = 0; i < RATE_LIMIT.perEmailPerHour; i++) await handleCancellationRequest(request("x@example.com"), w.deps)
    expect(await handleCancellationRequest(request("x@example.com"), w.deps)).toEqual({ status: "rate_limited" })
    w.setNow(new Date(NOW.getTime() + 61 * 60_000))
    expect((await handleCancellationRequest(request("x@example.com"), w.deps)).status).toBe("received")
  })
})

describe("confirmCancellation", () => {
  async function withLink() {
    const w = world()
    await handleCancellationRequest(request("mara@example.com"), w.deps)
    return { w, token: w.outbox.find((m) => m.kind === "verify")!.token! }
  }

  it("cancels with a valid link", async () => {
    const { w, token } = await withLink()
    expect(await confirmCancellation(token, w.confirmDeps)).toMatchObject({ status: "cancelled", endsAt: "2026-11-08T00:00:00Z" })
    expect(w.cancelled).toEqual(["u-mara"])
  })

  it("only looks when the link is opened", async () => {
    const { w, token } = await withLink()
    expect((await checkToken(token, w.confirmDeps)).status).toBe("pending")
    expect(w.cancelled).toEqual([])
  })

  it("changes nothing when the link is used again", async () => {
    const { w, token } = await withLink()
    await confirmCancellation(token, w.confirmDeps)
    expect(await confirmCancellation(token, w.confirmDeps)).toMatchObject({ status: "already_done" })
    expect(w.cancelled).toEqual(["u-mara"])
  })

  it("refuses an expired link", async () => {
    const { w, token } = await withLink()
    w.setNow(new Date(NOW.getTime() + 8 * 86_400_000))
    expect(await confirmCancellation(token, w.confirmDeps)).toEqual({ status: "expired" })
    expect(w.cancelled).toEqual([])
  })

  it("refuses unknown and malformed tokens", async () => {
    const { w } = await withLink()
    expect(await confirmCancellation("a".repeat(43), w.confirmDeps)).toEqual({ status: "invalid" })
    expect(await confirmCancellation("../../etc", w.confirmDeps)).toEqual({ status: "invalid" })
  })
})
