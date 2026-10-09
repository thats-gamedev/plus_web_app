import { describe, expect, it } from "vitest"
import { teaserDocument, teaserItemCount } from "./teaser"

const tool = (id: string) => ({
  id,
  name: id,
  why: "Because.",
  url: "https://example.com",
  pricing: "free",
  isAffiliate: false,
  isTeaser: true,
  addedAt: "2026-10-01",
})

describe("teaserDocument", () => {
  it("groups the teaser rows into sections in list order", () => {
    const doc = teaserDocument("tools", [
      { section_title: "Baking", position: 3, item: tool("itm_3") },
      { section_title: "Painting", position: 1, item: tool("itm_1") },
      { section_title: "Painting", position: 2, item: tool("itm_2") },
    ])
    expect(doc?.sections.map((s) => [s.title, s.items.map((i) => i.id)])).toEqual([
      ["Painting", ["itm_1", "itm_2"]],
      ["Baking", ["itm_3"]],
    ])
    expect(teaserItemCount(doc!)).toBe(3)
  })

  it("is null without rows or with an item the schema rejects", () => {
    expect(teaserDocument("tools", [])).toBeNull()
    expect(teaserDocument("tools", [{ section_title: "A", position: 1, item: { id: "itm_1" } }])).toBeNull()
  })

  it("names an untitled section General", () => {
    expect(teaserDocument("tools", [{ section_title: null, position: 1, item: tool("itm_1") }])?.sections[0].title).toBe("General")
  })
})
