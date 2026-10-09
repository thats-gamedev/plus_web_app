import { describe, expect, it } from "vitest"
import type { Membership } from "@/lib/dal/auth"
import { membershipState } from "./membership"
import type { SubscriptionStatus } from "./status"

const membership = (status: SubscriptionStatus, cancelAtPeriodEnd = false): Membership => ({
  plan: "founding_monthly",
  status,
  cancelAtPeriodEnd,
  currentPeriodEnd: "2026-11-08T21:57:19+00:00",
})

describe("membershipState", () => {
  it("is none without a subscription", () => {
    expect(membershipState(null)).toBe("none")
  })

  it("treats active and trialing as active", () => {
    expect(membershipState(membership("active"))).toBe("active")
    expect(membershipState(membership("trialing"))).toBe("active")
  })

  it("shows a scheduled cancellation as ending while access lasts", () => {
    expect(membershipState(membership("active", true))).toBe("ending")
  })

  it("flags failed payments, even when a cancellation is scheduled", () => {
    expect(membershipState(membership("past_due"))).toBe("past_due")
    expect(membershipState(membership("past_due", true))).toBe("past_due")
  })

  it("counts every status without access as ended", () => {
    for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"] as const) {
      expect(membershipState(membership(status))).toBe("ended")
    }
  })
})
