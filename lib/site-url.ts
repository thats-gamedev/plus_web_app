import "server-only"
import { headers } from "next/headers"

/**
 * Absolute origin for links in emails (password reset, email change).
 * NEXT_PUBLIC_SITE_URL wins; otherwise the request's own origin, which
 * covers Vercel preview deployments.
 */
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/+$/, "")

  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

/** Link target for Supabase auth emails: /auth/callback, then `next`. */
export async function authCallbackUrl(next: string): Promise<string> {
  return `${await getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`
}
