import type { Metadata } from "next"
import Form from "next/form"
import Link from "next/link"
import { RefreshCwIcon, SearchIcon } from "lucide-react"
import { cn } from "cn"
import { CodeRowAction, RetryPendingButton } from "@/components/admin/code-actions"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getAdminCodes } from "@/lib/dal/admin"
import { formatDay } from "@/lib/format"

export const metadata: Metadata = { title: "Codes" }

const statuses = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending_sync", label: "Pending sync" },
  { value: "revoked", label: "Revoked" },
] as const
type StatusFilter = (typeof statuses)[number]["value"]

const statusBadges = {
  active: { label: "Active", variant: "success" },
  pending_sync: { label: "Pending sync", variant: "warning" },
  revoked: { label: "Revoked", variant: "muted" },
} as const

// Codes (AW8): look up a code before invoicing a promotion, see what is
// waiting for Fourthwall, and revoke or reissue codes.
export default async function CodesPage({ searchParams }: PageProps<"/admin/codes">) {
  const params = await searchParams
  const query = typeof params.q === "string" ? params.q.trim() : ""
  const status: StatusFilter = statuses.some((s) => s.value === params.status) ? (params.status as StatusFilter) : "all"

  const all = await getAdminCodes()
  const pending = all.filter((c) => c.status === "pending_sync").length
  const q = query.toUpperCase()
  const codes = all.filter(
    (c) =>
      (status === "all" || c.status === status) &&
      (!q || c.code.includes(q) || c.email.toUpperCase().includes(q))
  )
  const href = (s: StatusFilter) => {
    const next = new URLSearchParams({ ...(query && { q: query }), ...(s !== "all" && { status: s }) })
    return next.size ? `/admin/codes?${next}` : "/admin/codes"
  }

  return (
    <>
      <PageHeader
        title="Codes"
        actions={
          <Form action="/admin/codes" role="search" className="relative w-full sm:w-80">
            <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Look up a code or email, e.g. TGD-PROMO-…"
              aria-label="Look up a code or email"
              className="pl-9 font-mono"
            />
            {status !== "all" && <input type="hidden" name="status" value={status} />}
          </Form>
        }
      />

      {pending > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-card border border-warning bg-warning-soft px-5 py-3.5">
          <RefreshCwIcon aria-hidden className="size-5 shrink-0" />
          <p className="flex-1 text-sm">
            {pending} merch {pending === 1 ? "code is" : "codes are"} pending Fourthwall sync. The daily cron retries
            at 03:15 UTC.
          </p>
          <RetryPendingButton />
        </div>
      )}

      <nav aria-label="Status" className="mb-4 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Link
            key={s.value}
            href={href(s.value)}
            aria-current={status === s.value ? "page" : undefined}
            className={cn(
              "inline-flex h-8 items-center rounded-full border px-3.5 text-sm font-medium",
              status === s.value ? "border-ink bg-ink text-white" : "border-input bg-card hover:border-ink"
            )}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      {codes.length === 0 ? (
        <p className="rounded-card border border-border bg-card p-6 text-muted-foreground">
          {query ? `No code or member matches "${query}".` : "No codes yet. Members get theirs when they join."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-5 py-3 font-medium">Kind</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className={cn("border-b border-border last:border-0", c.status === "pending_sync" && "bg-warning-soft/60")}>
                  <td className="px-5 py-3 font-mono font-medium">{c.code}</td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/members?member=${c.userId}`} className="hover:underline">
                      {c.email}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {c.kind === "merch" ? "Merch" : "Promotion"} {c.percent}%
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={statusBadges[c.status].variant}>{statusBadges[c.status].label}</Badge>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{formatDay(c.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <CodeRowAction codeId={c.id} userId={c.userId} status={c.status} code={c.code} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-sm text-faint">
        Promotion codes live only here. Look one up before invoicing a booked post.
      </p>
    </>
  )
}
