import { describe, expect, it } from "vitest"
import {
  assetEngines,
  countItems,
  creatorPlatforms,
  fillPrompt,
  filterSections,
  formatPrice,
  formatTag,
  hintExample,
  toolTags,
} from "./display"
import type { ListDocumentOf } from "./schema"

const tool = (id: string, tags?: string[]) => ({
  id,
  name: id,
  why: "Because.",
  url: "https://example.com",
  pricing: "free" as const,
  isAffiliate: false,
  isTeaser: false,
  addedAt: "2026-10-01",
  tags,
})

const tools: ListDocumentOf<"tools"> = {
  schemaVersion: 1,
  kind: "tools",
  sections: [
    { id: "sec_a", title: "Painting", items: [tool("itm_1", ["pbr", "free"]), tool("itm_2", ["pbr"])] },
    { id: "sec_b", title: "Baking", items: [tool("itm_3", ["baking"]), tool("itm_4")] },
  ],
}

describe("formatPrice", () => {
  it("shows Free for zero and formats other amounts in their currency", () => {
    expect(formatPrice({ amount: 0, currency: "USD" })).toBe("Free")
    expect(formatPrice({ amount: 24.99, currency: "USD" })).toBe("$24.99")
    expect(formatPrice({ amount: 9, currency: "EUR" })).toBe("€9.00")
  })

  it("falls back to a plain amount for unknown currencies", () => {
    expect(formatPrice({ amount: 5, currency: "ZZZ" })).toMatch(/5\.00/)
  })
})

describe("chip values", () => {
  it("collects tool tags in order of first use", () => {
    expect(toolTags(tools)).toEqual(["pbr", "free", "baking"])
  })

  it("collects engines and creator platforms without duplicates", () => {
    const asset = (id: string, engines?: ("unity" | "godot" | "any")[]) => ({
      id,
      name: id,
      why: "Because.",
      url: "https://example.com",
      source: "Store",
      price: { amount: 0, currency: "USD" },
      license: "cc0" as const,
      isAffiliate: false,
      isTeaser: false,
      addedAt: "2026-10-01",
      engines,
    })
    const assets: ListDocumentOf<"assets"> = {
      schemaVersion: 1,
      kind: "assets",
      sections: [{ id: "sec_a", title: "A", items: [asset("itm_1", ["unity", "any"]), asset("itm_2", ["unity"]), asset("itm_3")] }],
    }
    expect(assetEngines(assets)).toEqual(["unity", "any"])

    const creators = {
      schemaVersion: 1,
      kind: "creators",
      sections: [
        {
          id: "sec_a",
          title: "A",
          items: [
            { links: [{ platform: "youtube" }, { platform: "instagram" }] },
            { links: [{ platform: "instagram" }, { platform: "x" }] },
          ],
        },
      ],
    } as unknown as ListDocumentOf<"creators">
    expect(creatorPlatforms(creators)).toEqual(["youtube", "instagram", "x"])
  })
})

describe("filterSections", () => {
  it("returns everything without a filter", () => {
    expect(filterSections(tools.sections, null)).toBe(tools.sections)
  })

  it("keeps matching items and drops sections left empty", () => {
    const result = filterSections(tools.sections, (item) => item.tags?.includes("pbr") ?? false)
    expect(result.map((s) => s.title)).toEqual(["Painting"])
    expect(countItems(result)).toBe(2)
  })

  it("does not change the original sections", () => {
    filterSections(tools.sections, () => false)
    expect(countItems(tools.sections)).toBe(4)
  })
})

describe("formatTag", () => {
  it("capitalises the first word, spaces dashes and uppercases acronyms", () => {
    expect(formatTag("hand-painted")).toBe("Hand painted")
    expect(formatTag("pbr")).toBe("PBR")
    expect(formatTag("stylized-pbr")).toBe("Stylized PBR")
    expect(formatTag("ui-kit")).toBe("UI kit")
  })
})

describe("prompts", () => {
  it("turns a hint into an example value", () => {
    expect(hintExample("e.g. treasure chest")).toBe("treasure chest")
    expect(hintExample("For example: rusty barrel")).toBe("rusty barrel")
    expect(hintExample("any colour")).toBe("any colour")
    expect(hintExample(undefined)).toBe("")
  })

  it("fills variables and marks missing ones", () => {
    const prompt = "Concept sheet of a {{prop}} in {{ style }} style, {{prop}} again"
    expect(fillPrompt(prompt, { prop: "chest", style: "painted" })).toBe(
      "Concept sheet of a chest in painted style, chest again"
    )
    expect(fillPrompt(prompt, { prop: "  " })).toBe("Concept sheet of a [prop] in [style] style, [prop] again")
  })
})
