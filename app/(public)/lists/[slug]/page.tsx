import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { AssetsList } from "@/components/lists/assets-list"
import { CreatorsList } from "@/components/lists/creators-list"
import { LockedBlurRows } from "@/components/lists/locked-rows"
import { PromptsList } from "@/components/lists/prompts-list"
import { ToolsList } from "@/components/lists/tools-list"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { categoryLabels, resourceSize, resourceTypeLabel } from "@/lib/content/resources"
import { getPublicList, type PublicList } from "@/lib/dal/public"
import { teaserItemCount } from "@/lib/lists/teaser"
import { PLANS } from "@/lib/plans"

// Public list teaser (LW12 / LM13): the items marked Teaser, rendered with the
// member components, then locked rows and a join card. The data is cached
// (lib/dal/public.ts); the slug is request data, so it streams in.

export async function generateMetadata({ params }: PageProps<"/lists/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const list = await getPublicList(slug)
  if (!list) return { title: "List not found" }
  return {
    title: list.title,
    description: list.summary || `${resourceTypeLabel({ type: "list", listKind: list.listKind })} from That's Game Dev Plus.`,
    alternates: { canonical: `/lists/${list.slug}` },
  }
}

export default function PublicListPage({ params }: PageProps<"/lists/[slug]">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-14 lg:px-10">
      <Suspense fallback={<ListSkeleton />}>
        <PublicListContent params={params} />
      </Suspense>
    </div>
  )
}

async function PublicListContent({ params }: Pick<PageProps<"/lists/[slug]">, "params">) {
  const { slug } = await params
  const list = await getPublicList(slug)
  if (!list) notFound()

  const free = teaserItemCount(list.doc)
  const total = Math.max(list.itemCount, free)
  const units = resourceSize({ type: "list", listKind: list.listKind, itemCount: total, wordCount: null })
  const now = new Date().toISOString()

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:gap-10">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted">{resourceTypeLabel({ type: "list", listKind: list.listKind })}</Badge>
          <Badge variant={list.category}>{categoryLabels[list.category]}</Badge>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">{list.title}</h1>
        <p className="mt-3 text-muted-foreground md:text-lg">
          <span className="hidden md:inline">{list.summary} </span>
          {free} of {total} shown free.
        </p>

        <div className="mt-6">
          <TeaserList list={list} now={now} />
        </div>
        {total > free && <LockedBlurRows total={total} className="mt-4 hidden md:block" />}
        <JoinCard total={total} units={units} className="mt-4 md:hidden" variant="dark" />
      </div>
      <aside className="hidden md:block">
        <JoinCard total={total} units={units} className="lg:sticky lg:top-24" />
      </aside>
    </div>
  )
}

function TeaserList({ list, now }: { list: PublicList; now: string }) {
  const { doc } = list
  // Only the teaser items are here, so no intro, filters or numbers from the full list.
  const teaser = { ...doc, intro: undefined }
  if (teaser.kind === "tools") return <ToolsList doc={teaser} now={now} />
  if (teaser.kind === "assets") return <AssetsList doc={teaser} now={now} />
  if (teaser.kind === "creators") return <CreatorsList doc={teaser} now={now} />
  return <PromptsList doc={teaser} now={now} />
}

function JoinCard({
  total,
  units,
  variant = "light",
  className,
}: {
  total: number
  units: string | null
  variant?: "light" | "dark"
  className?: string
}) {
  const dark = variant === "dark"
  return (
    <div className={`rounded-card p-5 ${dark ? "bg-ink text-white" : "border border-border bg-card"} ${className ?? ""}`}>
      <p className="text-lg leading-snug font-semibold">
        Unlock all {units ?? total} and a new drop every month.
      </p>
      {!dark && (
        <p className="mt-3">
          <span className="text-3xl font-bold">{PLANS.founding_monthly.price}</span>{" "}
          <span className="text-sm text-muted-foreground">/ month · founding price</span>
        </p>
      )}
      <Link href="/#pricing" className={`${buttonVariants({ size: "lg" })} mt-4 w-full`}>
        {dark ? `Join · ${PLANS.founding_monthly.price}/month` : "Join Plus"}
      </Link>
      {!dark && <p className="mt-3 text-xs text-muted-foreground">Cancel anytime · Prices include VAT</p>}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div aria-hidden className="space-y-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-card" />
      ))}
    </div>
  )
}
