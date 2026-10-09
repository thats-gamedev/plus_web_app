import { z } from "zod"

// Spotlight submissions (spec, "Plus Spotlight"; fields from MW10). Shared
// by the member form and the Server Action, which validates again.

export const PROJECT_TYPES = {
  game: "Game",
  "3d_art": "3D art",
  animation: "Animation",
  tool: "Tool or plugin",
  other: "Something else",
} as const
export type ProjectType = keyof typeof PROJECT_TYPES

export const ENGINES = ["Blender", "Unity", "Unreal", "Godot", "Maya", "ZBrush", "Substance", "Houdini", "Other"] as const

export const CREDIT_PLATFORMS = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
  artstation: "ArtStation",
  website: "Website",
} as const
export type CreditPlatform = keyof typeof CREDIT_PLATFORMS

export const SPOTLIGHT_LIMITS = { images: 3, imageBytes: 10 * 1024 * 1024, description: 300 } as const

const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^https?:\/\/\S+\.\S+/.test(v), "Enter a full link, starting with https://")

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : /^https?:\/\//.test(v) ? v : `https://${v}`))
  .pipe(httpUrl.nullable())

/** "@mara.makes" or "https://instagram.com/mara.makes" → "mara.makes" (websites keep the URL). */
export function normalizeHandle(platform: CreditPlatform, value: string): string {
  const v = value.trim()
  if (platform === "website") return v
  const fromUrl = v.match(/^https?:\/\/[^/]+\/(?:@)?([^/?#]+)/)
  return (fromUrl ? fromUrl[1] : v).replace(/^@/, "")
}

const credit = z
  .object({ platform: z.enum(Object.keys(CREDIT_PLATFORMS) as [CreditPlatform, ...CreditPlatform[]]), handle: z.string() })
  .transform((c) => ({ platform: c.platform, handle: normalizeHandle(c.platform, c.handle) }))
  .pipe(
    z.object({
      platform: z.enum(Object.keys(CREDIT_PLATFORMS) as [CreditPlatform, ...CreditPlatform[]]),
      handle: z.string().min(1, "Add your handle for each platform you picked").max(100),
    })
  )

export const submissionSchema = z
  .object({
    projectType: z.enum(Object.keys(PROJECT_TYPES) as [ProjectType, ...ProjectType[]], { error: "Pick what it is" }),
    engine: z.string().trim().max(40).transform((v) => v || null),
    title: z.string().trim().min(1, "Give your project a title").max(80),
    description: z
      .string()
      .trim()
      .min(1, "Describe it in a sentence or two")
      .max(SPOTLIGHT_LIMITS.description, `At most ${SPOTLIGHT_LIMITS.description} characters`),
    mediaPaths: z.array(z.string().min(1).max(300)).max(SPOTLIGHT_LIMITS.images, `At most ${SPOTLIGHT_LIMITS.images} images`),
    videoUrl: optionalUrl,
    projectUrl: optionalUrl,
    credits: z.array(credit).min(1, "Pick at least one platform to be credited on").max(6),
    consent: z.literal(true, { error: "Please confirm that you own this work" }),
  })
  .refine((s) => s.mediaPaths.length > 0 || s.videoUrl, {
    message: "Add at least one image or a video link",
    path: ["mediaPaths"],
  })
  .refine((s) => new Set(s.credits.map((c) => c.platform)).size === s.credits.length, {
    message: "Each platform once",
    path: ["credits"],
  })

export type SubmissionInput = z.input<typeof submissionSchema>
export type Submission = z.output<typeof submissionSchema>

/** First day of the month (UTC) as YYYY-MM-01: one submission per member per month. */
export function submissionMonth(now: Date = new Date()): string {
  return `${now.toISOString().slice(0, 7)}-01`
}

export function previousMonth(month: string): string {
  const d = new Date(`${month}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() - 1)
  return d.toISOString().slice(0, 10)
}

/** Uploaded media must live in the member's own folder: {userId}/… */
export function isOwnMediaPath(userId: string, path: string): boolean {
  return path.startsWith(`${userId}/`) && !path.includes("..") && path.split("/").length === 2
}

export const STATUS_LABELS = {
  submitted: "Submitted",
  shortlisted: "Shortlisted",
  featured: "Featured",
  declined: "Not picked this time",
} as const
