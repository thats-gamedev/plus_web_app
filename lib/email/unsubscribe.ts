import { createHmac, timingSafeEqual } from "node:crypto"

// Signed unsubscribe links for drop emails (spec): the token carries the
// user id and an HMAC, so nobody can unsubscribe others by guessing ids and
// no login is needed. Pure (the secret is passed in) so it can be tested.

const PURPOSE = "drop-emails:v1"

function mac(userId: string, secret: string): string {
  return createHmac("sha256", secret).update(`${PURPOSE}:${userId}`).digest("base64url")
}

export function signUnsubscribeToken(userId: string, secret: string): string {
  if (!secret) throw new Error("UNSUBSCRIBE_SECRET is not set")
  return `${Buffer.from(userId).toString("base64url")}.${mac(userId, secret)}`
}

/** The user id if the token is genuine, otherwise null. */
export function verifyUnsubscribeToken(token: string, secret: string): string | null {
  if (!secret) return null
  const [encodedId, signature] = token.split(".")
  if (!encodedId || !signature) return null
  const userId = Buffer.from(encodedId, "base64url").toString()
  const expected = Buffer.from(mac(userId, secret))
  const actual = Buffer.from(signature)
  return actual.length === expected.length && timingSafeEqual(actual, expected) ? userId : null
}

export function unsubscribeUrl(siteUrl: string, userId: string, secret: string): string {
  return `${siteUrl}/api/email/unsubscribe?t=${encodeURIComponent(signUnsubscribeToken(userId, secret))}`
}
