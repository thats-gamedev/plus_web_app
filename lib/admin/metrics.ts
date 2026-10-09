import { isLiveStatus, type SubscriptionStatus } from "@/lib/billing/status"
import { PLAN_AMOUNTS, type PlanId } from "@/lib/plans"

// Admin overview numbers (AW1), computed from the subscriptions mirror so
// they can be checked against Stripe. Months are calendar months in UTC,
// like the daily snapshot. Pure, so every definition is unit-tested.

export type SubscriptionFacts = {
  id: string
  userId: string | null
  email: string | null
  plan: PlanId
  status: SubscriptionStatus
  cancelAtPeriodEnd: boolean
  createdAt: string
  canceledAt: string | null
  endedAt: string | null
  updatedAt: string
}

/** Never paid (checkout abandoned or first payment failed): not a member, ever. */
function neverStarted(status: SubscriptionStatus) {
  return status === "incomplete" || status === "incomplete_expired"
}

export function monthStartUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

/** Gross monthly revenue of one subscription in cents (annual spread over 12 months). */
export function monthlyCents(plan: PlanId): number {
  const { cents, months } = PLAN_AMOUNTS[plan]
  return Math.round(cents / months)
}

export type Kpis = {
  activeMembers: number
  mrrCents: number
  newThisMonth: number
  /** Ended this month ÷ active at the start of the month; null without a base. */
  churn: number | null
  endedThisMonth: number
  activeAtMonthStart: number
  daysIntoMonth: number
  scheduledCancellations: number
  pastDue: number
}

export function computeKpis(subscriptions: SubscriptionFacts[], now: Date): Kpis {
  const start = monthStartUtc(now).getTime()
  const live = subscriptions.filter((s) => isLiveStatus(s.status))
  const started = subscriptions.filter((s) => !neverStarted(s.status))

  // Several live subscriptions for one user still count as one member.
  const members = new Set(live.map((s) => s.userId ?? `sub:${s.id}`))

  const activeAtMonthStart = started.filter(
    (s) => Date.parse(s.createdAt) < start && (!s.endedAt || Date.parse(s.endedAt) >= start)
  ).length
  const endedThisMonth = subscriptions.filter((s) => s.endedAt && Date.parse(s.endedAt) >= start).length

  return {
    activeMembers: members.size,
    mrrCents: live.reduce((sum, s) => sum + monthlyCents(s.plan), 0),
    newThisMonth: started.filter((s) => Date.parse(s.createdAt) >= start).length,
    churn: activeAtMonthStart > 0 ? endedThisMonth / activeAtMonthStart : null,
    endedThisMonth,
    activeAtMonthStart,
    daysIntoMonth: Math.floor((now.getTime() - start) / 86_400_000) + 1,
    scheduledCancellations: live.filter((s) => s.cancelAtPeriodEnd && s.status !== "past_due").length,
    pastDue: live.filter((s) => s.status === "past_due").length,
  }
}

export type MemberEventKind = "joined" | "cancellation_scheduled" | "ended" | "payment_failed"

export type MemberEvent = {
  kind: MemberEventKind
  at: string
  email: string | null
  subscriptionId: string
}

/**
 * Latest member events for the overview feed, newest first. Derived from
 * the subscriptions mirror, so it needs no extra event table.
 */
export function memberEvents(subscriptions: SubscriptionFacts[], limit = 10): MemberEvent[] {
  const events: MemberEvent[] = []
  for (const s of subscriptions) {
    if (neverStarted(s.status)) continue
    const base = { email: s.email, subscriptionId: s.id }
    events.push({ kind: "joined", at: s.createdAt, ...base })
    if (s.endedAt) events.push({ kind: "ended", at: s.endedAt, ...base })
    else if (s.cancelAtPeriodEnd && s.canceledAt) events.push({ kind: "cancellation_scheduled", at: s.canceledAt, ...base })
    if (s.status === "past_due") events.push({ kind: "payment_failed", at: s.updatedAt, ...base })
  }
  return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, limit)
}

/** "2h", "1d", "3w": compact age for feeds and tables. */
export function shortAge(iso: string, now: Date): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - Date.parse(iso)) / 60_000))
  if (minutes < 60) return `${Math.max(1, minutes)}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return days < 60 ? `${days}d` : `${Math.floor(days / 30)}mo`
}

export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}
