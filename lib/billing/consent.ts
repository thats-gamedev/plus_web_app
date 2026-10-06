// The § 356 (5) BGB waiver: before checkout the member agrees to immediate
// access and acknowledges that the 14-day withdrawal right then expires. The
// time they ticked the box travels with the plan (through sign-up and email
// confirmation) and ends up in the Stripe subscription metadata.

// A tick older than this has to be given again.
const MAX_AGE_MS = 24 * 60 * 60 * 1000
// Allow for a client clock that runs a little fast.
const MAX_SKEW_MS = 5 * 60 * 1000

/** Returns the consent time as an ISO string if it is recent and valid, else null. */
export function parseConsent(value: unknown, now: Date = new Date()): string | null {
  if (typeof value !== "string" || value.length > 40) return null
  const time = Date.parse(value)
  if (Number.isNaN(time)) return null

  const age = now.getTime() - time
  if (age > MAX_AGE_MS || age < -MAX_SKEW_MS) return null
  return new Date(time).toISOString()
}
