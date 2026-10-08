import { describe, expect, it } from "vitest"
import {
  defaultFilters,
  hasActiveFilters,
  libraryHref,
  parseLibraryFilters,
  searchPattern,
  SEARCH_MAX_LENGTH,
} from "./library-filters"

describe("parseLibraryFilters", () => {
  it("reads known values", () => {
    expect(
      parseLibraryFilters({ q: "  unity ", type: "list", kind: "tools", category: "3d", sort: "az" })
    ).toEqual({ q: "unity", type: "list", kind: "tools", category: "3d", sort: "az" })
  })

  it("falls back to All for unknown or repeated values", () => {
    expect(parseLibraryFilters({ type: "video", kind: "maps", category: "x", sort: "oldest" })).toEqual(
      defaultFilters
    )
    expect(parseLibraryFilters({ type: ["guide", "list"] }).type).toBe("guide")
  })

  it("drops a kind that contradicts the type", () => {
    expect(parseLibraryFilters({ type: "ebook", kind: "tools" })).toMatchObject({ type: "ebook", kind: null })
  })

  it("caps the search length", () => {
    expect(parseLibraryFilters({ q: "a".repeat(500) }).q).toHaveLength(SEARCH_MAX_LENGTH)
  })
})

describe("libraryHref", () => {
  it("leaves defaults out of the URL", () => {
    expect(libraryHref(defaultFilters)).toBe("/app/library")
    expect(libraryHref(defaultFilters, { sort: "az" })).toBe("/app/library?sort=az")
  })

  it("keeps the other filters when one changes", () => {
    const current = { ...defaultFilters, q: "blender", category: "3d" as const }
    expect(libraryHref(current, { type: "guide" })).toBe("/app/library?q=blender&type=guide&category=3d")
  })

  it("clears the kind when switching to a non-list type", () => {
    const current = { ...defaultFilters, type: "list" as const, kind: "prompts" as const }
    expect(libraryHref(current, { type: "ebook" })).toBe("/app/library?type=ebook")
  })

  it("switches a non-list type back to All when a kind is picked", () => {
    const current = { ...defaultFilters, type: "guide" as const }
    expect(libraryHref(current, { kind: "tools" })).toBe("/app/library?kind=tools")
  })

  it("resets a filter with null", () => {
    const current = { ...defaultFilters, category: "ai" as const, sort: "az" as const }
    expect(libraryHref(current, { category: null })).toBe("/app/library?sort=az")
  })
})

describe("hasActiveFilters", () => {
  it("ignores the sort order", () => {
    expect(hasActiveFilters({ ...defaultFilters, sort: "az" })).toBe(false)
    expect(hasActiveFilters({ ...defaultFilters, q: "x" })).toBe(true)
  })
})

describe("searchPattern", () => {
  it("wraps the text in wildcards", () => {
    expect(searchPattern("unity 6.1")).toBe("*unity 6.1*")
  })

  it("neutralises PostgREST and LIKE syntax", () => {
    expect(searchPattern("a,b)or(title.eq.x%_*\"\\")).toBe("*a b or title.eq.x*")
  })

  it("returns null when nothing is left", () => {
    expect(searchPattern("  ,() ")).toBeNull()
  })
})
