import { describe, expect, it } from "vitest"
import {
  addItem,
  addSection,
  duplicateItem,
  findItem,
  itemCount,
  moveItem,
  moveSection,
  newItem,
  parseTagList,
  removeItem,
  removeSection,
  updateItem,
  updateSection,
  validateDocument,
} from "./editor"
import { emptyListDocument, LIST_LIMITS, type ListDocument, listDocumentSchema } from "./schema"

const tool = (id: string, name = id) => ({
  ...newItem("tools", id),
  name,
  why: "Because it is good.",
  url: "https://example.com",
})

function doc(): ListDocument {
  return {
    schemaVersion: 1,
    kind: "tools",
    sections: [
      { id: "sec_a", title: "A", items: [tool("itm_1"), tool("itm_2"), tool("itm_3")] },
      { id: "sec_b", title: "B", items: [tool("itm_4")] },
    ],
  } as ListDocument
}

const ids = (d: ListDocument) => d.sections.map((s) => `${s.id}:${s.items.map((i) => i.id).join(",")}`)

describe("new items", () => {
  it("creates a blank item per kind that only misses what the admin must type", () => {
    for (const kind of ["tools", "assets", "creators", "prompts"] as const) {
      const d = addItem(emptyListDocument(kind, "sec_x"), "sec_x", newItem(kind, "itm_new"))
      const result = listDocumentSchema.safeParse(d)
      expect(result.success).toBe(false)
      const fields = new Set(result.error!.issues.map((i) => String(i.path.at(-1))))
      // name and why are always required; URL-ish fields depend on the kind.
      expect(fields.has("name") && fields.has("why")).toBe(true)
      expect([...fields].every((f) => ["name", "why", "url", "source", "prompt"].includes(f))).toBe(true)
    }
  })
})

describe("sections", () => {
  it("adds, renames, describes and reorders sections", () => {
    let d = addSection(doc(), "C", "sec_c")
    d = updateSection(d, "sec_c", { title: "Libraries", description: "Scans" })
    d = moveSection(d, 2, 0)
    expect(d.sections.map((s) => s.title)).toEqual(["Libraries", "A", "B"])
    expect(d.sections[0].description).toBe("Scans")
    expect("description" in updateSection(d, "sec_c", { description: "" }).sections[0]).toBe(false)
  })

  it("keeps at least one section and respects the section limit", () => {
    let d = removeSection(doc(), "sec_b")
    expect(removeSection(d, "sec_a")).toBe(d)
    for (let i = 0; i < LIST_LIMITS.sections + 5; i++) d = addSection(d, `S${i}`, `sec_${i}`)
    expect(d.sections).toHaveLength(LIST_LIMITS.sections)
  })
})

describe("items", () => {
  it("moves items within a section and across sections", () => {
    expect(ids(moveItem(doc(), "itm_1", "sec_a", 2))).toEqual(["sec_a:itm_2,itm_3,itm_1", "sec_b:itm_4"])
    expect(ids(moveItem(doc(), "itm_2", "sec_b", 0))).toEqual(["sec_a:itm_1,itm_3", "sec_b:itm_2,itm_4"])
    expect(ids(moveItem(doc(), "itm_4", "sec_a", 99))).toEqual(["sec_a:itm_1,itm_2,itm_3,itm_4", "sec_b:"])
  })

  it("ignores moves of unknown items or into unknown sections", () => {
    const d = doc()
    expect(moveItem(d, "itm_x", "sec_a", 0)).toBe(d)
    expect(moveItem(d, "itm_1", "sec_x", 0)).toBe(d)
  })

  it("duplicates below the original with a new id", () => {
    const d = duplicateItem(doc(), "itm_1", "itm_copy")
    expect(ids(d)[0]).toBe("sec_a:itm_1,itm_copy,itm_2,itm_3")
    expect(findItem(d, "itm_copy")!.item.name).toBe("itm_1 (copy)")
  })

  it("updates and removes items without touching the original document", () => {
    const original = doc()
    const updated = updateItem(original, "itm_2", { name: "ArmorPaint", isTeaser: true })
    expect(findItem(updated, "itm_2")!.item).toMatchObject({ name: "ArmorPaint", isTeaser: true })
    expect(findItem(original, "itm_2")!.item.name).toBe("itm_2")
    expect(itemCount(removeItem(updated, "itm_2"))).toBe(3)
  })

  it("keeps a creator's URL equal to its primary platform link", () => {
    let d = addItem(emptyListDocument("creators", "sec_x"), "sec_x", newItem("creators", "itm_c"))
    d = updateItem(d, "itm_c", {
      links: [
        { platform: "youtube", url: "https://youtube.com/@a" },
        { platform: "instagram", url: "https://instagram.com/a" },
      ],
    })
    expect(findItem(d, "itm_c")!.item.url).toBe("https://youtube.com/@a")
    d = updateItem(d, "itm_c", { primaryPlatform: "instagram" })
    expect(findItem(d, "itm_c")!.item.url).toBe("https://instagram.com/a")
  })
})

describe("validateDocument", () => {
  it("maps schema issues to the item and field", () => {
    const d = updateItem(updateItem(doc(), "itm_3", { url: "not a url" }), "itm_4", { why: "" })
    const errors = validateDocument(d)
    expect(errors.valid).toBe(false)
    expect(errors.items.get("itm_3")).toEqual({ url: "Enter a full http(s) URL" })
    expect(errors.items.get("itm_4")).toEqual({ why: "Required" })
    expect(errors.count).toBe(2)
  })

  it("reports document-level problems separately", () => {
    const d = { ...doc(), sections: [...doc().sections, { id: "sec_a", title: "Dup", items: [] }] } as ListDocument
    expect(validateDocument(d).general).toEqual(["Section and item ids must be unique"])
  })

  it("passes a complete document", () => {
    expect(validateDocument(doc()).valid).toBe(true)
  })
})

describe("parseTagList", () => {
  it("lowercases, dashes spaces and removes duplicates", () => {
    expect(parseTagList("Texturing, PBR , hand painted, pbr,")).toEqual(["texturing", "pbr", "hand-painted"])
  })
})
