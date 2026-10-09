import { describe, expect, it } from "vitest"
import { newListId, SLUG_PATTERN, slugify, uniqueSlug } from "./slug"

describe("slugify", () => {
  it("lowercases, drops punctuation and joins words with dashes", () => {
    expect(slugify("25 Texturing tools — we actually use!")).toBe("25-texturing-tools-we-actually-use")
    expect(slugify("  --Godot creators--  ")).toBe("godot-creators")
  })

  it("transliterates umlauts and accents", () => {
    expect(slugify("Größere Übungen für Künstler")).toBe("groessere-uebungen-fuer-kuenstler")
    expect(slugify("Café rendering")).toBe("cafe-rendering")
  })

  it("always matches the database slug check, or is empty", () => {
    for (const title of ["Hello", "a  b", "C# & C++", "x".repeat(200), "!!!"]) {
      const slug = slugify(title)
      expect(slug === "" || SLUG_PATTERN.test(slug)).toBe(true)
      expect(slug.length).toBeLessThanOrEqual(80)
    }
  })
})

describe("uniqueSlug", () => {
  it("adds a number when the slug is taken", () => {
    expect(uniqueSlug("tools", new Set())).toBe("tools")
    expect(uniqueSlug("tools", new Set(["tools", "tools-2"]))).toBe("tools-3")
    expect(uniqueSlug("", new Set())).toBe("untitled")
  })
})

describe("newListId", () => {
  it("makes ids the list schema accepts", () => {
    expect(newListId("sec")).toMatch(/^sec_[0-9A-Za-z_]+$/)
    expect(newListId("itm")).toMatch(/^itm_[0-9A-Za-z_]{10}$/)
    expect(newListId("itm", () => 0)).toBe("itm_0000000000")
  })
})
