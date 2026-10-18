import type { MetadataRoute } from "next"
import { getPublicListSlugs } from "@/lib/dal/public"
import { SITE_URL } from "@/lib/site-url"

// Public pages only: the landing page, sign-up, the list teasers and the
// legal and contract pages. Member and admin areas and the login and password
// pages are excluded (see robots.ts and their noindex metadata).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lists = await getPublicListSlugs()
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1, images: [`${SITE_URL}/opengraph-image`] },
    { url: `${SITE_URL}/signup`, changeFrequency: "monthly", priority: 0.6 },
    ...lists.map(({ slug }) => ({ url: `${SITE_URL}/lists/${slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...["/imprint", "/privacy", "/terms", "/withdrawal", "/cancel", "/withdraw"].map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ]
}
