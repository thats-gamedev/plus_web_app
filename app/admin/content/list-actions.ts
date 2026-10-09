"use server"

import { refresh } from "next/cache"
import { z } from "zod"
import { categories } from "@/lib/content/library-filters"
import { SLUG_PATTERN } from "@/lib/content/slug"
import { requireAdmin } from "@/lib/dal/auth"
import { LIST_LIMITS, listDocumentSchema } from "@/lib/lists/schema"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/database.types"

// List editor actions (spec, "Admin list editor"). Editing writes only
// draft_content; Publish validates the draft on the server and copies it to
// content, so members never see half-finished edits. Every action checks
// requireAdmin() before touching the service-role client.

const UNIQUE_VIOLATION = "23505"

/**
 * Timestamps come back from Postgres as "…+00:00" but are sent as "…Z", so
 * compare the instants, not the strings.
 */
function sameInstant(a: string | null, b: string | null): boolean {
  if (a === null || b === null) return a === b
  return Date.parse(a) === Date.parse(b)
}

export type SaveDraftResult =
  | { ok: true; draftUpdatedAt: string }
  | { ok: false; conflict: true; serverUpdatedAt: string | null }
  | { ok: false; conflict?: false; message: string }

/** Loose shape check for drafts: incomplete items are fine while editing. */
const draftShape = z.object({
  schemaVersion: z.literal(1),
  kind: z.enum(["tools", "assets", "creators", "prompts"]),
  intro: z.string().max(2000).optional(),
  sections: z
    .array(z.object({ id: z.string(), title: z.string().max(80), items: z.array(z.record(z.string(), z.unknown())) }).passthrough())
    .max(LIST_LIMITS.sections),
})

/**
 * Autosave. `expected` is the draft_updated_at the editor last saw; if the
 * stored one differs (another tab saved meanwhile) the save is refused
 * unless `overwrite` is set (the editor's "Overwrite" button).
 */
export async function saveListDraft(
  id: string,
  draft: unknown,
  expected: string | null,
  overwrite = false
): Promise<SaveDraftResult> {
  await requireAdmin()
  const parsed = draftShape.safeParse(draft)
  if (!parsed.success) return { ok: false, message: "The draft has an unexpected shape and wasn't saved." }
  if (new TextEncoder().encode(JSON.stringify(draft)).byteLength >= LIST_LIMITS.bytes) {
    return { ok: false, message: "The list is larger than 512 KB. Remove some items or text." }
  }
  if (parsed.data.sections.reduce((n, s) => n + s.items.length, 0) > LIST_LIMITS.items) {
    return { ok: false, message: `A list can hold at most ${LIST_LIMITS.items} items.` }
  }

  const db = createAdminClient()
  const { data: current } = await db.from("resources").select("type, list_kind, draft_updated_at").eq("id", id).maybeSingle()
  if (!current || current.type !== "list") return { ok: false, message: "This list no longer exists." }
  if (current.list_kind !== parsed.data.kind) return { ok: false, message: "The list kind doesn't match." }
  if (!overwrite && !sameInstant(current.draft_updated_at, expected)) {
    return { ok: false, conflict: true, serverUpdatedAt: current.draft_updated_at }
  }

  const now = new Date().toISOString()
  let query = db.from("resources").update({ draft_content: draft as Json, draft_updated_at: now }).eq("id", id)
  // Compare-and-set, so two saves racing each other can't both win.
  if (!overwrite) query = expected === null ? query.is("draft_updated_at", null) : query.eq("draft_updated_at", expected)
  const { data, error } = await query.select("id")
  if (error) return { ok: false, message: `Couldn't save: ${error.message}` }
  if (!data.length) return { ok: false, conflict: true, serverUpdatedAt: null }

  return { ok: true, draftUpdatedAt: now }
}

const settingsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  slug: z.string().trim().regex(SLUG_PATTERN, "Slug: lowercase letters, digits and dashes"),
  category: z.enum(categories),
  coverPath: z
    .string()
    .trim()
    .max(300)
    .nullable()
    .refine((p) => !p || (!p.startsWith("/") && !p.includes("..")), "Invalid cover path"),
})

export type ListActionResult = { ok: boolean; message: string }

/** Title, slug, category and cover are row columns and take effect right away. */
export async function saveListSettings(id: string, settings: unknown): Promise<ListActionResult> {
  await requireAdmin()
  const parsed = settingsSchema.safeParse(settings)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid settings" }

  const { title, slug, category, coverPath } = parsed.data
  const { error } = await createAdminClient()
    .from("resources")
    .update({ title, slug, category, cover_path: coverPath || null })
    .eq("id", id)
    .eq("type", "list")
  if (error?.code === UNIQUE_VIOLATION) return { ok: false, message: "Another resource already uses this slug." }
  if (error) return { ok: false, message: `Couldn't save the settings: ${error.message}` }
  return { ok: true, message: "Settings saved." }
}

export type PublishResult = ListActionResult & { errors?: number }

/**
 * Validates the draft with the full list schema and makes it the live
 * version. Also attaches the list to a drop (or none).
 */
export async function publishList(id: string, dropId: string | null): Promise<PublishResult> {
  await requireAdmin()
  if (dropId !== null && !z.uuid().safeParse(dropId).success) return { ok: false, message: "Unknown drop." }

  const db = createAdminClient()
  const { data: resource } = await db
    .from("resources")
    .select("type, list_kind, content, draft_content, published_at")
    .eq("id", id)
    .maybeSingle()
  if (!resource || resource.type !== "list") return { ok: false, message: "This list no longer exists." }

  const candidate = resource.draft_content ?? resource.content
  const parsed = listDocumentSchema.safeParse(candidate)
  if (!parsed.success) {
    return { ok: false, message: "Fix the errors before publishing.", errors: parsed.error.issues.length }
  }
  if (parsed.data.kind !== resource.list_kind) return { ok: false, message: "The list kind doesn't match." }

  const { error } = await db
    .from("resources")
    .update({
      content: parsed.data as Json,
      draft_content: null,
      draft_updated_at: null,
      status: "published",
      drop_id: dropId,
      ...(!resource.published_at && { published_at: new Date().toISOString() }),
    })
    .eq("id", id)
  if (error) return { ok: false, message: `Couldn't publish: ${error.message}` }

  refresh()
  return { ok: true, message: "Published. Members see this version now." }
}

/** Throws away unpublished edits; the editor reloads the live version. */
export async function discardListDraft(id: string): Promise<ListActionResult> {
  await requireAdmin()
  const db = createAdminClient()
  const { data: resource } = await db.from("resources").select("content").eq("id", id).maybeSingle()
  if (!resource?.content) return { ok: false, message: "There is no published version to go back to." }

  const { error } = await db.from("resources").update({ draft_content: null, draft_updated_at: null }).eq("id", id)
  if (error) return { ok: false, message: `Couldn't discard: ${error.message}` }
  refresh()
  return { ok: true, message: "Draft discarded." }
}

/** Hides the list from members; the content and any draft stay. */
export async function unpublishList(id: string): Promise<ListActionResult> {
  await requireAdmin()
  const { error } = await createAdminClient().from("resources").update({ status: "draft" }).eq("id", id).eq("type", "list")
  if (error) return { ok: false, message: `Couldn't unpublish: ${error.message}` }
  refresh()
  return { ok: true, message: "Unpublished. Members no longer see it." }
}
