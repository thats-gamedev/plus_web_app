import type { Enums } from "@/lib/supabase/database.types"
import { NEW_ITEM_DAYS } from "@/lib/lists/schema"

// Display helpers for library resources (lists, e-books, guides), shared by
// the member home, the library and the detail pages. Pure, so unit-tested.

export type ResourceType = Enums<"resource_type">
export type ResourceCategory = Enums<"resource_category">
export type ResourceListKind = Enums<"list_kind">

/** The fields the helpers need; DAL rows are a superset. */
export type ResourceSummary = {
  type: ResourceType
  listKind: ResourceListKind | null
  category: ResourceCategory
}

export const categoryLabels: Record<ResourceCategory, string> = {
  gamedev: "Game dev",
  "3d": "3D",
  business: "Business",
  ai: "AI",
}

const listKindLabels: Record<ResourceListKind, string> = {
  tools: "Tools list",
  assets: "Assets list",
  creators: "Creators list",
  prompts: "Prompts list",
}

// What a list counts, as in "Prompts list · 20 prompts" (MW1).
const listKindUnits: Record<ResourceListKind, [one: string, many: string]> = {
  tools: ["item", "items"],
  assets: ["asset", "assets"],
  creators: ["creator", "creators"],
  prompts: ["prompt", "prompts"],
}

/** "Tools list", "E-book" or "Guide". */
export function resourceTypeLabel({ type, listKind }: Pick<ResourceSummary, "type" | "listKind">) {
  if (type === "list" && listKind) return listKindLabels[listKind]
  return type === "ebook" ? "E-book" : "Guide"
}

/** Number of items across all sections of a list document, or null if it isn't one. */
export function countListItems(content: unknown): number | null {
  if (!content || typeof content !== "object" || !("sections" in content)) return null
  const { sections } = content as { sections: unknown }
  if (!Array.isArray(sections)) return null
  return sections.reduce<number>((sum, section) => {
    const items = (section as { items?: unknown })?.items
    return sum + (Array.isArray(items) ? items.length : 0)
  }, 0)
}

const WORDS_PER_MINUTE = 200

/** Reading time of a Markdown body in whole minutes (at least 1). */
export function readingMinutes(markdown: string): number {
  const words = markdown
    .replace(/[#>*_`[\]()|-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

/**
 * Mono meta line for a resource: "Tools list · 18 items", "Guide · 12 min",
 * "E-book · PDF". Falls back to the type label when the detail is unknown.
 */
export function resourceMeta(
  resource: Pick<ResourceSummary, "type" | "listKind"> & {
    content?: unknown
    bodyMd?: string | null
  }
): string {
  const label = resourceTypeLabel(resource)
  if (resource.type === "list" && resource.listKind) {
    const count = countListItems(resource.content)
    if (count === null) return label
    const [one, many] = listKindUnits[resource.listKind]
    return `${label} · ${count} ${count === 1 ? one : many}`
  }
  if (resource.type === "guide") {
    return resource.bodyMd ? `${label} · ${readingMinutes(resource.bodyMd)} min` : label
  }
  return `${label} · PDF`
}

/** "New" badge: published in the last 14 days (same window as list items). */
export function isNewResource(publishedAt: string | null, now: Date = new Date()): boolean {
  if (!publishedAt) return false
  const published = Date.parse(publishedAt)
  if (Number.isNaN(published)) return false
  const ageDays = (now.getTime() - published) / 86_400_000
  return ageDays >= 0 && ageDays < NEW_ITEM_DAYS
}

/** Pastel tile per category, as in "Recently added" (MW1). */
export const categoryTones = {
  gamedev: "sky",
  "3d": "mint",
  business: "cream",
  ai: "grey",
} as const satisfies Record<ResourceCategory, string>
