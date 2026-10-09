import type { Metadata } from "next"
import Link from "next/link"
import { cn } from "cn"
import { MembersChart } from "@/components/admin/members-chart"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import {
  computeKpis,
  formatCents,
  type MemberEventKind,
  memberEvents,
  monthStartUtc,
  shortAge,
} from "@/lib/admin/metrics"
import { getOpenCancellationRequests, getSnapshots, getSubscriptionFacts } from "@/lib/dal/admin"

export const metadata: Metadata = { title: "Admin overview" }

const DAY = 86_400_000

// Admin overview (AW1). The admin layout blocks on requireAdmin(), and every
// DAL call checks it again.
export default async function AdminOverviewPage() {
  const [subscriptions, snapshots, requests] = await Promise.all([
    getSubscriptionFacts(),
    getSnapshots(90),
    getOpenCancellationRequests(),
  ])
  const now = new Date()
  const kpis = computeKpis(subscriptions, now)
  const events = memberEvents(subscriptions, 10)

  // The last snapshot of the previous month is the baseline for "vs. Sep".
  const monthStart = monthStartUtc(now).toISOString().slice(0, 10)
  const baseline = snapshots.filter((s) => s.day < monthStart).at(-1) ?? null
  const latest = snapshots.at(-1) ?? null
  const previousMonth = new Date(Date.parse(monthStart) - DAY).toLocaleString("en-US", { month: "short", timeZone: "UTC" })
  const staleRequests = requests.filter((r) => now.getTime() - Date.parse(r.createdAt) > DAY).length

  const signed = (n: number, format = (v: number) => String(v)) => `${n >= 0 ? "+" : "−"}${format(Math.abs(n))}`

  return (
    <>
      <PageHeader
        title="Overview"
        actions={
          <p className="font-mono text-xs text-muted-foreground">
            {now.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
            {latest && ` · snapshot ${latest.day}`}
          </p>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Active members"
          value={kpis.activeMembers.toLocaleString("en-US")}
          delta={baseline ? `${signed(kpis.activeMembers - baseline.activeMembers)} this month` : `${kpis.newThisMonth} new this month`}
          positive={baseline ? kpis.activeMembers >= baseline.activeMembers : undefined}
        />
        <StatTile
          label="MRR (gross)"
          value={formatCents(kpis.mrrCents)}
          delta={baseline ? `${signed(kpis.mrrCents - baseline.mrrCents, (v) => formatCents(v))} vs. ${previousMonth}` : "incl. VAT, annual ÷ 12"}
          positive={baseline ? kpis.mrrCents >= baseline.mrrCents : undefined}
        />
        <StatTile
          label="New this month"
          value={String(kpis.newThisMonth)}
          delta={`${kpis.daysIntoMonth} ${kpis.daysIntoMonth === 1 ? "day" : "days"} in`}
        />
        <StatTile
          label="Churn this month"
          value={kpis.churn === null ? "–" : `${(kpis.churn * 100).toFixed(1)}%`}
          delta={`${kpis.endedThisMonth} ended / ${kpis.activeAtMonthStart} at start`}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <AlertCard
          href="/admin/members?status=canceling"
          title="Scheduled cancellations"
          text="Still active, ending at period end"
          count={kpis.scheduledCancellations}
          badge={{ label: "Watch", variant: "info" }}
        />
        <AlertCard
          href="/admin/members?status=past_due"
          title="Past due"
          text="Stripe is retrying"
          count={kpis.pastDue}
          badge={{ label: "Retry", variant: "warning" }}
        />
        <AlertCard
          href="/admin/inbox"
          title="Open cancellation requests"
          text="Older than 24 h"
          count={staleRequests}
          badge={{ label: "Action", variant: "danger" }}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <section className="rounded-card border border-border bg-card p-5 md:p-6" aria-labelledby="chart-title">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="chart-title" className="text-lg font-semibold">
              Active members · last 90 days
            </h2>
            <span className="hidden font-mono text-xs text-muted-foreground sm:inline">from member_snapshots</span>
          </div>
          <MembersChart points={snapshots.map((s) => ({ day: s.day, value: s.activeMembers }))} />
        </section>

        <section className="rounded-card border border-border bg-card p-5 md:p-6" aria-labelledby="events-title">
          <h2 id="events-title" className="mb-2 text-lg font-semibold">
            Latest events
          </h2>
          {events.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No member activity yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {events.map((event) => (
                <li key={`${event.kind}-${event.subscriptionId}`} className="flex items-center gap-3 py-2.5 text-sm">
                  <span aria-hidden className={cn("size-2 shrink-0 rounded-full", eventStyles[event.kind].dot)} />
                  <p className="min-w-0 flex-1 truncate">
                    <span className="font-semibold">{eventStyles[event.kind].label}</span>
                    <span className="text-muted-foreground"> · {event.email ?? "deleted member"}</span>
                  </p>
                  <time dateTime={event.at} className="shrink-0 font-mono text-xs text-muted-foreground">
                    {shortAge(event.at, now)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}

const eventStyles: Record<MemberEventKind, { label: string; dot: string }> = {
  joined: { label: "Joined", dot: "bg-success" },
  cancellation_scheduled: { label: "Cancellation scheduled", dot: "bg-info" },
  ended: { label: "Ended", dot: "bg-faint" },
  payment_failed: { label: "Payment failed", dot: "bg-danger" },
}

function StatTile({ label, value, delta, positive }: { label: string; value: string; delta: string; positive?: boolean }) {
  return (
    <div className="rounded-card border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-4xl font-bold tracking-tight">{value}</p>
      <p
        className={cn(
          "mt-1 font-mono text-xs",
          positive === undefined ? "text-muted-foreground" : positive ? "text-success" : "text-danger"
        )}
      >
        {delta}
      </p>
    </div>
  )
}

function AlertCard({
  href,
  title,
  text,
  count,
  badge,
}: {
  href: string
  title: string
  text: string
  count: number
  badge: { label: string; variant: "info" | "warning" | "danger" }
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-card border border-border bg-card px-5 py-4 transition-colors hover:border-ink/30"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{text}</span>
      </span>
      <span className="text-3xl font-bold">{count}</span>
      {/* The badge only appears when there is something to act on. */}
      {count > 0 ? <Badge variant={badge.variant}>{badge.label}</Badge> : <Badge variant="muted">OK</Badge>}
    </Link>
  )
}
