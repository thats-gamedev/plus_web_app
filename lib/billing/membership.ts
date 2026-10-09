import type { Membership } from "@/lib/dal/auth"
import { isLiveStatus } from "@/lib/billing/status"

// What the account page shows for a membership (MW11–13). Pure, so each
// Stripe status maps to exactly one state in tests.

export type MembershipState =
  /** Paying normally (also trialing). */
  | "active"
  /** Payment failed; access continues while Stripe retries. */
  | "past_due"
  /** Canceled at period end: access until currentPeriodEnd. */
  | "ending"
  /** Had a membership that is over (canceled, unpaid, expired…). */
  | "ended"
  /** Never subscribed. */
  | "none"

export function membershipState(membership: Membership | null): MembershipState {
  if (!membership) return "none"
  if (!isLiveStatus(membership.status)) return "ended"
  if (membership.status === "past_due") return "past_due"
  return membership.cancelAtPeriodEnd ? "ending" : "active"
}

export const membershipBadges: Record<
  Exclude<MembershipState, "none">,
  { label: string; variant: "success" | "warning" | "info" | "muted" }
> = {
  active: { label: "Active", variant: "success" },
  past_due: { label: "Past due", variant: "warning" },
  ending: { label: "Canceled", variant: "info" },
  ended: { label: "Ended", variant: "muted" },
}
