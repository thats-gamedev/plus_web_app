import type { MetadataRoute } from "next"
import { getPublicListSlugs } from "@/lib/dal/public"
import { SITE_URL } from "@/lib/site-url"

// Public pages only: the landing page, the list teasers and the legal and
// contract pages. Member and admin areas are excluded (see robots.ts).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lists = await getPublicListSlugs()
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    ...lists.map(({ slug }) => ({ url: `${SITE_URL}/lists/${slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...["/imprint", "/privacy", "/terms", "/withdrawal", "/cancel", "/withdraw"].map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ]
}
