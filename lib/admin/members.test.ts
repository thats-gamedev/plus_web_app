import { describe, expect, it } from "vitest"
import {
  filterMembers,
  type MemberRow,
  memberState,
  membersCsv,
  type MemberSubscription,
  memberTimeline,
  parseMemberFilter,
} from "./members"

const subscription = (over: Partial<MemberSubscription> = {}): MemberSubscription => ({
  stripeSubscriptionId: "sub_1",
  plan: "founding_monthly",
  status: "active",
  cancelAtPeriodEnd: false,
  currentPeriodEnd: "2026-11-08T00:00:00Z",
  createdAt: "2026-10-08T21:57:00Z",
  canceledAt: null,
  endedAt: null,
  ...over,
})

const member = (email: string, subs: MemberSubscription[] = [], over: Partial<MemberRow> = {}): MemberRow => ({
  id: email,
  email,
  displayName: email.split("@")[0],
  role: "member",
  createdAt: "2026-10-01T00:00:00Z",
  stripeCustomerId: null,
  subscriptions: subs,
  ...over,
})

const members = [
  member("mara@studio.com", [subscription()]),
  member("lena@proton.me", [subscription({ status: "past_due" })]),
  member("devin@indiecat.games", [subscription({ cancelAtPeriodEnd: true })]),
  member("felix@web.de", [subscription({ status: "canceled", endedAt: "2026-10-02T00:00:00Z" })]),
  member("visitor@example.com"),
]

describe("memberState and filterMembers", () => {
  it("uses the newest subscription", () => {
    const rejoined = member("x@y", [subscription(), subscription({ status: "canceled", endedAt: "2026-09-01T00:00:00Z" })])
    expect(memberState(rejoined)).toBe("active")
  })

  it("filters by state", () => {
    const emails = (filter: Parameters<typeof filterMembers>[2]) => filterMembers(members, "", filter).map((m) => m.email)
    expect(emails("all")).toHaveLength(5)
    expect(emails("active")).toEqual(["mara@studio.com"])
    expect(emails("past_due")).toEqual(["lena@proton.me"])
    expect(emails("canceling")).toEqual(["devin@indiecat.games"])
    expect(emails("ended")).toEqual(["felix@web.de"])
    expect(emails("none")).toEqual(["visitor@example.com"])
  })

  it("searches email and name case-insensitively", () => {
    expect(filterMembers(members, "  STUDIO ", "all").map((m) => m.email)).toEqual(["mara@studio.com"])
    expect(filterMembers(members, "lena", "past_due")).toHaveLength(1)
    expect(filterMembers(members, "lena", "active")).toHaveLength(0)
  })

  it("parses unknown filters as all", () => {
    expect(parseMemberFilter("canceling")).toBe("canceling")
    expect(parseMemberFilter("drop table")).toBe("all")
    expect(parseMemberFilter(undefined)).toBe("all")
  })
})

describe("membersCsv", () => {
  it("quotes fields and neutralises spreadsheet formulas", () => {
    const csv = membersCsv([member('=cmd|"/c calc"!A1@x.com', [subscription()], { displayName: '+Evil "name"' })])
    const [header, row] = csv.trim().split("\r\n")
    expect(header).toBe('"email","display_name","state","plan","status","joined","current_period_end","stripe_customer_id"')
    expect(row.startsWith(`"'=cmd|""/c calc""!A1@x.com","'+Evil ""name"""`)).toBe(true)
    expect(row).toContain('"active","founding_monthly","active"')
  })
})

describe("memberTimeline", () => {
  it("merges subscription events, code pairs and emails, newest first", () => {
    const m = member("mara@studio.com", [subscription({ cancelAtPeriodEnd: true, canceledAt: "2026-10-09T10:00:00Z" })])
    const timeline = memberTimeline(
      m,
      [
        { kind: "merch", createdAt: "2026-10-08T21:57:30.123Z", revokedAt: null },
        { kind: "promotion", createdAt: "2026-10-08T21:57:31.456Z", revokedAt: null },
      ],
      [{ kind: "welcome", refId: "sub_1", sentAt: "2026-10-08T21:58:00Z" }],
      () => "Founding monthly"
    )
    expect(timeline.map((e) => `${e.title}|${e.detail}`)).toEqual([
      "Cancellation scheduled|Access until period end",
      "Welcome email sent|sub_1",
      "Codes issued|merch + promotion",
      "Joined|Founding monthly · active",
    ])
  })
})
