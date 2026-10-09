import { newListId } from "@/lib/content/slug"
import {
  type ListDocument,
  listDocumentSchema,
  type ListItem,
  type ListKind,
  LIST_LIMITS,
} from "@/lib/lists/schema"

// Pure operations behind the admin list editor (spec, "Admin list editor").
// The Zustand store calls these; each returns a new document and never
// mutates its input, so undo is just keeping the previous value.
//
// While editing, items may be incomplete (empty name, missing URL). The
// document is typed as a ListDocument anyway and validated with Zod before
// it is saved as live content.

type Section = ListDocument["sections"][number]
type AnyItem = ListItem & Record<string, unknown>

const today = () => new Date().toISOString().slice(0, 10)

/** A blank item of the list's kind; required fields start empty for the admin to fill. */
export function newItem(kind: ListKind, id = newListId("itm")): AnyItem {
  const base = { id, name: "", why: "", tags: [], isAffiliate: false, isTeaser: false, addedAt: today() }
  switch (kind) {
    case "tools":
      return { ...base, url: "", pricing: "free", platforms: [] } as AnyItem
    case "assets":
      return {
        ...base,
        url: "",
        source: "",
        price: { amount: 0, currency: "USD" },
        license: "cc0",
        engines: [],
        formats: [],
      } as AnyItem
    case "creators":
      return {
        ...base,
        url: "",
        focus: "gamedev",
        level: "beginner",
        language: "en",
        primaryPlatform: "youtube",
        links: [{ platform: "youtube", url: "" }],
      } as AnyItem
    case "prompts":
      return { ...base, tool: "chat", prompt: "", variables: [] } as AnyItem
  }
}

function mapSections(doc: ListDocument, fn: (section: Section) => Section): ListDocument {
  return { ...doc, sections: doc.sections.map(fn) } as ListDocument
}

export function findItem(doc: ListDocument, itemId: string): { section: Section; item: AnyItem; index: number } | null {
  for (const section of doc.sections) {
    const index = section.items.findIndex((i) => i.id === itemId)
    if (index >= 0) return { section, item: section.items[index] as AnyItem, index }
  }
  return null
}

export function itemCount(doc: ListDocument): number {
  return doc.sections.reduce((n, s) => n + s.items.length, 0)
}

// Sections --------------------------------------------------------------------

export function addSection(doc: ListDocument, title = "New section", id = newListId("sec")): ListDocument {
  if (doc.sections.length >= LIST_LIMITS.sections) return doc
  return { ...doc, sections: [...doc.sections, { id, title, items: [] }] } as ListDocument
}

export function updateSection(
  doc: ListDocument,
  sectionId: string,
  patch: { title?: string; description?: string }
): ListDocument {
  return mapSections(doc, (s) => {
    if (s.id !== sectionId) return s
    const next = { ...s, ...patch }
    // An empty description is left out rather than stored as "".
    if (!next.description) delete next.description
    return next
  })
}

/** Removes a section and its items. The last section can't be removed. */
export function removeSection(doc: ListDocument, sectionId: string): ListDocument {
  if (doc.sections.length <= 1) return doc
  return { ...doc, sections: doc.sections.filter((s) => s.id !== sectionId) } as ListDocument
}

export function moveSection(doc: ListDocument, fromIndex: number, toIndex: number): ListDocument {
  const sections = [...doc.sections]
  if (fromIndex < 0 || fromIndex >= sections.length) return doc
  const [moved] = sections.splice(fromIndex, 1)
  sections.splice(Math.max(0, Math.min(toIndex, sections.length)), 0, moved)
  return { ...doc, sections } as ListDocument
}

// Items -----------------------------------------------------------------------

export function addItem(doc: ListDocument, sectionId: string, item: AnyItem = newItem(doc.kind)): ListDocument {
  if (itemCount(doc) >= LIST_LIMITS.items) return doc
  return mapSections(doc, (s) => (s.id === sectionId ? ({ ...s, items: [...s.items, item] } as Section) : s))
}

