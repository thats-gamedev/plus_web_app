import { describe, expect, it } from "vitest"
import {
  emptyListDocument,
  isNewItem,
  LIST_LIMITS,
  listDocumentSchema,
  promptPlaceholders,
} from "./schema"

const base = {
  why: "Because it is good.",
  isAffiliate: false,
  isTeaser: true,
  addedAt: "2026-10-02",
}

const tool = {
  ...base,
  id: "itm_01",
  name: "Substance 3D Painter",
  url: "https://example.com",
  tags: ["texturing", "pbr"],
  pricing: "subscription",
  platforms: ["windows", "mac"],
}

const asset = {
  ...base,
  id: "itm_02",
  name: "Stylized Nature Pack",
  url: "https://example.com/pack",
  source: "Unity Asset Store",
  price: { amount: 0, currency: "USD" },
  license: "royalty_free",
  engines: ["unity"],
  formats: ["fbx", "png"],
}

const creator = {
  ...base,
  id: "itm_03",
  name: "Example Creator",
  url: "https://youtube.com/@example",
  focus: "3d",
  level: "beginner",
  language: "en",
  primaryPlatform: "youtube",
  links: [
    { platform: "youtube", url: "https://youtube.com/@example", handle: "@example" },
    { platform: "artstation", url: "https://artstation.com/example" },
  ],
}

const prompt = {
  ...base,
  id: "itm_04",
  name: "Prop concept sheet",
  tool: "image",
  prompt: "Concept sheet of a {{prop}} in {{style}} style",
  variables: [{ name: "prop", hint: "e.g. treasure chest" }, { name: "style" }],
}

function doc(kind: string, items: unknown[]) {
  return { schemaVersion: 1, kind, sections: [{ id: "sec_01", title: "General", items }] }
}

