import "server-only"
import type { ResourceCategory, ResourceListKind, ResourceType } from "@/lib/content/resources"
import { requireAdmin } from "@/lib/dal/auth"
import type { Json } from "@/lib/supabase/database.types"
import { createAdminClient } from "@/lib/supabase/admin"

// Admin content reads. Drafts (draft_content, draft_updated_at) are not
// granted to any client role, so these use the service-role client, always
// after requireAdmin().

export type AdminContentRow = {
  id: string
  title: string
  slug: string
  type: ResourceType
  listKind: ResourceListKind | null
  category: ResourceCategory
  status: "draft" | "published"
  coverPath: string | null
  dropMonth: string | null
  updatedAt: string
  /** A saved draft that differs from what members see. */
  hasDraft: boolean
}

export async function getAdminContent(): Promise<AdminContentRow[]> {
  await requireAdmin()
  const { data, error } = await createAdminClient()
    .from("resources")
    .select("id, title, slug, type, list_kind, category, status, cover_path, updated_at, draft_updated_at, drop:drops (month)")
    .order("updated_at", { ascending: false })
  if (error) throw new Error(`resources read: ${error.message}`)
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    type: r.type,
    listKind: r.list_kind,
    category: r.category,
    status: r.status,
    coverPath: r.cover_path,
    dropMonth: r.drop?.month ?? null,
    updatedAt: r.draft_updated_at && r.draft_updated_at > r.updated_at ? r.draft_updated_at : r.updated_at,
    hasDraft: r.status === "published" && r.draft_updated_at !== null,
  }))
}

export type EditableResource = {
  id: string
  type: ResourceType
  listKind: ResourceListKind | null
  title: string
  slug: string
  summary: string
  category: ResourceCategory
  status: "draft" | "published"
  coverPath: string | null
  bodyMd: string | null
  filePath: string | null
  dropId: string | null
  publishedAt: string | null
  /** What members see. */
  content: Json | null
  /** Work in progress; null when there are no unsaved edits. */
  draftContent: Json | null
  draftUpdatedAt: string | null
  updatedAt: string
}

export async function getEditableResource(id: string): Promise<EditableResource | null> {
  await requireAdmin()
  const { data, error } = await createAdminClient()
    .from("resources")
    .select(
      "id, type, list_kind, title, slug, summary, category, status, cover_path, body_md, file_path, drop_id, published_at, content, draft_content, draft_updated_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(`resources read: ${error.message}`)
  if (!data) return null
  return {
    id: data.id,
    type: data.type,
    listKind: data.list_kind,
    title: data.title,
    slug: data.slug,
    summary: data.summary,
    category: data.category,
    status: data.status,
    coverPath: data.cover_path,
    bodyMd: data.body_md,
    filePath: data.file_path,
    dropId: data.drop_id,
    publishedAt: data.published_at,
    content: data.content,
    draftContent: data.draft_content,
    draftUpdatedAt: data.draft_updated_at,
    updatedAt: data.updated_at,
  }
}

export type AdminDrop = {
  id: string
  month: string
  title: string
  theme: string | null
  introMd: string | null
  publishedAt: string | null
  announcedAt: string | null
  resources: { id: string; title: string; type: ResourceType; listKind: ResourceListKind | null; status: "draft" | "published" }[]
}

/** Every drop with its attached content, newest month first. */
export async function getAdminDrops(): Promise<AdminDrop[]> {
  await requireAdmin()
  const { data, error } = await createAdminClient()
    .from("drops")
    .select("id, month, title, theme, intro_md, published_at, announced_at, resources (id, title, type, list_kind, status)")
    .order("month", { ascending: false })
  if (error) throw new Error(`drops read: ${error.message}`)
  return data.map((d) => ({
    id: d.id,
    month: d.month,
    title: d.title,
    theme: d.theme,
    introMd: d.intro_md,
    publishedAt: d.published_at,
    announcedAt: d.announced_at,
    resources: d.resources
      .map((r) => ({ id: r.id, title: r.title, type: r.type, listKind: r.list_kind, status: r.status }))
      .sort((a, b) => a.title.localeCompare(b.title)),
  }))
}

export type DropOption = { id: string; month: string; title: string }

/** Drops for "Add to drop", newest month first. */
export async function getDropOptions(): Promise<DropOption[]> {
  await requireAdmin()
  const { data, error } = await createAdminClient()
    .from("drops")
    .select("id, month, title")
    .order("month", { ascending: false })
  if (error) throw new Error(`drops read: ${error.message}`)
  return data
}
