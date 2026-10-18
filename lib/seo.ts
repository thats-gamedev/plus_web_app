import type { Metadata } from "next"
import { instagramUrl } from "@/components/layout/nav-config"

// What search engines and LLMs read about the site: the shared name,
// descriptions and keywords for metadata (app/layout.tsx, the landing page),
// structured data (components/seo/json-ld.tsx) and /llms.txt.

export const SITE_NAME = "That's Game Dev Plus"

/** The one-line pitch: page titles, the manifest, llms.txt. */
export const TAGLINE = "The curated toolkit for game developers and 3D artists"

/** The default meta description (about 155 characters, the length search results show). */
export const DESCRIPTION =
  "Curated tools, assets, AI prompts and guides for game devs and 3D artists, updated every month. A membership from the team behind @thats_gamedev."

/** The longer description: structured data and llms.txt. */
export const LONG_DESCRIPTION =
  "That's Game Dev Plus is a membership for game developers and 3D artists by the team behind the @thats_gamedev Instagram page. Members get hand-picked lists of tools, assets and creators to follow (each pick with one line on why it made the list), AI prompt packs for concept art, code and marketing, guides and quarterly e-books on pricing, portfolios and workflows, a new drop every month, perks (15% off thats_gamedev merch, 10% off page promotions), a monthly chance to be featured on @thats_gamedev, and Code Your Hero Pro, a coming gamedev coding app for learning Unity C#."

export const KEYWORDS = [
  "game development resources",
  "game dev tools",
  "game assets",
  "3D art resources",
  "3D artist tools",
  "Blender resources",
  "Unity resources",
  "Unreal Engine resources",
  "Maya resources",
  "AI prompts for concept art",
  "AI prompts for game development",
  "indie game dev",
  "game dev membership",
  "curated game dev lists",
  "learn Unity C#",
  "thats_gamedev",
]

/** Profiles that are the same organization (schema.org sameAs). */
export const SAME_AS = [instagramUrl]

export const INSTAGRAM_HANDLE = "@thats_gamedev"

/**
 * Google Search Console ownership, by meta tag (app/layout.tsx). The same
 * property can also verify with the file public/google266e3c494526d3af.html;
 * keep both, removing either one can unverify the site.
 */
export const GOOGLE_SITE_VERIFICATION = "e1GG5bOJETcmrf119dGxe6i6wXi3jA8Ay1wMDwVV4_8"

/** The share image (app/opengraph-image.tsx). */
const SHARE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME}: the toolkit we'd hand a friend.` }

/**
 * Open Graph and Twitter metadata for a page. Next.js replaces these objects
 * per page instead of merging them with the root layout's, so every page
 * that sets its own goes through here to keep the site name, the share image
 * and the large card.
 */
export function socialMetadata({
  title,
  description = DESCRIPTION,
  path,
  type = "website",
}: {
  title: string
  description?: string
  /** The page's path; left out for the root layout's defaults. */
  path?: string
  type?: "website" | "article"
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: { type, siteName: SITE_NAME, locale: "en_US", url: path, title, description, images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE] },
  }
}

/** A public page's metadata: title, description, canonical URL and share data. */
export function pageMetadata({
  title,
  description,
  path,
  type,
}: {
  title: string
  description: string
  path: string
  type?: "website" | "article"
}): Metadata {
  return { title, description, alternates: { canonical: path }, ...socialMetadata({ title, description, path, type }) }
}
