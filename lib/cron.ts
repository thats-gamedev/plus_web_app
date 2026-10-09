import "server-only"
import { timingSafeEqual } from "node:crypto"

/**
 * True when the request carries "Authorization: Bearer $CRON_SECRET", as
 * Vercel Cron sends it. Without a configured secret every call is refused.
 */
export function isCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(request.headers.get("authorization") ?? "")
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