function issues(input: unknown) {
  const result = listDocumentSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe("listDocumentSchema", () => {
  it.each([
    ["tools", tool],
    ["assets", asset],
    ["creators", creator],
    ["prompts", prompt],
  ])("accepts a valid %s list", (kind, item) => {
    expect(issues(doc(kind, [item]))).toEqual([])
  })

  it("rejects an item of the wrong kind", () => {
    expect(issues(doc("tools", [asset]))).not.toEqual([])
  })

  it("rejects unknown fields on documents, sections and items", () => {
    expect(issues({ ...doc("tools", [tool]), extra: 1 })).not.toEqual([])
    expect(issues(doc("tools", [{ ...tool, isNew: true }]))).not.toEqual([])
    expect(
      issues({ schemaVersion: 1, kind: "tools", sections: [{ id: "sec_01", title: "A", items: [], x: 1 }] }),
    ).not.toEqual([])
  })

  it("enforces field limits", () => {
    expect(issues(doc("tools", [{ ...tool, name: "x".repeat(81) }]))).not.toEqual([])
    expect(issues(doc("tools", [{ ...tool, why: "x".repeat(281) }]))).not.toEqual([])
    expect(issues(doc("tools", [{ ...tool, tags: ["a", "b", "c", "d", "e", "f", "g"] }]))).not.toEqual([])
    expect(issues(doc("tools", [{ ...tool, tags: ["Texturing"] }]))).not.toEqual([])
    expect(issues(doc("tools", [{ ...tool, url: "javascript:alert(1)" }]))).not.toEqual([])
    expect(issues(doc("tools", [{ ...tool, platforms: ["mac", "mac"] }]))).not.toEqual([])
  })

  it("requires a url on every kind except prompts", () => {
    const toolWithoutUrl: Partial<typeof tool> = { ...tool }
    delete toolWithoutUrl.url
    expect(issues(doc("tools", [toolWithoutUrl]))).not.toEqual([])
    expect(issues(doc("prompts", [{ ...prompt, url: "https://example.com" }]))).not.toEqual([])
  })

  it("allows at most 20 sections", () => {
    const sections = Array.from({ length: LIST_LIMITS.sections + 1 }, (_, i) => ({
      id: `sec_${i}`,
      title: `Section ${i}`,
      items: [],
    }))
    expect(issues({ schemaVersion: 1, kind: "tools", sections })).not.toEqual([])
  })

  it("allows at most 150 items across all sections", () => {
    const items = (from: number, count: number) =>
      Array.from({ length: count }, (_, i) => ({ ...tool, id: `itm_${from + i}` }))
    const sections = [
      { id: "sec_a", title: "A", items: items(0, 100) },
      { id: "sec_b", title: "B", items: items(100, 50) },
    ]
    expect(issues({ schemaVersion: 1, kind: "tools", sections })).toEqual([])
    sections[1].items.push({ ...tool, id: "itm_150" })
    expect(issues({ schemaVersion: 1, kind: "tools", sections })).toContain(
      "A list can hold at most 150 items",
    )
  })

  it("rejects documents of 512 KB or more", () => {
    const items = Array.from({ length: 150 }, (_, i) => ({
      ...prompt,
      id: `itm_${i}`,
      prompt: `{{prop}} {{style}} ${"x".repeat(3900)}`,
    }))
    expect(issues(doc("prompts", items))).toContain("The list is larger than 512 KB")
  })

  it("rejects duplicate ids", () => {
    expect(issues(doc("tools", [tool, tool]))).toContain("Section and item ids must be unique")
  })

  describe("creators", () => {
    it("requires the primary platform to be one of the links", () => {
      expect(issues(doc("creators", [{ ...creator, primaryPlatform: "twitch" }]))).toContain(
        "The primary platform must be one of the links",
      )
    })

    it("requires url to match the primary link", () => {
      expect(issues(doc("creators", [{ ...creator, url: "https://example.com" }]))).toContain(
        "Must match the primary platform's link",
      )
    })

    it("allows each platform once and at most 6 links", () => {
      const twice = [...creator.links, { platform: "youtube", url: "https://youtube.com/@other" }]
      expect(issues(doc("creators", [{ ...creator, links: twice }]))).toContain(
        "Each platform may appear only once",
      )
      const platforms = ["youtube", "instagram", "x", "tiktok", "twitch", "bluesky", "github"]
      const seven = platforms.map((platform) => ({ platform, url: `https://example.com/${platform}` }))
      expect(issues(doc("creators", [{ ...creator, links: seven }]))).not.toEqual([])
    })
  })

  describe("prompts", () => {
    it("requires every placeholder to have a variable", () => {
      expect(issues(doc("prompts", [{ ...prompt, variables: [{ name: "prop" }] }]))).toContain(
        "{{style}} has no variable",
      )
    })

    it("rejects unused and duplicate variables", () => {
      const variables = [...prompt.variables, { name: "mood" }]
      expect(issues(doc("prompts", [{ ...prompt, variables }]))).toContain(
        "mood is not used in the prompt",
      )
      const duplicate = [...prompt.variables, { name: "prop" }]
      expect(issues(doc("prompts", [{ ...prompt, variables: duplicate }]))).toContain(
        "Variable names must be unique",
      )
    })
  })
})

describe("promptPlaceholders", () => {
  it("returns unique names in order of first use", () => {
    expect(promptPlaceholders("{{a}} and {{ b }} then {{a}}")).toEqual(["a", "b"])
  })
})

describe("emptyListDocument", () => {
  it("creates a valid document with one General section", () => {
    const empty = emptyListDocument("creators", "sec_01")
    expect(empty.sections).toEqual([{ id: "sec_01", title: "General", items: [] }])
    expect(listDocumentSchema.safeParse(empty).success).toBe(true)
  })
})

describe("isNewItem", () => {
  const now = new Date("2026-10-15T12:00:00Z")

  it("is true for items added in the last 14 days", () => {
    expect(isNewItem("2026-10-15", now)).toBe(true)
    expect(isNewItem("2026-10-02", now)).toBe(true)
  })

  it("is false for older, future or invalid dates", () => {
    expect(isNewItem("2026-10-01", now)).toBe(false)
    expect(isNewItem("2026-10-16", now)).toBe(false)
    expect(isNewItem("not a date", now)).toBe(false)
  })
})
