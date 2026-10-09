import { describe, expect, it } from "vitest"
import { computeKpis, formatCents, memberEvents, monthlyCents, shortAge, type SubscriptionFacts } from "./metrics"

const now = new Date("2026-10-04T12:00:00Z")

let n = 0
const sub = (over: Partial<SubscriptionFacts> = {}): SubscriptionFacts => ({
  id: `sub_${++n}`,
  userId: `user_${n}`,
  email: `m${n}@example.com`,
  plan: "founding_monthly",
  status: "active",
  cancelAtPeriodEnd: false,
  createdAt: "2026-09-10T10:00:00Z",
  canceledAt: null,
  endedAt: null,
  updatedAt: "2026-09-10T10:00:00Z",
  ...over,
})

describe("monthlyCents", () => {
  it("spreads the annual price over 12 months", () => {
    expect(monthlyCents("founding_monthly")).toBe(799)
    expect(monthlyCents("founding_annual")).toBe(658)
  })
})

describe("computeKpis", () => {
  const subs = [
    sub(), // active since September
    sub({ plan: "founding_annual" }),
    sub({ createdAt: "2026-10-02T09:00:00Z" }), // new this month
    sub({ status: "past_due" }),
    sub({ cancelAtPeriodEnd: true, canceledAt: "2026-10-01T08:00:00Z" }), // still live
    sub({ status: "canceled", endedAt: "2026-10-03T00:00:00Z", canceledAt: "2026-09-20T00:00:00Z" }), // churned this month
    sub({ status: "canceled", createdAt: "2026-08-01T00:00:00Z", endedAt: "2026-09-15T00:00:00Z" }), // ended before
    sub({ status: "incomplete_expired", createdAt: "2026-10-03T00:00:00Z" }), // never paid
  ]

  it("counts live members, MRR and new subscriptions", () => {
    const kpis = computeKpis(subs, now)
    expect(kpis.activeMembers).toBe(5)
    expect(kpis.mrrCents).toBe(799 * 4 + 658)
    expect(kpis.newThisMonth).toBe(1) // the abandoned checkout doesn't count
    expect(kpis.daysIntoMonth).toBe(4)
  })

  it("computes churn from members active at the start of the month", () => {
    const kpis = computeKpis(subs, now)
    // Active on 1 Oct: the five created in September that hadn't ended (four live + the one that ended on 3 Oct).
    expect(kpis.activeAtMonthStart).toBe(5)
    expect(kpis.endedThisMonth).toBe(1)
    expect(kpis.churn).toBeCloseTo(0.2)
  })

  it("splits alerts into scheduled cancellations and past due", () => {
    const kpis = computeKpis(subs, now)
    expect(kpis.scheduledCancellations).toBe(1)
    expect(kpis.pastDue).toBe(1)
  })

  it("counts a member with two live subscriptions once", () => {
    const twice = [sub({ userId: "same" }), sub({ userId: "same" })]
    expect(computeKpis(twice, now).activeMembers).toBe(1)
  })

  it("has no churn rate before there is a base", () => {
    expect(computeKpis([sub({ createdAt: "2026-10-01T10:00:00Z" })], now).churn).toBeNull()
  })
})

describe("memberEvents", () => {
  it("lists joins, scheduled cancellations, ends and failed payments, newest first", () => {
    const events = memberEvents(
      [
        sub({ email: "a@x", createdAt: "2026-09-01T00:00:00Z" }),
        sub({ email: "b@x", createdAt: "2026-09-02T00:00:00Z", cancelAtPeriodEnd: true, canceledAt: "2026-10-01T00:00:00Z" }),
        sub({ email: "c@x", createdAt: "2026-08-01T00:00:00Z", status: "canceled", endedAt: "2026-10-02T00:00:00Z", canceledAt: "2026-09-01T00:00:00Z" }),
        sub({ email: "d@x", createdAt: "2026-07-01T00:00:00Z", status: "past_due", updatedAt: "2026-10-03T00:00:00Z" }),
        sub({ email: "e@x", status: "incomplete" }),
      ],
      5
    )
    expect(events.map((e) => `${e.kind}:${e.email}`)).toEqual([
      "payment_failed:d@x",
      "ended:c@x",
      "cancellation_scheduled:b@x",
      "joined:b@x",
      "joined:a@x",
    ])
  })
})

describe("formatting", () => {
  it("shows compact ages", () => {
    expect(shortAge("2026-10-04T11:58:00Z", now)).toBe("2m")
    expect(shortAge("2026-10-04T10:00:00Z", now)).toBe("2h")
    expect(shortAge("2026-10-01T12:00:00Z", now)).toBe("3d")
    expect(shortAge("2026-05-01T12:00:00Z", now)).toBe("5mo")
  })

  it("formats cents, dropping .00", () => {
    expect(formatCents(139600)).toBe("$1,396")
    expect(formatCents(17150)).toBe("$171.50")
  })
})
