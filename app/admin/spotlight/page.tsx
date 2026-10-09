import type { Metadata } from "next"
import Link from "next/link"
import { cn } from "cn"
import { DownloadMedia, MonthSelect, SubmissionActions } from "@/components/admin/spotlight-actions"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { monthName } from "@/lib/admin/drops"
import { getAdminSubmissions, getSubmissionMonths } from "@/lib/dal/spotlight"
import { CREDIT_PLATFORMS, PROJECT_TYPES, STATUS_LABELS, submissionMonth } from "@/lib/spotlight/schema"

export const metadata: Metadata = { title: "Spotlight" }

const statuses = ["all", "submitted", "shortlisted", "featured", "declined"] as const
type Filter = (typeof statuses)[number]

const statusVariants = { submitted: "info", shortlisted: "warning", featured: "success", declined: "muted" } as const
const pastels = ["bg-pastel-mint", "bg-pastel-sky", "bg-pastel-cream", "bg-pastel-peach"]

// Spotlight queue (AW9): a month's submissions with previews; Feature,
// Shortlist, Decline and Download media.
export default async function AdminSpotlightPage({ searchParams }: PageProps<"/admin/spotlight">) {
  const params = await searchParams
  const months = await getSubmissionMonths()
  const month = typeof params.month === "string" && months.includes(params.month) ? params.month : submissionMonth()
  const filter: Filter = statuses.includes(params.status as Filter) ? (params.status as Filter) : "all"
  const all = await getAdminSubmissions(month)
  const featured = all.filter((s) => s.status === "featured").length
  const shown = filter === "all" ? all : all.filter((s) => s.status === filter)
  const href = (s: Filter) => `/admin/spotlight?month=${month}${s === "all" ? "" : `&status=${s}`}`

  return (
    <>
      <PageHeader
        title={
          <>
            Spotlight{" "}
            <span className="font-mono text-lg font-normal text-muted-foreground">
              {monthName(month)} · {all.length}
            </span>
          </>
        }
        actions={<MonthSelect months={months} value={month} />}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <nav aria-label="Status" className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <Link
              key={s}
              href={href(s)}
              aria-current={filter === s ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-3.5 text-sm font-medium",
                filter === s ? "border-ink bg-ink text-white" : "border-input bg-card hover:border-ink"
              )}
            >
              {s === "all" ? "All" : s === "declined" ? "Declined" : STATUS_LABELS[s]}
            </Link>
          ))}
        </nav>
        <span className={cn("ml-auto font-mono text-xs", featured >= 3 && featured <= 5 ? "text-success" : "text-muted-foreground")}>
          {featured} of 3–5 featured
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-card border border-border bg-card p-6 text-muted-foreground">
          {all.length === 0 ? `No submissions for ${monthName(month)} yet.` : "Nothing with this status."}
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((s, i) => (
            <li key={s.id} className="flex flex-col overflow-hidden rounded-card border border-border bg-card">
              <div className={cn("relative aspect-[16/10]", pastels[i % pastels.length])}>
                {s.cover && (
                  // eslint-disable-next-line @next/next/no-img-element -- short-lived signed Storage URL
                  <img src={s.cover} alt="" className="size-full object-cover" />
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/30 to-transparent px-3 py-2">
                  <span className="font-mono text-xs text-white drop-shadow">
                    {s.downloads.length
                      ? `${s.downloads.length} ${s.downloads.length === 1 ? "image" : "images"}`
                      : s.videoUrl
                        ? "video link"
                        : "no media"}
                  </span>
                  <DownloadMedia files={s.downloads} title={s.title} />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {s.credits[0] ? `@${s.credits[0].handle.replace(/^https?:\/\//, "")}` : s.email}
                  </span>
                  <Badge variant={statusVariants[s.status]} className={s.status === "declined" ? "text-foreground" : undefined}>
                    {s.status === "declined" ? "Declined" : STATUS_LABELS[s.status]}
                  </Badge>
                </div>
                <h2 className="mt-2 text-lg font-semibold">{s.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div>
                    <dt className="inline">Type: </dt>
                    <dd className="inline">
                      {s.projectType ? PROJECT_TYPES[s.projectType as keyof typeof PROJECT_TYPES] : "–"}
                      {s.engine && ` · ${s.engine}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">Credit: </dt>
                    <dd className="inline">
                      {s.credits.map((c) => `${CREDIT_PLATFORMS[c.platform as keyof typeof CREDIT_PLATFORMS] ?? c.platform} ${c.handle}`).join(" · ")}
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-x-3">
                    {s.projectUrl && (
                      <a href={s.projectUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
                        Project
                      </a>
                    )}
                    {s.videoUrl && (
                      <a href={s.videoUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
                        Video
                      </a>
                    )}
                    {s.featuredPostUrl && (
                      <a href={s.featuredPostUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
                        Instagram post
                      </a>
                    )}
                  </div>
                </dl>
                <div className="mt-auto pt-4">
                  <SubmissionActions id={s.id} status={s.status} title={s.title} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
