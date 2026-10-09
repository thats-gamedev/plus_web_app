"use server"

import { refresh } from "next/cache"
import { redirect } from "next/navigation"
import { type FormState, readFields } from "@/lib/auth/form-state"
import { fieldErrors } from "@/lib/auth/schemas"
import { dropAssignment } from "@/lib/admin/drop-position"
import { documentFormSchema, newResourceSchema } from "@/lib/content/document-schema"
import { newListId, slugify, uniqueSlug } from "@/lib/content/slug"
import { requireAdmin } from "@/lib/dal/auth"
import { emptyListDocument } from "@/lib/lists/schema"
import { createAdminClient } from "@/lib/supabase/admin"

// Admin content actions (Phase 8). Every action checks requireAdmin() before
// it touches the service-role client.

const UNIQUE_VIOLATION = "23505"

async function takenSlugs(db: ReturnType<typeof createAdminClient>, base: string): Promise<Set<string>> {
  const { data } = await db.from("resources").select("slug").like("slug", `${base}%`)
  return new Set((data ?? []).map((r) => r.slug))
}

/** "New list" / "New e-book / guide": creates a draft and opens its editor. */
export async function createResource(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const raw = readFields(formData, ["type", "title", "category", "kind"])
  const parsed = newResourceSchema.safeParse(raw)
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values: raw }

  const db = createAdminClient()
  const base = slugify(parsed.data.title)
  const slug = uniqueSlug(base, await takenSlugs(db, base || "untitled"))
  const now = new Date().toISOString()

  const row =
    parsed.data.type === "list"
      ? {
          type: "list" as const,
          list_kind: parsed.data.kind,
          // A new list starts as a draft document with one "General" section.
          draft_content: emptyListDocument(parsed.data.kind, newListId("sec")),
          draft_updated_at: now,
        }
      : { type: parsed.data.type, body_md: "" }

  const { data, error } = await db
    .from("resources")
    .insert({ ...row, title: parsed.data.title, slug, category: parsed.data.category, status: "draft" })
    .select("id")
    .single()
  if (error) return { status: "error", message: `Couldn't create it: ${error.message}`, values: raw }

  redirect(`/admin/content/${data.id}`)
}

/** Saves an e-book or guide (the plain form). Publishing is a separate action. */
export async function saveDocument(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const raw = readFields(formData, ["title", "slug", "category", "summary", "bodyMd", "coverPath", "filePath", "dropId"])
  const parsed = documentFormSchema.safeParse(raw)
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values: raw }

  const d = parsed.data
  const db = createAdminClient()
  const { error } = await db
    .from("resources")
    .update({
      title: d.title,
      slug: d.slug,
      category: d.category,
      summary: d.summary,
      body_md: d.bodyMd,
      cover_path: d.coverPath,
      file_path: d.filePath,
      // Joining a drop places it last; staying keeps its place.
      ...(await dropAssignment(db, id, d.dropId)),
    })
    .eq("id", id)
    .in("type", ["ebook", "guide"])
  if (error?.code === UNIQUE_VIOLATION) {
    return { status: "error", fieldErrors: { slug: "Another resource already uses this slug." }, values: raw }
  }
  if (error) return { status: "error", message: `Couldn't save: ${error.message}`, values: raw }

  refresh()
  return { status: "success", message: "Saved." }
}

export type ContentActionResult = { ok: boolean; message: string }

/** Publish or unpublish an e-book or guide. Lists publish from the list editor. */
export async function setDocumentStatus(id: string, status: "published" | "draft"): Promise<ContentActionResult> {
  await requireAdmin()
  if (status !== "published" && status !== "draft") return { ok: false, message: "Unknown status." }
  const db = createAdminClient()

  const { data: resource } = await db.from("resources").select("type, file_path, published_at").eq("id", id).maybeSingle()
  if (!resource || resource.type === "list") return { ok: false, message: "Not an e-book or guide." }
  if (status === "published" && resource.type === "ebook" && !resource.file_path) {
    return { ok: false, message: "Upload the PDF before publishing the e-book." }
  }

  const { error } = await db
    .from("resources")
    .update({ status, ...(status === "published" && !resource.published_at && { published_at: new Date().toISOString() }) })
    .eq("id", id)
  if (error) return { ok: false, message: `Couldn't update: ${error.message}` }

  refresh()
  return { ok: true, message: status === "published" ? "Published. Members can see it now." : "Unpublished. Members no longer see it." }
}

/** Deletes a resource and its uploaded files. Drops keep working without it. */
export async function deleteResource(id: string): Promise<ContentActionResult> {
  await requireAdmin()
  const db = createAdminClient()
  const { data: resource } = await db.from("resources").select("title, cover_path, file_path").eq("id", id).maybeSingle()
  if (!resource) return { ok: false, message: "It no longer exists." }

  const { error } = await db.from("resources").delete().eq("id", id)
  if (error) return { ok: false, message: `Couldn't delete: ${error.message}` }

  // Best effort: a leftover file is harmless, a failed delete shouldn't block.
  if (resource.cover_path) await db.storage.from("covers").remove([resource.cover_path])
  if (resource.file_path) await db.storage.from("ebooks").remove([resource.file_path])

  redirect("/admin/content")
}
