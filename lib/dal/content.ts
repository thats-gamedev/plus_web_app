import "server-only"
import { cache } from "react"
import { type LibraryFilters, searchPattern } from "@/lib/content/library-filters"
import type { ResourceCategory, ResourceListKind, ResourceType } from "@/lib/content/resources"
import { createClient } from "@/lib/supabase/server"

// Data Access Layer for the library and drops. Queries run as the signed-in
// user, so RLS decides what comes back: members see live drops and published
// resources, everyone else gets empty results. Resources are selected by
// column list, since members may not read the draft columns.

export type ResourceCard = {
  id: string
  slug: string
  title: string
  summary: string
  type: ResourceType
  listKind: ResourceListKind | null
  category: ResourceCategory
  coverPath: string | null
  itemCount: number | null
  wordCount: number | null
  publishedAt: string | null
}

export type Drop = {
  id: string
  /** First day of the drop's month, e.g. "2026-10-01". */
  month: string
  title: string
  theme: string | null
  introMd: string | null
  resources: ResourceCard[]
}

const cardColumns =
  "id, slug, title, summary, type, list_kind, category, cover_path, item_count, word_count, published_at"

type CardRow = {
  id: string
  slug: string
  title: string
  summary: string
  type: ResourceType
  list_kind: ResourceListKind | null
  category: ResourceCategory
  cover_path: string | null
  item_count: number | null
  word_count: number | null
  published_at: string | null
}

function toCard(row: CardRow): ResourceCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    type: row.type,
    listKind: row.list_kind,
    category: row.category,
    coverPath: row.cover_path,
    itemCount: row.item_count,
    wordCount: row.word_count,
    publishedAt: row.published_at,
  }
}

type Client = Awaited<ReturnType<typeof createClient>>

/**
 * Query for published resources whose go-live time has passed. Not async on
 * purpose: query builders are thenables, so awaiting one runs it.
 */
function publishedResources(supabase: Client) {
  return supabase
    .from("resources")
    .select(cardColumns)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
}

/** The most recent live drop with its published resources, or null before the first one. */
export const getCurrentDrop = cache(async (): Promise<Drop | null> => {
  const supabase = await createClient()
  const { data: drop } = await supabase
    .from("drops")
    .select("id, month, title, theme, intro_md")
    .lte("published_at", new Date().toISOString())
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!drop) return null

  const { data: rows } = await publishedResources(supabase)
    .eq("drop_id", drop.id)
    .order("published_at", { ascending: true })
    .order("title", { ascending: true })

  return {
    id: drop.id,
    month: drop.month,
    title: drop.title,
    theme: drop.theme,
    introMd: drop.intro_md,
    resources: (rows ?? []).map(toCard),
  }
})

/** The newest published resources across the library. */
export const getRecentResources = cache(async (limit: number): Promise<ResourceCard[]> => {
  const { data } = await publishedResources(await createClient())
    .order("published_at", { ascending: false })
    .order("title", { ascending: true })
    .limit(limit)
  return (data ?? []).map(toCard)
})

export type ResourceDetail = ResourceCard & {
  /** Raw list document; parse with listDocumentSchema before rendering. */
  content: unknown
  bodyMd: string | null
  hasFile: boolean
  updatedAt: string
  /** Month of the drop it belongs to, e.g. "2026-10-01". */
  dropMonth: string | null
}

/** One published resource by slug, or null (missing, draft or not a member). */
export const getResourceBySlug = cache(async (slug: string): Promise<ResourceDetail | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("resources")
    .select(`${cardColumns}, content, body_md, file_path, updated_at, drop:drops (month)`)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle()
  if (!data) return null

  return {
    ...toCard(data),
    content: data.content,
    bodyMd: data.body_md,
    hasFile: Boolean(data.file_path),
    updatedAt: data.updated_at,
    dropMonth: data.drop?.month ?? null,
  }
})

/** A published e-book's slug and storage path, for the signed download. */
export async function getEbookFile(id: string): Promise<{ slug: string; path: string | null } | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("resources")
    .select("slug, file_path")
    .eq("id", id)
    .eq("type", "ebook")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle()
  return data ? { slug: data.slug, path: data.file_path } : null
}

// Enough for years of monthly drops; paginate if the library outgrows it.
const LIBRARY_LIMIT = 500

/** The library, filtered and sorted as in the URL. */
export async function getLibrary(filters: LibraryFilters): Promise<ResourceCard[]> {
  let query = publishedResources(await createClient())
  if (filters.type) query = query.eq("type", filters.type)
  if (filters.kind) query = query.eq("list_kind", filters.kind)
  if (filters.category) query = query.eq("category", filters.category)

  const pattern = searchPattern(filters.q)
  if (pattern) query = query.or(`title.ilike.${pattern},summary.ilike.${pattern}`)

  query =
    filters.sort === "az"
      ? query.order("title", { ascending: true })
      : query.order("published_at", { ascending: false }).order("title", { ascending: true })

  const { data, error } = await query.limit(LIBRARY_LIMIT)
  if (error) throw new Error(`Could not load the library: ${error.message}`)
  return (data ?? []).map(toCard)
}
