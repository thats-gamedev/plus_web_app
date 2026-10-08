import { describe, expect, it } from "vitest"
import { isNewResource, readingMinutes, resourceMeta, resourceSize, resourceTypeLabel } from "./resources"

const noCounts = { itemCount: null, wordCount: null }

describe("resourceTypeLabel", () => {
  it("names lists by kind and the other types plainly", () => {
    expect(resourceTypeLabel({ type: "list", listKind: "prompts" })).toBe("Prompts list")
    expect(resourceTypeLabel({ type: "ebook", listKind: null })).toBe("E-book")
    expect(resourceTypeLabel({ type: "guide", listKind: null })).toBe("Guide")
  })
})

describe("readingMinutes", () => {
  it("rounds to whole minutes at 200 words per minute", () => {
    expect(readingMinutes(1000)).toBe(5)
    expect(readingMinutes(2400)).toBe(12)
  })

  it("never returns less than one minute", () => {
    expect(readingMinutes(20)).toBe(1)
    expect(readingMinutes(0)).toBe(1)
  })
})

describe("resourceSize", () => {
  it("counts list items with the kind's unit", () => {
    expect(resourceSize({ type: "list", listKind: "tools", itemCount: 18, wordCount: null })).toBe("18 items")
    expect(resourceSize({ type: "list", listKind: "prompts", itemCount: 1, wordCount: null })).toBe("1 prompt")
    expect(resourceSize({ type: "list", listKind: "creators", itemCount: 0, wordCount: null })).toBe("0 creators")
  })

  it("shows reading time for guides and the format for e-books", () => {
    expect(resourceSize({ type: "guide", listKind: null, itemCount: null, wordCount: 2400 })).toBe("12 min read")
    expect(resourceSize({ type: "ebook", listKind: null, ...noCounts })).toBe("PDF")
  })

  it("is null when the count is unknown", () => {
    expect(resourceSize({ type: "list", listKind: "assets", ...noCounts })).toBeNull()
    expect(resourceSize({ type: "guide", listKind: null, ...noCounts })).toBeNull()
  })
})

describe("resourceMeta", () => {
  it("joins the type label and the size", () => {
    expect(resourceMeta({ type: "list", listKind: "tools", itemCount: 18, wordCount: null })).toBe(
      "Tools list · 18 items"
    )
    expect(resourceMeta({ type: "ebook", listKind: null, ...noCounts })).toBe("E-book · PDF")
  })

  it("falls back to the label when the size is unknown", () => {
    expect(resourceMeta({ type: "list", listKind: "assets", ...noCounts })).toBe("Assets list")
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
