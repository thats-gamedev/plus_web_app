import "server-only"
import { requirePlus } from "@/lib/dal/auth"
import { previousMonth, submissionMonth } from "@/lib/spotlight/schema"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

// Spotlight reads for members. Their own rows and images go through RLS
// (spotlight bucket: members read their own folder). Images are private,
// so pages get short-lived signed URLs.

const SIGNED_SECONDS = 60 * 60

export type MySubmission = {
  id: string
  month: string
  title: string
  description: string
  status: "submitted" | "shortlisted" | "featured" | "declined"
  featuredPostUrl: string | null
  images: string[]
  videoUrl: string | null
  createdAt: string
}

/** The member's submissions, newest month first, with signed image URLs. */
export async function getMySubmissions(): Promise<MySubmission[]> {
  const user = await requirePlus()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("spotlight_submissions")
    .select("id, month, title, description, status, featured_post_url, media_paths, video_url, created_at")
    .eq("user_id", user.id)
    .order("month", { ascending: false })
  if (error) throw new Error(`spotlight read: ${error.message}`)

  const paths = data.flatMap((s) => s.media_paths)
  const signed = paths.length
    ? ((await supabase.storage.from("spotlight").createSignedUrls(paths, SIGNED_SECONDS)).data ?? [])
    : []
  const urlFor = new Map(signed.filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl]))

  return data.map((s) => ({
    id: s.id,
    month: s.month,
    title: s.title,
    description: s.description,
    status: s.status,
    featuredPostUrl: s.featured_post_url,
    images: s.media_paths.map((p) => urlFor.get(p)).filter((u): u is string => Boolean(u)),
    videoUrl: s.video_url,
    createdAt: s.created_at,
  }))
}

/**
 * First images of last month's featured projects, for the "Featured last
 * month" strip. They were posted publicly on Instagram, so showing them to
 * members is fine; members can't read other rows themselves, hence the
 * service-role client after requirePlus().
 */
export async function getFeaturedLastMonth(limit = 3): Promise<{ title: string; image: string }[]> {
  await requirePlus()
  const db = createAdminClient()
  const { data } = await db
    .from("spotlight_submissions")
    .select("title, media_paths")
    .eq("month", previousMonth(submissionMonth()))
    .eq("status", "featured")
    .order("created_at", { ascending: true })
    .limit(limit)
  const withImage = (data ?? []).filter((s) => s.media_paths.length > 0)
  if (withImage.length === 0) return []
  const { data: signed } = await db.storage.from("spotlight").createSignedUrls(
    withImage.map((s) => s.media_paths[0]),
    SIGNED_SECONDS
  )
  return withImage
    .map((s, i) => ({ title: s.title, image: signed?.[i]?.signedUrl ?? "" }))
    .filter((s) => s.image)
}

