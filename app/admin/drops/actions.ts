"use server"

import { refresh } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { monthName, nextFreeMonth, zonedToUtc } from "@/lib/admin/drops"
import { type FormState, readFields } from "@/lib/auth/form-state"
import { fieldErrors } from "@/lib/auth/schemas"
import { requireAdmin } from "@/lib/dal/auth"
import { createAdminClient } from "@/lib/supabase/admin"

// Drop actions (AW7). Each checks requireAdmin() before using the
// service-role client.

export type DropActionResult = { ok: boolean; message: string }

/** "New drop": the next month without a drop, going live on its 1st at 09:00. */
export async function createDrop(): Promise<void> {
  await requireAdmin()
  const db = createAdminClient()
  const { data: drops } = await db.from("drops").select("month")
  const month = nextFreeMonth((drops ?? []).map((d) => d.month), new Date())
  const { data, error } = await db
    .from("drops")
    .insert({ month, title: `${monthName(month)} drop`, published_at: zonedToUtc(month, "09:00") })
    .select("id")
    .single()
  if (error) throw new Error(`Couldn't create the drop: ${error.message}`)
  redirect(`/admin/drops?drop=${data.id}`)
}

const dropSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1, "Required").max(120),
  theme: z.string().trim().max(60),
  introMd: z.string().trim().max(2000, "At most 2000 characters"),
  date: z.iso.date("Pick a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Pick a time"),
})

/** Saves title, theme, intro and go-live time (entered in the business time zone). */
export async function saveDrop(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const raw = readFields(formData, ["id", "title", "theme", "introMd", "date", "time"])
  const parsed = dropSchema.safeParse(raw)
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values: raw }

  const { id, title, theme, introMd, date, time } = parsed.data
  const db = createAdminClient()
  const { data: drop } = await db.from("drops").select("announced_at").eq("id", id).maybeSingle()
  if (!drop) return { status: "error", message: "This drop no longer exists." }

  const { error } = await db
    .from("drops")
    .update({
      title,
      theme: theme || null,
      intro_md: introMd || null,
      // An announced drop keeps its date: the email already named it.
      ...(!drop.announced_at && { published_at: zonedToUtc(date, time) }),
    })
    .eq("id", id)
  if (error) return { status: "error", message: `Couldn't save: ${error.message}`, values: raw }

  refresh()
  return { status: "success", message: "Saved." }
}

/** Attaches or detaches a resource. */
export async function setDropResource(dropId: string, resourceId: string, attach: boolean): Promise<DropActionResult> {
  await requireAdmin()
  if (!z.uuid().safeParse(dropId).success || !z.uuid().safeParse(resourceId).success) {
    return { ok: false, message: "Unknown drop or content." }
  }
  const db = createAdminClient()
  let query = db.from("resources").update({ drop_id: attach ? dropId : null }).eq("id", resourceId)
  if (!attach) query = query.eq("drop_id", dropId)
  const { error } = await query
  if (error) return { ok: false, message: `Couldn't update: ${error.message}` }
  refresh()
  return { ok: true, message: attach ? "Added to the drop." : "Removed from the drop." }
}

/** "Publish now": goes live immediately. The announcement email comes with Phase 10. */
export async function publishDropNow(id: string): Promise<DropActionResult> {
  await requireAdmin()
  const { error } = await createAdminClient().from("drops").update({ published_at: new Date().toISOString() }).eq("id", id)
  if (error) return { ok: false, message: `Couldn't publish: ${error.message}` }
  refresh()
  return { ok: true, message: "The drop is live." }
}

/** Deletes a drop; its content stays in the library without a drop. */
export async function deleteDrop(id: string): Promise<DropActionResult> {
  await requireAdmin()
  const { error } = await createAdminClient().from("drops").delete().eq("id", id)
  if (error) return { ok: false, message: `Couldn't delete: ${error.message}` }
  redirect("/admin/drops")
}
