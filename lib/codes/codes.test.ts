import { describe, expect, it } from "vitest"
import { CODE_ALPHABET, generateCode, isMemberCode } from "./generate"
import { type CodeStore, type LiveCode, type ShopPromotions, syncMemberCodes } from "./sync"

type Row = LiveCode & { userId: string; percent: number; revoked: boolean }

/** In-memory CodeStore that enforces the same unique indexes as the database. */
function fakeStore(initial: { plus: boolean }) {
  const rows: Row[] = []
  let plus = initial.plus
  let nextId = 1

  const store: CodeStore = {
    async isPlus() {
      return plus
    },
    async listLiveCodes(userId) {
      return rows
        .filter((r) => r.userId === userId && !r.revoked)
        .map(({ id, kind, code, status, externalId }) => ({ id, kind, code, status, externalId }))
    },
    async insertCode(row) {
      const taken = rows.some((r) => r.code === row.code)
      const liveOfKind = rows.some((r) => r.userId === row.userId && r.kind === row.kind && !r.revoked)
      if (taken || liveOfKind) return "duplicate"
      const id = `code_${nextId++}`
      rows.push({ ...row, id, externalId: null, revoked: false })
      return { id }
    },
    async markActive(id, externalId) {
      const row = rows.find((r) => r.id === id)!
      row.status = "active"
      row.externalId = externalId
    },
    async markRevoked(id) {
      rows.find((r) => r.id === id)!.revoked = true
    },
  }

  return { store, rows, setPlus: (value: boolean) => (plus = value) }
}

function fakeShop({ failCreate = false, failEnd = false } = {}) {
  const promotions = new Map<string, { code: string; percent: number; ended: boolean }>()
  const shop: ShopPromotions & { failCreate: boolean; failEnd: boolean } = {
    failCreate,
    failEnd,
    async createPromotion(code, percent) {
      if (shop.failCreate) throw new Error("Fourthwall is down")
      const id = `promo_${promotions.size + 1}`
      promotions.set(id, { code, percent, ended: false })
      return id
    },
    async endPromotion(id) {
      if (shop.failEnd) throw new Error("Fourthwall is down")
      promotions.get(id)!.ended = true
    },
  }
  return { shop, promotions }
}

/** Deterministic bytes: each call yields the next values from a counter. */
function counterBytes(start = 0) {
  let n = start
  return (length: number) => Uint8Array.from({ length }, () => n++ % 256)
}

describe("generateCode", () => {
  it("uses the prefix per kind and six characters from the safe alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const merch = generateCode("merch")
      const promo = generateCode("promotion")
      expect(merch).toMatch(/^TGD-MERCH-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/)
      expect(promo).toMatch(/^TGD-PROMO-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/)
      expect(isMemberCode(merch) && isMemberCode(promo)).toBe(true)
    }
  })

  it("never uses look-alike characters", () => {
    expect(CODE_ALPHABET).not.toMatch(/[01ILO]/)
  })

  it("skips bytes that would bias the distribution", () => {
    // 248 is the first byte at or above the cut-off (256 - 256 % 31 = 248).
    const bytes = () => Uint8Array.from([255, 250, 248, 0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(generateCode("merch", bytes)).toBe("TGD-MERCH-234567")
  })

  it("rejects malformed codes", () => {
    expect(isMemberCode("TGD-MERCH-7K4Q9")).toBe(false)
    expect(isMemberCode("TGD-MERCH-7K4Q9O")).toBe(false)
    expect(isMemberCode("tgd-merch-7k4q9x")).toBe(false)
  })
})

