import type { ResourceCategory, ResourceListKind, ResourceType } from "@/lib/content/resources"

// Library filter state. It lives in the URL (/app/library?type=list&kind=tools)
// so results can be shared, bookmarked and restored with the back button.

export const LIBRARY_PATH = "/app/library"
export const SEARCH_MAX_LENGTH = 100

export const resourceTypes = ["list", "ebook", "guide"] as const satisfies readonly ResourceType[]
export const listKinds = ["tools", "assets", "creators", "prompts"] as const satisfies readonly ResourceListKind[]
export const categories = ["gamedev", "3d", "business", "ai"] as const satisfies readonly ResourceCategory[]
export const sorts = ["newest", "az"] as const

export type LibrarySort = (typeof sorts)[number]

export type LibraryFilters = {
  q: string
  type: ResourceType | null
  kind: ResourceListKind | null
  category: ResourceCategory | null
  sort: LibrarySort
}

export const defaultFilters: LibraryFilters = {
  q: "",
  type: null,
  kind: null,
  category: null,
  sort: "newest",
}

type SearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function oneOf<T extends string>(values: readonly T[], value: string | undefined): T | null {
  return value !== undefined && (values as readonly string[]).includes(value) ? (value as T) : null
}

/** A list kind only makes sense for lists; drop it when the type says otherwise. */
function normalize(filters: LibraryFilters): LibraryFilters {
  if (filters.kind && filters.type && filters.type !== "list") return { ...filters, kind: null }
  return filters
}

/** Filters from the page's search params; unknown values fall back to "All". */
export function parseLibraryFilters(params: SearchParams): LibraryFilters {
  return normalize({
    q: (first(params.q) ?? "").trim().slice(0, SEARCH_MAX_LENGTH),
    type: oneOf(resourceTypes, first(params.type)),
    kind: oneOf(listKinds, first(params.kind)),
    category: oneOf(categories, first(params.category)),
    sort: oneOf(sorts, first(params.sort)) ?? defaultFilters.sort,
  })
}

/**
 * URL for the current filters with some changed. Picking a kind narrows the
 * type to lists; picking an e-book or guide type clears the kind. Defaults
 * are left out so "All" stays a clean /app/library.
 */
export function libraryHref(current: LibraryFilters, patch: Partial<LibraryFilters> = {}): string {
  const next = { ...current, ...patch }
  if (patch.kind && next.type && next.type !== "list") next.type = null
  const filters = normalize(next)

  const params = new URLSearchParams()
  if (filters.q) params.set("q", filters.q)
  if (filters.type) params.set("type", filters.type)
  if (filters.kind) params.set("kind", filters.kind)
  if (filters.category) params.set("category", filters.category)
  if (filters.sort !== defaultFilters.sort) params.set("sort", filters.sort)

  const query = params.toString()
  return query ? `${LIBRARY_PATH}?${query}` : LIBRARY_PATH
}

export function hasActiveFilters(filters: LibraryFilters): boolean {
  return Boolean(filters.q || filters.type || filters.kind || filters.category)
}

/**
 * The search text made safe for a PostgREST `or=(title.ilike.*…*)` filter:
 * characters that delimit the filter syntax or act as LIKE wildcards become
 * spaces. Null when nothing searchable is left.
 */
export function searchPattern(q: string): string | null {
  const safe = q
    .replace(/[,()"\\%_*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return safe ? `*${safe}*` : null
}
