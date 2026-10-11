import type { Metadata } from "next"
import Link from "next/link"
import { ExternalLinkIcon, PlayIcon, StarIcon } from "lucide-react"
import { cn } from "cn"
import { DownloadMedia, MonthSelect, SubmissionActions } from "@/components/admin/spotlight-actions"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { monthName } from "@/lib/admin/drops"
import { getAdminSubmissions, getSubmissionMonths } from "@/lib/dal/spotlight"
import { CREDIT_PLATFORMS, PROJECT_TYPES, STATUS_LABELS, submissionMonth } from "@/lib/spotlight/schema"
import { ListPage, listScroll } from "@/components/admin/list-page"

export const metadata: Metadata = { title: "Spotlight" }

const statuses = ["all", "submitted", "shortlisted", "featured", "declined"] as const
type Filter = (typeof statuses)[number]

const statusVariants = { submitted: "info", shortlisted: "warning", featured: "success", declined: "muted" } as const
const pastels = ["bg-pastel-mint", "bg-pastel-sky", "bg-pastel-cream", "bg-pastel-peach"]

// One look for every link on the card: small, grey, icon first.
const linkClass =
  "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground [&_svg]:size-3.5"

/** "Instagram mara.makes · ArtStation maramakes", for the tooltip. */
function credits(list: { platform: string; handle: string }[]) {
  return list.map((c) => `${CREDIT_PLATFORMS[c.platform as keyof typeof CREDIT_PLATFORMS] ?? c.platform} ${c.handle}`).join(" · ")
}

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
    <ListPage>
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
        <ul className={`grid gap-3 sm:grid-cols-2 lg:-mx-1 lg:grid-cols-3 lg:px-1 lg:pb-1 xl:grid-cols-4 ${listScroll}`}>
          {shown.map((s, i) => (
            <li key={s.id} className="flex flex-col overflow-hidden rounded-card border border-border bg-card">
              {/* The image is absolutely positioned so its own size can't
                  stretch the 16:9 box. */}
              <div className={cn("relative aspect-video overflow-hidden", pastels[i % pastels.length])}>
                {s.cover && (
                  // eslint-disable-next-line @next/next/no-img-element -- short-lived signed Storage URL
                  <img src={s.cover} alt="" className="absolute inset-0 size-full object-cover" />
                )}
                <Badge variant={statusVariants[s.status]} className={cn("absolute top-2.5 left-2.5", s.status === "declined" && "text-foreground")}>
                  {s.status === "declined" ? "Declined" : STATUS_LABELS[s.status]}
                </Badge>
              </div>

              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-semibold" title={s.title}>
                    {s.title}
                  </h2>
                  <p className="truncate text-xs text-muted-foreground" title={credits(s.credits)}>
                    {[
                      s.credits[0] ? `@${s.credits[0].handle.replace(/^https?:\/\//, "")}` : s.email,
                      s.projectType ? PROJECT_TYPES[s.projectType as keyof typeof PROJECT_TYPES] : null,
                      s.engine,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground" title={s.description}>
                  {s.description}
                </p>
                <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-1">
                  {s.projectUrl && (
                    <a href={s.projectUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      <ExternalLinkIcon aria-hidden />
                      Project
                    </a>
                  )}
                  {s.videoUrl && (
                    <a href={s.videoUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      <PlayIcon aria-hidden />
                      Video
                    </a>
                  )}
                  {s.featuredPostUrl && (
                    <a href={s.featuredPostUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      <StarIcon aria-hidden />
                      Post
                    </a>
                  )}
                  <DownloadMedia files={s.downloads} title={s.title} className={linkClass} />
                </div>
              </div>

              <div className="border-t border-border px-4 py-3">
                <SubmissionActions id={s.id} status={s.status} title={s.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ListPage>
  )
}
