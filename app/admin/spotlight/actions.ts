"use server"

import { refresh } from "next/cache"
import { z } from "zod"
import { requireAdmin } from "@/lib/dal/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export type SpotlightActionResult = { ok: boolean; message: string }

const statusSchema = z.enum(["submitted", "shortlisted", "featured", "declined"])

/**
 * Moves a submission through the queue (AW9). Featuring needs the link to
 * the Instagram post; the member's "you were featured" email comes with
 * Phase 10.
 */
export async function setSubmissionStatus(
  id: string,
  status: string,
  postUrl?: string
): Promise<SpotlightActionResult> {
  await requireAdmin()
  const parsedStatus = statusSchema.safeParse(status)
  if (!z.uuid().safeParse(id).success || !parsedStatus.success) return { ok: false, message: "Unknown submission or status." }

  let featuredPostUrl: string | null = null
  if (parsedStatus.data === "featured") {
    const url = z.url({ protocol: /^https$/ }).safeParse(postUrl?.trim())
    if (!url.success) return { ok: false, message: "Paste the link to the Instagram post (https://…)." }
    featuredPostUrl = url.data
  }

  const { error } = await createAdminClient()
    .from("spotlight_submissions")
    .update({ status: parsedStatus.data, featured_post_url: featuredPostUrl })
    .eq("id", id)
  if (error) return { ok: false, message: `Couldn't update: ${error.message}` }

  refresh()
  const messages = {
    submitted: "Moved back to submitted.",
    shortlisted: "Shortlisted.",
    featured: "Featured. The member sees the post link on their Spotlight page.",
    declined: "Declined. The member sees “Not picked this time”.",
  }
  return { ok: true, message: messages[parsedStatus.data] }
}