/** Merges a patch into an item. Creator URLs follow the primary platform's link. */
export function updateItem(doc: ListDocument, itemId: string, patch: Record<string, unknown>): ListDocument {
  return mapSections(doc, (s) => {
    if (!s.items.some((i) => i.id === itemId)) return s
    return {
      ...s,
      items: s.items.map((i) => {
        if (i.id !== itemId) return i
        const next = { ...i, ...patch } as AnyItem
        if (doc.kind === "creators") {
          const links = (next.links as { platform: string; url: string }[] | undefined) ?? []
          const primary = links.find((l) => l.platform === next.primaryPlatform)
          next.url = primary?.url ?? ""
        }
        return next
      }),
    } as Section
  })
}

export function removeItem(doc: ListDocument, itemId: string): ListDocument {
  return mapSections(doc, (s) => ({ ...s, items: s.items.filter((i) => i.id !== itemId) }) as Section)
}

/** Copies an item right below the original, with a new id and "(copy)" in the name. */
export function duplicateItem(doc: ListDocument, itemId: string, newId = newListId("itm")): ListDocument {
  if (itemCount(doc) >= LIST_LIMITS.items) return doc
  return mapSections(doc, (s) => {
    const index = s.items.findIndex((i) => i.id === itemId)
    if (index < 0) return s
    const original = s.items[index] as AnyItem
    const copy = { ...structuredClone(original), id: newId, name: `${original.name} (copy)`.slice(0, 80) }
    const items = [...s.items]
    items.splice(index + 1, 0, copy)
    return { ...s, items } as Section
  })
}

/** Moves an item to `toIndex` in `toSectionId` (the same or another section). */
export function moveItem(doc: ListDocument, itemId: string, toSectionId: string, toIndex: number): ListDocument {
  const found = findItem(doc, itemId)
  if (!found || !doc.sections.some((s) => s.id === toSectionId)) return doc
  const without = removeItem(doc, itemId)
  return mapSections(without, (s) => {
    if (s.id !== toSectionId) return s
    const items = [...s.items]
    items.splice(Math.max(0, Math.min(toIndex, items.length)), 0, found.item)
    return { ...s, items } as Section
  })
}

// Validation ------------------------------------------------------------------

export type DocumentErrors = {
  valid: boolean
  /** Field errors per item id, e.g. { url: "Enter a full http(s) URL" }. */
  items: Map<string, Record<string, string>>
  /** Errors about sections or the whole document. */
  general: string[]
  count: number
}

/** Runs the list schema and maps each issue to the item and field it belongs to. */
export function validateDocument(doc: ListDocument): DocumentErrors {
  const result = listDocumentSchema.safeParse(doc)
  const errors: DocumentErrors = { valid: result.success, items: new Map(), general: [], count: 0 }
  if (result.success) return errors

  for (const issue of result.error.issues) {
    errors.count++
    const [first, sectionIndex, third, itemIndex, field] = issue.path
    if (first === "sections" && third === "items" && typeof sectionIndex === "number" && typeof itemIndex === "number") {
      const item = doc.sections[sectionIndex]?.items[itemIndex]
      if (item) {
        const fields = errors.items.get(item.id) ?? {}
        const key = field === undefined ? "item" : String(field)
        fields[key] ??= issue.message
        errors.items.set(item.id, fields)
        continue
      }
    }
    if (first === "sections" && typeof sectionIndex === "number" && third !== undefined) {
      const section = doc.sections[sectionIndex]
      errors.general.push(`${section ? `Section "${section.title || "untitled"}"` : "A section"}: ${issue.message}`)
      continue
    }
    errors.general.push(issue.message)
  }
  return errors
}

/** Parses "a, B ,c" into ["a", "b", "c"]: lowercase, unique, non-empty. */
export function parseTagList(value: string): string[] {
  return [...new Set(value.split(",").map((t) => t.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean))]
}
