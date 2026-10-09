import "server-only"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cacheLife, cacheTag } from "next/cache"
import type { ResourceCategory, ResourceListKind, ResourceType } from "@/lib/content/resources"
import { PUBLIC_CONTENT_TAG } from "@/lib/content/public-cache"
import { type ListDocument } from "@/lib/lists/schema"
import { teaserDocument, type TeaserRow } from "@/lib/lists/teaser"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/database.types"
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env"

// Data for logged-out visitors: the landing page and /lists/[slug]. Cached
// for everyone ("use cache"), so nothing here may depend on the visitor.
//
// - List teasers come through the public_teaser_* views with the anonymous
//   key, exactly what the database allows logged-out visitors to read.
// - The landing page's aggregates (titles, kinds, counts of published
//   resources and the current drop's theme) are read with the service role,
//   column by column. Never select content or item data here; the drop's
//   resources are reduced to their kinds, as the page shows them blurred.
//
// Admin actions that publish content or drops call refreshPublicContent();
// timed drops show up within the hour through cacheLife.

export type PublicResource = {
  title: string
  type: ResourceType
  listKind: ResourceListKind | null
  category: ResourceCategory
  itemCount: number | null
  wordCount: number | null
  /** Path in the public `covers` bucket. */
  coverPath: string | null
}

export type PublicList = {
  slug: string
  title: string
  summary: string
  listKind: ResourceListKind
  category: ResourceCategory
  /** All items in the list, for "3 of 22 shown free". */
  itemCount: number
  /** Only the items marked Teaser. */
  doc: ListDocument
}

export type LandingData = {
  /** The newest published resources outside the current drop (hero cards). */
  hero: PublicResource[]
  drop: { month: string; title: string; theme: string | null; introMd: string | null; kinds: Pick<PublicResource, "type" | "listKind">[] } | null
  /** The newest list with teaser items (free list section). */
  freeList: PublicList | null
  /** Real titles for the "What's inside" cards, when there are any. */
  examples: { list: PublicResource | null; prompts: PublicResource | null; document: PublicResource | null }
}

function anonClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const resourceColumns = "slug, title, type, list_kind, category, item_count, word_count, cover_path, drop_id, published_at"

export async function getLandingData(): Promise<LandingData> {
  "use cache"
  cacheLife("hours")
  cacheTag(PUBLIC_CONTENT_TAG)

  const db = createAdminClient()
  const now = new Date().toISOString()
  const [{ data: drop }, { data: rows, error }] = await Promise.all([
    db
      .from("drops")
      .select("id, month, title, theme, intro_md")
      .lte("published_at", now)
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("resources")
      .select(resourceColumns)
      .eq("status", "published")
      .lte("published_at", now)
      .order("published_at", { ascending: false })
      .limit(60),
  ])
  if (error) throw new Error(`resources read: ${error.message}`)

  const toPublic = (r: NonNullable<typeof rows>[number]): PublicResource => ({
    title: r.title,
    type: r.type,
    listKind: r.list_kind,
    category: r.category,
    itemCount: r.item_count,
    wordCount: r.word_count,
    coverPath: r.cover_path,
  })
  const outsideDrop = rows.filter((r) => !drop || r.drop_id !== drop.id)
  const dropRows = drop ? rows.filter((r) => r.drop_id === drop.id) : []
  const pick = (match: (r: NonNullable<typeof rows>[number]) => boolean) => {
    const row = outsideDrop.find(match)
    return row ? toPublic(row) : null
  }

  const teaserSlugs = new Set((await getPublicListSlugs()).map((l) => l.slug))
  const freeSlug = rows.find((r) => r.type === "list" && teaserSlugs.has(r.slug))?.slug
  const freeList = freeSlug ? await getPublicList(freeSlug) : null

  return {
    hero: outsideDrop.slice(0, 3).map(toPublic),
    drop: drop
      ? {
          month: drop.month,
          title: drop.title,
          theme: drop.theme,
          introMd: drop.intro_md,
          kinds: dropRows.map((r) => ({ type: r.type, listKind: r.list_kind })),
        }
      : null,
    freeList,
    examples: {
      list: pick((r) => r.type === "list" && r.list_kind !== "prompts"),
      prompts: pick((r) => r.list_kind === "prompts"),
      document: pick((r) => r.type !== "list"),
    },
  }
}

/** A list's public teaser, or null when it has none (or doesn't exist). */
export async function getPublicList(slug: string): Promise<PublicList | null> {
  "use cache"
  cacheLife("hours")
  cacheTag(PUBLIC_CONTENT_TAG)

  const db = anonClient()
  const [{ data: resource }, { data: rows, error }] = await Promise.all([
    db
      .from("public_teaser_resources")
      .select("slug, title, summary, list_kind, category, item_count")
      .eq("slug", slug)
      .maybeSingle(),
    db.from("public_teaser_items").select("section_title, position, item").eq("resource_slug", slug).order("position"),
  ])
  if (error) throw new Error(`public_teaser_items read: ${error.message}`)
  if (!resource?.slug || !resource.list_kind || !resource.title || !resource.category) return null

  const teaserRows: TeaserRow[] = rows.flatMap((r) => (r.position === null ? [] : [{ section_title: r.section_title, position: r.position, item: r.item }]))
  const doc = teaserDocument(resource.list_kind, teaserRows)
  if (!doc) return null
  return {
    slug: resource.slug,
    title: resource.title,
    summary: resource.summary ?? "",
    listKind: resource.list_kind,
    category: resource.category,
    itemCount: resource.item_count ?? 0,
    doc,
  }
}

/** Every list with a public teaser (sitemap, static params). */
export async function getPublicListSlugs(): Promise<{ slug: string }[]> {
  "use cache"
  cacheLife("hours")
  cacheTag(PUBLIC_CONTENT_TAG)

  const { data, error } = await anonClient().from("public_teaser_resources").select("slug")
  if (error) throw new Error(`public_teaser_resources read: ${error.message}`)
  return data.filter((r): r is { slug: string } => Boolean(r.slug))
}
