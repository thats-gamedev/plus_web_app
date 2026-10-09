"use server"

import { refresh } from "next/cache"
import { type FormState, readFields } from "@/lib/auth/form-state"
import { fieldErrors } from "@/lib/auth/schemas"
import { requirePlus } from "@/lib/dal/auth"
import { isOwnMediaPath, submissionMonth, submissionSchema } from "@/lib/spotlight/schema"
import { createClient } from "@/lib/supabase/server"

const UNIQUE_VIOLATION = "23505"

function parseJsonList(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Submits this month's Spotlight project. Runs as the member: RLS allows
 * only their own row, only while they are Plus, only for the current month,
 * and the unique (user_id, month) index allows one per month.
 */
export async function submitSpotlight(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePlus()
  const raw = readFields(formData, ["projectType", "engine", "title", "description", "videoUrl", "projectUrl", "mediaPaths", "credits", "consent"])
  const parsed = submissionSchema.safeParse({
    ...raw,
    mediaPaths: parseJsonList(raw.mediaPaths),
    credits: parseJsonList(raw.credits),
    consent: raw.consent === "on",
  })
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values: raw }
  }

  const s = parsed.data
  if (!s.mediaPaths.every((path) => isOwnMediaPath(user.id, path))) {
    return { status: "error", message: "Some images couldn't be verified. Upload them again.", values: raw }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("spotlight_submissions").insert({
    user_id: user.id,
    month: submissionMonth(),
    project_type: s.projectType,
    engine: s.engine,
    title: s.title,
    description: s.description,
    media_paths: s.mediaPaths,
    video_url: s.videoUrl,
    project_url: s.projectUrl,
    credits: s.credits,
    instagram_handle: s.credits.find((c) => c.platform === "instagram")?.handle ?? null,
    consent_at: new Date().toISOString(),
  })
  if (error?.code === UNIQUE_VIOLATION) {
    return { status: "error", message: "You already submitted a project this month. You can submit again next month." }
  }
  if (error) return { status: "error", message: `Couldn't submit: ${error.message}`, values: raw }

  refresh()
  return { status: "success", message: "Submitted. We'll let you know if it's picked." }
}
