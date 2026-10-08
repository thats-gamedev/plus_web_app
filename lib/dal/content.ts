import "server-only"
import { cache } from "react"
import type { ResourceCategory, ResourceListKind, ResourceType } from "@/lib/content/resources"
import { createClient } from "@/lib/supabase/server"

// Data Access Layer for the library and drops. Queries run as the signed-in
// user, so RLS decides what comes back: members see live drops and published
// resources, everyone else gets empty results.

export type ResourceCard = {
  id: string
  slug: string
  title: string
  type: ResourceType
  listKind: ResourceListKind | null
  category: ResourceCategory
  publishedAt: string | null
}

export type DropResource = ResourceCard & {
  /** List document, used only to count items for the meta line. */
  content: unknown
  bodyMd: string | null
}

export type Drop = {
  id: string
  /** First day of the drop's month, e.g. "2026-10-01". */
  month: string
  title: string
  theme: string | null
  introMd: string | null
  resources: DropResource[]
}

const cardColumns = "id, slug, title, type, list_kind, category, published_at"

type CardRow = {
  id: string
  slug: string
  title: string
  type: ResourceType
  list_kind: ResourceListKind | null
  category: ResourceCategory
  published_at: string | null
}

function toCard(row: CardRow): ResourceCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    listKind: row.list_kind,
    category: row.category,
    publishedAt: row.published_at,
  }
}

/** The most recent live drop with its published resources, or null before the first one. */
export const getCurrentDrop = cache(async (): Promise<Drop | null> => {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: drop } = await supabase
    .from("drops")
    .select("id, month, title, theme, intro_md")
    .lte("published_at", now)
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!drop) return null

  const { data: rows } = await supabase
    .from("resources")
    .select(`${cardColumns}, content, body_md`)
    .eq("drop_id", drop.id)
    .eq("status", "published")
    .lte("published_at", now)
    .order("published_at", { ascending: true })
    .order("title", { ascending: true })

  return {
    id: drop.id,
    month: drop.month,
    title: drop.title,
    theme: drop.theme,
    introMd: drop.intro_md,
    resources: (rows ?? []).map((row) => ({
      ...toCard(row),
      content: row.content,
      bodyMd: row.body_md,
    })),
  }
})

/** The newest published resources across the library. */
export const getRecentResources = cache(async (limit: number): Promise<ResourceCard[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("resources")
    .select(cardColumns)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .order("title", { ascending: true })
    .limit(limit)
  return (data ?? []).map(toCard)
})
