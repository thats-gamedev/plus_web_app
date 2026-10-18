import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site-url"

// Keep the member and admin areas, the API, auth callbacks and the one-time
// pages (welcome, emailed cancel links) out of search engines.
const PRIVATE = ["/app", "/admin", "/api", "/auth", "/welcome", "/cancel/confirm", "/reset-password", "/styleguide"]

// AI crawlers and assistants are welcome on the public pages (named here so
// it's explicit, with the same private paths): the search and answer bots
// of OpenAI, Anthropic, Perplexity, Google, Apple, Microsoft and others.
// /llms.txt and /llms-full.txt give them the site as plain Markdown.
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "DuckAssistBot",
  "MistralAI-User",
  "CCBot",
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_AGENTS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
