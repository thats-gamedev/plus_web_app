import "server-only"
import { createHmac } from "node:crypto"
import { headers } from "next/headers"

/**
 * A stable, non-reversible key for the visitor's IP address, for the
 * per-client rate limit of /cancel and /withdraw. The IP itself is never
 * stored. On Vercel the first x-forwarded-for entry is the client's address.
 * Null when there is no address (e.g. local scripts), which skips that limit.
 */
export async function clientKey(): Promise<string | null> {
  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!ip || !secret) return null
  return createHmac("sha256", secret).update(`request-rate:${ip}`).digest("hex").slice(0, 32)
}
