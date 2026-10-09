"use server"

import { refresh } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { dropAssignment } from "@/lib/admin/drop-position"
import { monthName, nextFreeMonth, zonedToUtc } from "@/lib/admin/drops"
import { LIVE_STATUSES } from "@/lib/billing/status"
import { sendEmailSafely } from "@/lib/email"
import { dropAnnouncementEmail } from "@/lib/email/templates"
import { unsubscribeUrl } from "@/lib/email/unsubscribe"
import { getSiteUrl } from "@/lib/site-url"
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

/** Attaches a resource (at the end of the drop) or detaches it. */
export async function setDropResource(dropId: string, resourceId: string, attach: boolean): Promise<DropActionResult> {
  await requireAdmin()
  if (!z.uuid().safeParse(dropId).success || !z.uuid().safeParse(resourceId).success) {
    return { ok: false, message: "Unknown drop or content." }
  }
  const db = createAdminClient()
  const { error } = attach
    ? await db.from("resources").update(await dropAssignment(db, resourceId, dropId)).eq("id", resourceId)
    : await db.from("resources").update({ drop_id: null, drop_position: null }).eq("id", resourceId).eq("drop_id", dropId)
  if (error) return { ok: false, message: `Couldn't update: ${error.message}` }
  refresh()
  return { ok: true, message: attach ? "Added to the drop." : "Removed from the drop." }
}

/**
 * Saves the order of a drop's content (drag and drop on /admin/drops).
 * `orderedIds` must be exactly the drop's current content, so a stale
 * list from another tab can't detach or misplace anything.
 */
export async function reorderDropResources(dropId: string, orderedIds: string[]): Promise<DropActionResult> {
  await requireAdmin()
  const ids = z.array(z.uuid()).max(200).safeParse(orderedIds)
  if (!z.uuid().safeParse(dropId).success || !ids.success) return { ok: false, message: "Unknown drop or content." }

  const db = createAdminClient()
  const { data: current, error: readError } = await db.from("resources").select("id").eq("drop_id", dropId)
  if (readError) return { ok: false, message: `Couldn't load the drop: ${readError.message}` }
  const currentIds = new Set(current.map((r) => r.id))
  if (currentIds.size !== ids.data.length || !ids.data.every((id) => currentIds.has(id))) {
    return { ok: false, message: "The drop changed meanwhile. Reload the page and try again." }
  }

  const results = await Promise.all(
    ids.data.map((id, position) => db.from("resources").update({ drop_position: position }).eq("id", id).eq("drop_id", dropId))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, message: `Couldn't save the order: ${failed.error.message}` }

  refresh()
  return { ok: true, message: "Order saved." }
}

/** "Publish now": goes live immediately. The announcement email comes with Phase 10. */
export async function publishDropNow(id: string): Promise<DropActionResult> {
  await requireAdmin()
  const { error } = await createAdminClient().from("drops").update({ published_at: new Date().toISOString() }).eq("id", id)
  if (error) return { ok: false, message: `Couldn't publish: ${error.message}` }
  refresh()
  return { ok: true, message: "The drop is live." }
}

const SEND_CONCURRENCY = 8

/**
 * "Publish & announce" (spec): makes the drop live if it isn't yet and
 * emails every member who has drop emails on, once. Each email is
 * deduplicated per (member, drop), so running it again after an
 * interruption only reaches the members who didn't get it yet.
 */
export async function announceDrop(id: string): Promise<DropActionResult> {
  await requireAdmin()
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Unknown drop." }
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) return { ok: false, message: "UNSUBSCRIBE_SECRET is not set, so emails can't carry an unsubscribe link." }

  const db = createAdminClient()
  const { data: drop } = await db
    .from("drops")
    .select("id, month, title, theme, intro_md, published_at, resources (title, status, drop_position)")
    .eq("id", id)
    .maybeSingle()
  if (!drop) return { ok: false, message: "This drop no longer exists." }

  const now = new Date().toISOString()
  if (!drop.published_at || drop.published_at > now) {
    const { error } = await db.from("drops").update({ published_at: now }).eq("id", id)
    if (error) return { ok: false, message: `Couldn't publish: ${error.message}` }
  }

  // Members (live subscription) who have drop emails on.
  const { data: subs } = await db.from("subscriptions").select("user_id").in("status", [...LIVE_STATUSES]).not("user_id", "is", null)
  const memberIds = [...new Set((subs ?? []).map((s) => s.user_id as string))]
  const { data: recipients } = memberIds.length
    ? await db.from("profiles").select("id, email").in("id", memberIds).eq("drop_emails", true)
    : { data: [] }

  const siteUrl = await getSiteUrl()
  const highlights = [...drop.resources]
    .filter((r) => r.status === "published")
    .sort((a, b) => (a.drop_position ?? Infinity) - (b.drop_position ?? Infinity))
    .slice(0, 3)
    .map((r) => r.title)
  const base = {
    monthName: monthName(drop.month),
    theme: drop.theme ?? drop.title,
    intro: drop.intro_md,
    highlights,
    siteUrl,
  }

  let sent = 0
  let skipped = 0
  let failed = 0
  const queue = [...(recipients ?? [])]
  await Promise.all(
    Array.from({ length: SEND_CONCURRENCY }, async () => {
      for (let r = queue.shift(); r; r = queue.shift()) {
        const unsubscribe = unsubscribeUrl(siteUrl, r.id, secret)
        const result = await sendEmailSafely({
          to: r.email,
          userId: r.id,
          kind: "drop_announcement",
          refId: drop.id,
          content: dropAnnouncementEmail({ ...base, unsubscribeUrl: unsubscribe }),
          headers: { "List-Unsubscribe": `<${unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        })
        if (result === "sent") sent++
        else if (result === "duplicate") skipped++
        else failed++
      }
    })
  )

  // Announced once nothing failed; a retry sends only what's missing.
  if (failed === 0) await db.from("drops").update({ announced_at: now }).eq("id", id).is("announced_at", null)
  refresh()
  if (failed) return { ok: false, message: `${sent} sent, ${failed} failed${skipped ? `, ${skipped} already had it` : ""}. Run it again to retry the failed ones.` }
  return { ok: true, message: `Announced: ${sent} ${sent === 1 ? "email" : "emails"} sent${skipped ? `, ${skipped} already had it` : ""}.` }
}

/** Deletes a drop; its content stays in the library without a drop. */
export async function deleteDrop(id: string): Promise<DropActionResult> {
  await requireAdmin()
  const { error } = await createAdminClient().from("drops").delete().eq("id", id)
  if (error) return { ok: false, message: `Couldn't delete: ${error.message}` }
  redirect("/admin/drops")
}
