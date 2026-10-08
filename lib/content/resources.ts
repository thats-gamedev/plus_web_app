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

const WORDS_PER_MINUTE = 200

/** Reading time in whole minutes (at least 1) for a word count. */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

/** Counts from the generated resources.item_count / word_count columns. */
export type ResourceCounts = Pick<ResourceSummary, "type" | "listKind"> & {
  itemCount: number | null
  wordCount: number | null
}

/**
 * Size of a resource: "18 items", "20 prompts", "12 min read" or "PDF".
 * Null when unknown (a list without content, a guide without a body).
 */
export function resourceSize(resource: ResourceCounts): string | null {
  if (resource.type === "list") {
    if (!resource.listKind || resource.itemCount === null) return null
    const [one, many] = listKindUnits[resource.listKind]
    return `${resource.itemCount} ${resource.itemCount === 1 ? one : many}`
  }
  if (resource.type === "guide") {
    return resource.wordCount ? `${readingMinutes(resource.wordCount)} min read` : null
  }
  return "PDF"
}

/** Mono meta line: "Tools list · 18 items", "Guide · 12 min read", "E-book · PDF". */
export function resourceMeta(resource: ResourceCounts): string {
  const size = resourceSize(resource)
  const label = resourceTypeLabel(resource)
  return size ? `${label} · ${size}` : label
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
