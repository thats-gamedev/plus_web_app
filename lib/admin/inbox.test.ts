import { describe, expect, it } from "vitest"
import { addBusinessDays, describeEventType } from "./inbox"

describe("addBusinessDays", () => {
  it("counts weekdays only", () => {
    // Thursday 1 Oct 2026 + 2 business days = Monday 5 Oct.
    expect(addBusinessDays("2026-10-01T09:05:00Z", 2).toISOString()).toBe("2026-10-05T09:05:00.000Z")
    // Monday + 2 = Wednesday.
    expect(addBusinessDays("2026-10-05T10:00:00Z", 2).toISOString().slice(0, 10)).toBe("2026-10-07")
  })

  it("starts counting on the next weekday when received on a weekend", () => {
    // Saturday 3 Oct + 2 business days = Tuesday 6 Oct.
    expect(addBusinessDays("2026-10-03T12:00:00Z", 2).toISOString().slice(0, 10)).toBe("2026-10-06")
  })
})

describe("describeEventType", () => {
  it("turns Stripe event types into short sentences", () => {
    expect(describeEventType("customer.subscription.updated")).toBe("Subscription updated")
    expect(describeEventType("checkout.session.completed")).toBe("Checkout session completed")
  })
})
