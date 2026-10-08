import { describe, expect, it } from "vitest"
import {
  countListItems,
  isNewResource,
  readingMinutes,
  resourceMeta,
  resourceTypeLabel,
} from "./resources"

const list = (...sizes: number[]) => ({
  schemaVersion: 1,
  kind: "tools",
  sections: sizes.map((size, i) => ({
    id: `sec_${i}`,
    title: "Section",
    items: Array.from({ length: size }, (_, j) => ({ id: `itm_${i}_${j}` })),
  })),
})

describe("resourceTypeLabel", () => {
  it("names lists by kind and the other types plainly", () => {
    expect(resourceTypeLabel({ type: "list", listKind: "prompts" })).toBe("Prompts list")
    expect(resourceTypeLabel({ type: "ebook", listKind: null })).toBe("E-book")
    expect(resourceTypeLabel({ type: "guide", listKind: null })).toBe("Guide")
  })
})

describe("countListItems", () => {
  it("sums items across sections", () => {
    expect(countListItems(list(2, 0, 3))).toBe(5)
  })

  it("returns null for anything that is not a list document", () => {
    expect(countListItems(null)).toBeNull()
    expect(countListItems("text")).toBeNull()
    expect(countListItems({ sections: "nope" })).toBeNull()
  })
})

describe("readingMinutes", () => {
  it("rounds to whole minutes at 200 words per minute", () => {
    expect(readingMinutes(Array(1000).fill("word").join(" "))).toBe(5)
  })

  it("never returns less than one minute", () => {
    expect(readingMinutes("## Short")).toBe(1)
    expect(readingMinutes("")).toBe(1)
  })
})

describe("resourceMeta", () => {
  it("counts list items with the kind's unit", () => {
    expect(resourceMeta({ type: "list", listKind: "tools", content: list(18) })).toBe(
      "Tools list · 18 items"
    )
    expect(resourceMeta({ type: "list", listKind: "prompts", content: list(1) })).toBe(
      "Prompts list · 1 prompt"
    )
  })

  it("falls back to the label when the list content is unknown", () => {
    expect(resourceMeta({ type: "list", listKind: "assets" })).toBe("Assets list")
  })

  it("shows reading time for guides and the format for e-books", () => {
    const body = Array(2400).fill("word").join(" ")
    expect(resourceMeta({ type: "guide", listKind: null, bodyMd: body })).toBe("Guide · 12 min")
    expect(resourceMeta({ type: "guide", listKind: null, bodyMd: null })).toBe("Guide")
    expect(resourceMeta({ type: "ebook", listKind: null })).toBe("E-book · PDF")
  })
})

describe("isNewResource", () => {
  const now = new Date("2026-10-15T12:00:00Z")

  it("is new for 14 days after publishing", () => {
    expect(isNewResource("2026-10-02T12:00:01Z", now)).toBe(true)
    expect(isNewResource("2026-10-15T11:00:00Z", now)).toBe(true)
  })

  it("is not new after 14 days, before publishing or without a date", () => {
    expect(isNewResource("2026-10-01T12:00:00Z", now)).toBe(false)
    expect(isNewResource("2026-10-16T00:00:00Z", now)).toBe(false)
    expect(isNewResource(null, now)).toBe(false)
    expect(isNewResource("not a date", now)).toBe(false)
  })
})
