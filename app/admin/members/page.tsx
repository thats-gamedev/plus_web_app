import type { Metadata } from "next"
import Link from "next/link"
import { CircleDollarSignIcon, MailIcon, TicketPercentIcon, UserMinusIcon, UserPlusIcon, CalendarXIcon } from "lucide-react"
import { cn } from "cn"
import { DeleteMemberButton, MemberDrawer, MembersToolbar } from "@/components/admin/members-ui"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  currentSubscription,
  filterMembers,
  memberState,
  memberTimeline,
  parseMemberFilter,
  type TimelineEntry,
} from "@/lib/admin/members"
import { membershipBadges } from "@/lib/billing/membership"
import { getMemberDetail, getMembers } from "@/lib/dal/admin"
import { formatDay } from "@/lib/format"
import { PLANS } from "@/lib/plans"
import { stripeDashboardUrl } from "@/lib/stripe/client"

export const metadata: Metadata = { title: "Members" }

// Members (AW2): search, status chips, table and a drawer per member. All
// state is in the URL (?q, ?status, ?member) so views can be linked to.
export default async function MembersPage({ searchParams }: PageProps<"/admin/members">) {
  const params = await searchParams
  const query = typeof params.q === "string" ? params.q : ""
  const filter = parseMemberFilter(params.status)
  const memberId = typeof params.member === "string" ? params.member : null

  const [all, detail] = await Promise.all([getMembers(), memberId ? getMemberDetail(memberId) : null])
  const members = filterMembers(all, query, filter)
  const exportQuery = new URLSearchParams({ ...(query && { q: query }), ...(filter !== "all" && { status: filter }) })
  const rowHref = (id: string) => {
    const next = new URLSearchParams({ ...(query && { q: query }), ...(filter !== "all" && { status: filter }), member: id })
    return `/admin/members?${next}`
  }

  return (
    <>
      <PageHeader
        title={
          <>
            Members <span className="text-lg font-normal text-muted-foreground">{all.length}</span>
          </>
        }
        actions={
          <a href={`/admin/members/export${exportQuery.size ? `?${exportQuery}` : ""}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Export CSV
          </a>
        }
      />
      <MembersToolbar filter={filter} query={query} />

      {members.length === 0 ? (
        <p className="rounded-card border border-border bg-card p-6 text-muted-foreground">No members match.</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Renews / ends</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const sub = currentSubscription(m)
                const state = memberState(m)
                return (
                  <tr key={m.id} className={cn("border-b border-border last:border-0 hover:bg-muted/40", m.id === memberId && "bg-brand-soft/60")}>
                    <td className="px-5 py-3">
                      <Link href={rowHref(m.id)} scroll={false} className="font-medium hover:underline">
                        {m.email}
                      </Link>
                      {m.role === "admin" && <Badge variant="default" className="ml-2">Admin</Badge>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{sub ? PLANS[sub.plan].name : "–"}</td>
                    <td className="px-5 py-3">
                      {state === "none" ? (
                        <span className="text-muted-foreground">No membership</span>
                      ) : (
                        <Badge variant={membershipBadges[state].variant}>{membershipBadges[state].label}</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{formatDay(sub?.createdAt ?? m.createdAt)}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {sub?.currentPeriodEnd && state !== "ended" ? formatDay(sub.currentPeriodEnd) : "–"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <MemberDrawer open={Boolean(detail)} title={detail?.member.email ?? "Member"}>
        {detail && <MemberDetailView detail={detail} />}
      </MemberDrawer>
    </>
  )
}

const timelineIcons: Record<TimelineEntry["kind"], typeof MailIcon> = {
  joined: UserPlusIcon,
  cancellation_scheduled: CalendarXIcon,
  ended: UserMinusIcon,
  codes_issued: TicketPercentIcon,
  code_revoked: TicketPercentIcon,
  email_sent: MailIcon,
}

function MemberDetailView({ detail }: { detail: NonNullable<Awaited<ReturnType<typeof getMemberDetail>>> }) {
  const { member, codes, emails } = detail
  const sub = currentSubscription(member)
  const state = memberState(member)
  const liveCodes = codes.filter((c) => c.status !== "revoked")
  const timeline = memberTimeline(member, codes, emails, (plan) => PLANS[plan].name)

  return (
    <div className="flex min-h-full flex-col p-6">
      <div className="pr-8">
        <h2 className="truncate text-xl font-semibold">{member.email}</h2>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {[member.stripeCustomerId, `joined ${formatDay(member.createdAt)}`].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        {state === "none" ? (
          <Badge variant="muted">No membership</Badge>
        ) : (
          <Badge variant={membershipBadges[state].variant}>{membershipBadges[state].label}</Badge>
        )}
        {sub && (
          <span className="text-muted-foreground">
            {PLANS[sub.plan].name}
            {sub.currentPeriodEnd && state !== "ended" && ` · ${formatDay(sub.currentPeriodEnd)}`}
          </span>
        )}
      </div>

      <h3 className="mt-6 text-sm font-semibold text-muted-foreground">Codes</h3>
      {liveCodes.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No live codes.</p>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {liveCodes.map((code) => (
            <div key={code.code} className="rounded-xl bg-muted p-3">
              <p className="flex items-center justify-between text-xs text-muted-foreground">
                {code.kind === "merch" ? "Merch" : "Promo"} {code.percent}%
                <span className={cn("size-2 rounded-full", code.status === "active" ? "bg-success" : "bg-warning")} aria-hidden />
                <span className="sr-only">{code.status === "active" ? "active" : "pending sync"}</span>
              </p>
              <p className="mt-1 font-mono text-sm">{code.code}</p>
            </div>
          ))}
        </div>
      )}

      <h3 className="mt-6 text-sm font-semibold text-muted-foreground">Activity</h3>
      {timeline.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ol className="mt-3 space-y-4">
          {timeline.map((entry, i) => {
            const Icon = timelineIcons[entry.kind]
            return (
              <li key={i} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon aria-hidden className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{entry.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{entry.detail}</p>
                </div>
                <time dateTime={entry.at} className="shrink-0 font-mono text-xs text-muted-foreground">
                  {formatDay(entry.at)}
                </time>
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-auto space-y-2 pt-8">
        {member.stripeCustomerId && (
          <a
            href={stripeDashboardUrl(`customers/${member.stripeCustomerId}`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            <CircleDollarSignIcon aria-hidden />
            Open in Stripe
          </a>
        )}
        <div className="flex gap-2">
          <a href={`/admin/members/${member.id}/export`} className={buttonVariants({ variant: "outline", className: "flex-1" })}>
            Export data
          </a>
          {member.role !== "admin" && <DeleteMemberButton memberId={member.id} email={member.email} />}
        </div>
        <p className="text-xs text-faint">Billing changes happen in Stripe, not here.</p>
      </div>
    </div>
  )
}

