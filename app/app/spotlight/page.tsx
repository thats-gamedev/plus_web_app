import type { Metadata } from "next"
import { Suspense } from "react"
import { StarIcon } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { SubmissionForm } from "@/components/spotlight/submission-form"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { monthName } from "@/lib/admin/drops"
import { requirePlus } from "@/lib/dal/auth"
import { getFeaturedLastMonth, getMySubmissions, type MySubmission } from "@/lib/dal/spotlight"
import { STATUS_LABELS, submissionMonth } from "@/lib/spotlight/schema"

export const metadata: Metadata = { title: "Spotlight" }

const statusVariants = {
  submitted: "info",
  shortlisted: "warning",
  featured: "success",
  declined: "muted",
} as const

const statusText: Record<MySubmission["status"], string> = {
  submitted: "We pick 3–5 projects at the end of the month. You'll hear from us if yours is one of them.",
  shortlisted: "You're on the shortlist. We post the picks at the end of the month.",
  featured: "Your project was featured on @thats_gamedev.",
  declined: "Not picked this time. Try again next month: new month, new chance.",
}

export default function SpotlightPage() {
  return (
    <>
      <PageHeader title="Spotlight" />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-card" />}>
        <Spotlight />
      </Suspense>
    </>
  )
}

// Spotlight (MW10 / MM12): one submission per calendar month. The form is
// replaced by this month's status card once submitted (spec).
async function Spotlight() {
  const user = await requirePlus()
  const [submissions, featured] = await Promise.all([getMySubmissions(), getFeaturedLastMonth()])
  const month = submissionMonth()
  const current = submissions.find((s) => s.month === month) ?? null
  const past = submissions.filter((s) => s.month !== month)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6 lg:order-1">
        {current ? <StatusCard submission={current} /> : <SubmissionForm userId={user.id} monthLabel={monthName(month)} />}
        {past.length > 0 && (
          <section aria-labelledby="past-heading">
            <h2 id="past-heading" className="mb-3 text-lg font-semibold">
              Past submissions
            </h2>
            <ul className="space-y-2">
              {past.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-card border border-border bg-card px-4 py-3">
                  <span className="font-mono text-xs text-muted-foreground">{s.month.slice(0, 7)}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{s.title}</span>
                  {s.featuredPostUrl && (
                    <a href={s.featuredPostUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand hover:underline">
                      View post
                    </a>
                  )}
                  <Badge variant={statusVariants[s.status]} className={s.status === "declined" ? "text-foreground" : undefined}>
                    {STATUS_LABELS[s.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="h-fit rounded-panel bg-ink p-6 text-white lg:order-2">
        <StarIcon aria-hidden className="size-6 text-brand" />
        <h2 className="mt-3 text-2xl font-bold">Get featured on @thats_gamedev</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Submit one project per month. We pick 3–5 every month and post them with credit, marked as a Plus member.
        </p>
        {featured.length > 0 && (
          <>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {featured.map((f) => (
                // eslint-disable-next-line @next/next/no-img-element -- short-lived signed Storage URL
                <img key={f.image} src={f.image} alt={f.title} className="aspect-square rounded-xl object-cover" />
              ))}
            </div>
            <p className="mt-2 font-mono text-xs text-ink-muted">Featured last month</p>
          </>
        )}
      </aside>
    </div>
  )
}

function StatusCard({ submission: s }: { submission: MySubmission }) {
  return (
    <section aria-labelledby="status-heading" className="rounded-card border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">{monthName(s.month)} submission</p>
        <Badge variant={statusVariants[s.status]} className={s.status === "declined" ? "text-foreground" : undefined}>
          {STATUS_LABELS[s.status]}
        </Badge>
      </div>
      <h2 id="status-heading" className="mt-2 text-2xl font-semibold">
        {s.title}
      </h2>
      <p className="mt-1 text-muted-foreground">{s.description}</p>
      {s.images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {s.images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element -- short-lived signed Storage URL
            <img key={src} src={src} alt="" className="aspect-[4/3] rounded-xl object-cover" />
          ))}
        </div>
      )}
      {s.videoUrl && (
        <a href={s.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
          Video link
        </a>
      )}
      <p className="mt-4 rounded-xl bg-muted/60 p-4 text-sm">{statusText[s.status]}</p>
      {s.featuredPostUrl && (
        <a href={s.featuredPostUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-semibold text-brand hover:underline">
          See the post
        </a>
      )}
    </section>
  )
}
