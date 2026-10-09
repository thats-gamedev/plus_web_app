"use server"

import { refresh } from "next/cache"
import { z } from "zod"
import { requireAdmin } from "@/lib/dal/auth"
import { sendEmailSafely } from "@/lib/email"
import { spotlightFeaturedEmail } from "@/lib/email/templates"
import { createAdminClient } from "@/lib/supabase/admin"

export type SpotlightActionResult = { ok: boolean; message: string }

const statusSchema = z.enum(["submitted", "shortlisted", "featured", "declined"])

/**
 * Moves a submission through the queue (AW9). Featuring needs the link to
 * the Instagram post and emails it to the member.
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

  const db = createAdminClient()
  const { data: submission, error } = await db
    .from("spotlight_submissions")
    .update({ status: parsedStatus.data, featured_post_url: featuredPostUrl })
    .eq("id", id)
    .select("user_id, title, profile:profiles (email, display_name)")
    .maybeSingle()
  if (error) return { ok: false, message: `Couldn't update: ${error.message}` }

  // "Featuring sends the member an email with the post link" (spec); once per submission.
  if (parsedStatus.data === "featured" && submission?.profile && featuredPostUrl) {
    await sendEmailSafely({
      to: submission.profile.email,
      userId: submission.user_id,
      kind: "spotlight_featured",
      refId: id,
      content: spotlightFeaturedEmail({ name: submission.profile.display_name, title: submission.title, postUrl: featuredPostUrl }),
    })
  }

  refresh()
  const messages = {
    submitted: "Moved back to submitted.",
    shortlisted: "Shortlisted.",
    featured: "Featured. The member gets an email and sees the post link on their Spotlight page.",
    declined: "Declined. The member sees “Not picked this time”.",
  }
  return { ok: true, message: messages[parsedStatus.data] }
}