describe("syncMemberCodes", () => {
  it("gives a new member an active merch and promotion code", async () => {
    const { store, rows } = fakeStore({ plus: true })
    const { shop, promotions } = fakeShop()

    const result = await syncMemberCodes("u1", { store, shop })

    expect(result).toEqual({ created: ["merch", "promotion"], activated: ["merch"], revoked: [], failed: [] })
    const merch = rows.find((r) => r.kind === "merch")!
    expect(merch.status).toBe("active")
    expect(promotions.get(merch.externalId!)).toEqual({ code: merch.code, percent: 15, ended: false })
    expect(rows.find((r) => r.kind === "promotion")).toMatchObject({ status: "active", percent: 10, externalId: null })
  })

  it("is idempotent", async () => {
    const { store, rows } = fakeStore({ plus: true })
    const { shop, promotions } = fakeShop()

    await syncMemberCodes("u1", { store, shop })
    const second = await syncMemberCodes("u1", { store, shop })

    expect(second).toEqual({ created: [], activated: [], revoked: [], failed: [] })
    expect(rows).toHaveLength(2)
    expect(promotions.size).toBe(1)
  })

  it("leaves the merch code pending when Fourthwall fails, and the retry activates it", async () => {
    const { store, rows } = fakeStore({ plus: true })
    const { shop } = fakeShop({ failCreate: true })

    const first = await syncMemberCodes("u1", { store, shop })
    expect(first.failed).toEqual(["merch"])
    expect(rows.find((r) => r.kind === "merch")!.status).toBe("pending_sync")
    expect(rows.find((r) => r.kind === "promotion")!.status).toBe("active")

    // A normal (webhook) run doesn't touch codes an earlier run left pending.
    shop.failCreate = false
    expect((await syncMemberCodes("u1", { store, shop })).activated).toEqual([])

    const retry = await syncMemberCodes("u1", { store, shop }, { retryPending: true })
    expect(retry.activated).toEqual(["merch"])
    expect(rows.find((r) => r.kind === "merch")!.status).toBe("active")
  })

  it("lets only one of two concurrent runs create codes", async () => {
    const { store, rows } = fakeStore({ plus: true })
    const { shop, promotions } = fakeShop()

    await Promise.all([syncMemberCodes("u1", { store, shop }), syncMemberCodes("u1", { store, shop })])

    expect(rows).toHaveLength(2)
    expect(promotions.size).toBe(1)
  })

  it("retries with a new code when the code string is already taken", async () => {
    const { store, rows } = fakeStore({ plus: true })
    const { shop } = fakeShop()
    // Same bytes for two users: the second user's first attempt collides.
    await syncMemberCodes("u1", { store, shop, randomBytes: counterBytes() })
    await syncMemberCodes("u2", { store, shop, randomBytes: counterBytes() })

    expect(rows.filter((r) => r.userId === "u2")).toHaveLength(2)
    expect(new Set(rows.map((r) => r.code)).size).toBe(4)
  })

  it("revokes both codes and ends the Fourthwall promotion when the membership ends", async () => {
    const { store, rows, setPlus } = fakeStore({ plus: true })
    const { shop, promotions } = fakeShop()
    await syncMemberCodes("u1", { store, shop })

    setPlus(false)
    const result = await syncMemberCodes("u1", { store, shop })

    expect(result.revoked).toEqual(["merch", "promotion"])
    expect(rows.every((r) => r.revoked)).toBe(true)
    expect([...promotions.values()].every((p) => p.ended)).toBe(true)
  })

  it("keeps the merch code live if Fourthwall can't end the promotion, then revokes on retry", async () => {
    const { store, rows, setPlus } = fakeStore({ plus: true })
    const { shop } = fakeShop()
    await syncMemberCodes("u1", { store, shop })
    setPlus(false)

    shop.failEnd = true
    const first = await syncMemberCodes("u1", { store, shop })
    expect(first).toMatchObject({ revoked: ["promotion"], failed: ["merch"] })
    expect(rows.find((r) => r.kind === "merch")!.revoked).toBe(false)

    shop.failEnd = false
    expect((await syncMemberCodes("u1", { store, shop })).revoked).toEqual(["merch"])
  })

  it("revokes a pending merch code without calling Fourthwall", async () => {
    const { store, rows, setPlus } = fakeStore({ plus: true })
    const { shop } = fakeShop({ failCreate: true })
    await syncMemberCodes("u1", { store, shop })
    setPlus(false)
    shop.failEnd = true // would fail if it were called

    expect((await syncMemberCodes("u1", { store, shop })).revoked).toEqual(["merch", "promotion"])
    expect(rows.every((r) => r.revoked)).toBe(true)
  })

  it("issues new codes when a member rejoins; old ones stay revoked", async () => {
    const { store, rows, setPlus } = fakeStore({ plus: true })
    const { shop } = fakeShop()
    await syncMemberCodes("u1", { store, shop })
    const oldCodes = rows.map((r) => r.code)
    setPlus(false)
    await syncMemberCodes("u1", { store, shop })

    setPlus(true)
    await syncMemberCodes("u1", { store, shop })

    const live = rows.filter((r) => !r.revoked)
    expect(live).toHaveLength(2)
    expect(live.some((r) => oldCodes.includes(r.code))).toBe(false)
  })

  it("does nothing for a user who never was a member", async () => {
    const { store, rows } = fakeStore({ plus: false })
    const { shop } = fakeShop()
    expect(await syncMemberCodes("u1", { store, shop })).toEqual({ created: [], activated: [], revoked: [], failed: [] })
    expect(rows).toHaveLength(0)
  })
})
