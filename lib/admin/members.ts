import { membershipState, type MembershipState } from "@/lib/billing/membership"
import type { SubscriptionStatus } from "@/lib/billing/status"
import type { PlanId } from "@/lib/plans"

// Member list and drawer logic for /admin/members (AW2). Pure and unit-tested.

export type MemberSubscription = {
  stripeSubscriptionId: string
  plan: PlanId
  status: SubscriptionStatus
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
  createdAt: string
  canceledAt: string | null
  endedAt: string | null
}

export type MemberRow = {
  id: string
  email: string
  displayName: string
  role: "member" | "admin"
  createdAt: string
  stripeCustomerId: string | null
  /** Newest first. */
  subscriptions: MemberSubscription[]
}

/** The subscription that describes the member now: the newest one. */
export function currentSubscription(member: MemberRow): MemberSubscription | null {
  return member.subscriptions[0] ?? null
}

export function memberState(member: MemberRow): MembershipState {
  const sub = currentSubscription(member)
  return membershipState(
    sub && {
      plan: sub.plan,
      status: sub.status,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      currentPeriodEnd: sub.currentPeriodEnd,
    }
  )
}

export const MEMBER_FILTERS = ["all", "active", "past_due", "canceling", "ended", "none"] as const
export type MemberFilter = (typeof MEMBER_FILTERS)[number]

const filterStates: Record<Exclude<MemberFilter, "all">, MembershipState> = {
  active: "active",
  past_due: "past_due",
  canceling: "ending",
  ended: "ended",
  none: "none",
}

export function parseMemberFilter(value: unknown): MemberFilter {
  return typeof value === "string" && (MEMBER_FILTERS as readonly string[]).includes(value)
    ? (value as MemberFilter)
    : "all"
}

/** Search by email or name (case-insensitive) and filter by membership state. */
export function filterMembers(members: MemberRow[], query: string, filter: MemberFilter): MemberRow[] {
  const q = query.trim().toLowerCase()
  return members.filter((m) => {
    if (q && !m.email.toLowerCase().includes(q) && !m.displayName.toLowerCase().includes(q)) return false
    return filter === "all" || memberState(m) === filterStates[filter]
  })
}

/** CSV for the member export; quotes every field and neutralises formulas. */
export function membersCsv(members: MemberRow[]): string {
  const cell = (value: string | null) => {
    let v = value ?? ""
    // A leading = + - @ would run as a formula in Excel or Sheets.
    if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`
    return `"${v.replaceAll('"', '""')}"`
  }
  const header = ["email", "display_name", "state", "plan", "status", "joined", "current_period_end", "stripe_customer_id"]
  const rows = members.map((m) => {
    const sub = currentSubscription(m)
    return [m.email, m.displayName, memberState(m), sub?.plan ?? null, sub?.status ?? null, m.createdAt, sub?.currentPeriodEnd ?? null, m.stripeCustomerId].map(cell)
  })
  return [header.map(cell), ...rows].map((r) => r.join(",")).join("\r\n") + "\r\n"
}

export type TimelineEntry = {
  kind: "joined" | "cancellation_scheduled" | "ended" | "codes_issued" | "code_revoked" | "email_sent"
  at: string
  title: string
  detail: string
}

const emailTitles: Record<string, string> = {
  welcome: "Welcome email sent",
  cancellation_confirmed: "Cancellation email sent",
  cancellation_receipt: "Cancellation receipt sent",
  cancellation_verify: "Cancellation link sent",
  drop_announcement: "Drop email sent",
  spotlight_featured: "Spotlight email sent",
}

/** Activity for the member drawer, newest first. */
export function memberTimeline(
  member: MemberRow,
  codes: { kind: string; createdAt: string; revokedAt: string | null }[],
  emails: { kind: string; refId: string; sentAt: string }[],
  planName: (plan: PlanId) => string
): TimelineEntry[] {
  const entries: TimelineEntry[] = []

  for (const sub of member.subscriptions) {
    entries.push({ kind: "joined", at: sub.createdAt, title: "Joined", detail: `${planName(sub.plan)} · ${sub.status}` })
    if (sub.endedAt) entries.push({ kind: "ended", at: sub.endedAt, title: "Membership ended", detail: planName(sub.plan) })
    else if (sub.cancelAtPeriodEnd && sub.canceledAt) {
      entries.push({ kind: "cancellation_scheduled", at: sub.canceledAt, title: "Cancellation scheduled", detail: "Access until period end" })
    }
  }

  // Codes are issued in pairs; group by minute so a pair is one entry, timed
  // at the pair's first code (not the rounded minute, which ties with "Joined").
  const issued = new Map<string, { at: string; kinds: string[] }>()
  for (const code of codes) {
    const minute = code.createdAt.slice(0, 16)
    const group = issued.get(minute)
    if (!group) issued.set(minute, { at: code.createdAt, kinds: [code.kind] })
    else {
      group.kinds.push(code.kind)
      if (code.createdAt < group.at) group.at = code.createdAt
    }
    if (code.revokedAt) entries.push({ kind: "code_revoked", at: code.revokedAt, title: "Code revoked", detail: code.kind })
  }
  for (const { at, kinds } of issued.values()) {
    entries.push({ kind: "codes_issued", at, title: "Codes issued", detail: kinds.join(" + ") })
  }

  for (const email of emails) {
    entries.push({ kind: "email_sent", at: email.sentAt, title: emailTitles[email.kind] ?? "Email sent", detail: email.refId })
  }

  return entries.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}
