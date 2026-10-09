import "server-only"
import { revalidateTag } from "next/cache"

// Cache tag of the public pages' data (landing page, /lists/[slug],
// sitemap): see lib/dal/public.ts.
export const PUBLIC_CONTENT_TAG = "public-content"

/**
 * Call after publishing, unpublishing or deleting content or drops. Visitors
 * keep getting the cached page while it's rebuilt in the background.
 */
export function refreshPublicContent() {
  revalidateTag(PUBLIC_CONTENT_TAG, "max")
}
