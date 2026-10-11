import { describe, expect, it } from "vitest"
import { fetchAll } from "./fetch-all"

const source = Array.from({ length: 7 }, (_, i) => i)

describe("fetchAll", () => {
  it("reads every page until a short one", async () => {
    const calls: [number, number][] = []
    const rows = await fetchAll(async (from, to) => {
      calls.push([from, to])
      return { data: source.slice(from, to + 1), error: null }
    }, 3)
    expect(rows).toEqual(source)
    expect(calls).toEqual([[0, 2], [3, 5], [6, 8]])
  })

  it("asks once more after an exactly full last page", async () => {
    const rows = await fetchAll(async (from, to) => ({ data: source.slice(0, 6).slice(from, to + 1), error: null }), 3)
    expect(rows).toHaveLength(6)
  })

  it("throws instead of returning a partial list", async () => {
    await expect(
      fetchAll(async (from) => (from === 0 ? { data: [1, 2, 3], error: null } : { data: null, error: { message: "boom" } }), 3)
    ).rejects.toThrow("boom")
  })
})
