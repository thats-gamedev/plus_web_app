import type { MetadataRoute } from "next"
import { DESCRIPTION, SITE_NAME, TAGLINE } from "@/lib/seo"

// Web app manifest: name, colours and icons for home screens and app stores
// (the icons are app/icon.png and app/apple-icon.png).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "GameDev Plus",
    description: `${TAGLINE}. ${DESCRIPTION}`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f3f3f3",
    theme_color: "#e2622b",
    categories: ["education", "productivity", "games"],
    icons: [
      { src: "/icon.png", sizes: "320x320", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  }
}
