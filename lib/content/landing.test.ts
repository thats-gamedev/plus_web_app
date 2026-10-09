import { describe, expect, it } from "vitest"
import { dropHeading, dropSummary } from "./landing"

describe("dropHeading", () => {
  it("uses the month and the theme, or the title without a theme", () => {
    expect(dropHeading({ month: "2026-10-01", theme: "Stylized texturing", title: "October drop" })).toBe("October: Stylized texturing")
    expect(dropHeading({ month: "2026-11-01", theme: null, title: "Lighting" })).toBe("November: Lighting")
  })
})

describe("dropSummary", () => {
  it("describes the drop by kind, as in the mockup", () => {
    expect(
      dropSummary([
        { type: "list", listKind: "tools" },
        { type: "list", listKind: "prompts" },
        { type: "guide", listKind: null },
      ])
    ).toBe("One list, one prompts list and one short guide.")
  })

  it("counts several of a kind", () => {
    expect(dropSummary([{ type: "list", listKind: "tools" }, { type: "list", listKind: "assets" }])).toBe("Two lists.")
    expect(dropSummary([{ type: "ebook", listKind: null }, { type: "guide", listKind: null }])).toBe("One e-book and one short guide.")
  })

  it("is null for an empty drop", () => {
    expect(dropSummary([])).toBeNull()
  })
})
