import "server-only"
import { requireAdmin, requirePlus } from "@/lib/dal/auth"
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

export type AdminSubmission = {
  id: string
  month: string
  title: string
  description: string
  status: MySubmission["status"]
  projectType: string | null
  engine: string | null
  projectUrl: string | null
  videoUrl: string | null
  credits: { platform: string; handle: string }[]
  featuredPostUrl: string | null
  email: string
  /** Preview URL of the first image, if any. */
  cover: string | null
  /** Download links for every image. */
  downloads: { name: string; url: string }[]
  createdAt: string
}

/** All submissions of a month for the admin queue, with signed media links. */
export async function getAdminSubmissions(month: string): Promise<AdminSubmission[]> {
  await requireAdmin()
  const db = createAdminClient()
  const { data, error } = await db
    .from("spotlight_submissions")
    .select(
      "id, month, title, description, status, project_type, engine, project_url, video_url, credits, featured_post_url, media_paths, created_at, profile:profiles (email)"
    )
    .eq("month", month)
    .order("created_at", { ascending: true })
  if (error) throw new Error(`spotlight read: ${error.message}`)

  const paths = data.flatMap((s) => s.media_paths)
  const [previews, downloads] = paths.length
    ? await Promise.all([
        db.storage.from("spotlight").createSignedUrls(paths, SIGNED_SECONDS),
        db.storage.from("spotlight").createSignedUrls(paths, SIGNED_SECONDS, { download: true }),
      ])
    : [{ data: [] }, { data: [] }]
  const previewFor = new Map((previews.data ?? []).map((s) => [s.path, s.signedUrl]))
  const downloadFor = new Map((downloads.data ?? []).map((s) => [s.path, s.signedUrl]))

  return data.map((s) => ({
    id: s.id,
    month: s.month,
    title: s.title,
    description: s.description,
    status: s.status,
    projectType: s.project_type,
    engine: s.engine,
    projectUrl: s.project_url,
    videoUrl: s.video_url,
    credits: Array.isArray(s.credits) ? (s.credits as { platform: string; handle: string }[]) : [],
    featuredPostUrl: s.featured_post_url,
    email: s.profile?.email ?? "deleted member",
    cover: s.media_paths[0] ? (previewFor.get(s.media_paths[0]) ?? null) : null,
    downloads: s.media_paths
      .map((p) => ({ name: p.split("/").pop()?.replace(/^\d+-/, "") ?? p, url: downloadFor.get(p) ?? "" }))
      .filter((d) => d.url),
    createdAt: s.created_at,
  }))
}

/** Months that have submissions, newest first, always including the current one. */
export async function getSubmissionMonths(): Promise<string[]> {
  await requireAdmin()
  const { data } = await createAdminClient().from("spotlight_submissions").select("month")
  return [...new Set([submissionMonth(), ...(data ?? []).map((r) => r.month)])].sort().reverse()
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

