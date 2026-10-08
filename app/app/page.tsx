import type { Metadata } from "next"
import Form from "next/form"
import Link from "next/link"
import { Suspense } from "react"
import { SearchIcon } from "lucide-react"
import { Paywall } from "@/components/billing/paywall"
import { PageHeader } from "@/components/layout/page-header"
import { ContentCard } from "@/components/shared/content-card"
import { DropCard, dropMonthName, FirstDropCard } from "@/components/shared/drop-card"
import { PerksBanner } from "@/components/shared/perks-banner"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { parseConsent } from "@/lib/billing/consent"
import { getIsPlus, getProfile, requireUser } from "@/lib/dal/auth"
import { getCurrentDrop, getRecentResources } from "@/lib/dal/content"
import { parsePlan } from "@/lib/plans"

export const metadata: Metadata = { title: "Home" }

// Dates on the home page follow the business's time zone, not the server's.
const TIME_ZONE = "Europe/Berlin"
const RECENT_COUNT = 6

export default function MemberHomePage({ searchParams }: PageProps<"/app">) {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home searchParams={searchParams} />
    </Suspense>
  )
}

// Members see their home; everyone else signed in sees the paywall. Other
// member pages use requirePlus(), which sends non-members back here.
async function Home({ searchParams }: Pick<PageProps<"/app">, "searchParams">) {
  await requireUser()
  const [isPlus, profile] = await Promise.all([getIsPlus(), getProfile()])
  const name = profile?.displayName ?? ""

  if (!isPlus) {
    const params = await searchParams
    return (
      <Paywall
        name={name}
        selected={parsePlan(params.plan)}
        consentAt={parseConsent(params.consent)}
      />
    )
  }

  const [drop, recent] = await Promise.all([getCurrentDrop(), getRecentResources(RECENT_COUNT)])
  const now = new Date()
  const hey = name ? `Hey ${name}, ` : ""
  const title = drop
    ? `${hey}the ${dropMonthName(drop.month)} drop is live.`
    : `${hey}welcome to Plus.`

  return (
    <>
      <PageHeader
        eyebrow={<span className="hidden md:inline">{formatToday(now)}</span>}
        title={title}
        actions={<LibrarySearch />}
      />

      {drop ? <DropCard drop={drop} /> : <FirstDropCard arrivesOn={firstOfNextMonth(now)} />}

      <section className="mt-8 md:mt-10" aria-labelledby="recent-heading">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="recent-heading" className="text-xl font-bold md:text-2xl">
            Recently added
          </h2>
          <Link href="/app/library" className="hidden text-sm font-semibold text-brand hover:underline md:inline">
            Open library
          </Link>
        </div>
        {recent.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recent.map((resource) => (
              <li key={resource.id}>
                <ContentCard resource={resource} now={now} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-card border border-border bg-card p-6 text-muted-foreground">
            New lists, e-books and guides show up here as soon as they are published.
          </p>
        )}
      </section>

      {/* "New merch" goes here in Phase 6 (Fourthwall). */}

      <div className="mt-8 md:mt-10">
        <PerksBanner />
      </div>
    </>
  )
}

/** Desktop header search; mobile uses the search icon in the top bar. */
function LibrarySearch() {
  return (
    <Form action="/app/library" role="search" className="relative hidden w-64 md:block">
      <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" name="q" placeholder="Search the library" aria-label="Search the library" className="pl-9" />
    </Form>
  )
}

/** "Friday, 3 October" */
function formatToday(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ""
  return `${part("weekday")}, ${part("day")} ${part("month")}`
}

/** "1 November": drops go live at the start of a month. */
function firstOfNextMonth(now: Date) {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return next.toLocaleString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })
}

function HomeSkeleton() {
  return (
    <div aria-hidden className="space-y-6">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-64 w-full rounded-panel" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: RECENT_COUNT }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-card" />
        ))}
      </div>
    </div>
  )
}
