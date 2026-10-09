import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site-url"

// Keep the member and admin areas, the API, auth callbacks and the one-time
// pages (welcome, emailed cancel links) out of search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/admin", "/api", "/auth", "/welcome", "/cancel/confirm", "/reset-password", "/styleguide"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
