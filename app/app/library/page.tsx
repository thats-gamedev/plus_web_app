import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { LibraryCard } from "@/components/library/library-card"
import { LibraryToolbar } from "@/components/library/library-toolbar"
import { PageHeader } from "@/components/layout/page-header"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { hasActiveFilters, LIBRARY_PATH, parseLibraryFilters } from "@/lib/content/library-filters"
import { requirePlus } from "@/lib/dal/auth"
import { getLibrary } from "@/lib/dal/content"

export const metadata: Metadata = { title: "Library" }

export default function LibraryPage({ searchParams }: PageProps<"/app/library">) {
  return (
    <>
      <PageHeader title="Library" />
      <Suspense fallback={<LibrarySkeleton />}>
        <Library searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function Library({ searchParams }: Pick<PageProps<"/app/library">, "searchParams">) {
  await requirePlus()
  const filters = parseLibraryFilters(await searchParams)
  const resources = await getLibrary(filters)
  const now = new Date()

  return (
    <>
      <LibraryToolbar filters={filters} count={resources.length} />
      {resources.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {resources.map((resource) => (
            <li key={resource.id}>
              <LibraryCard resource={resource} now={now} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-card border border-border bg-card px-6 py-12 text-center">
          <p className="text-lg font-semibold">
            {hasActiveFilters(filters) ? "Nothing matches." : "The library is still empty."}
          </p>
          <p className="mt-1 text-muted-foreground">
            {hasActiveFilters(filters)
              ? "Try another search, or clear the filters."
              : "The first lists and guides arrive with the next drop."}
          </p>
          {hasActiveFilters(filters) && (
            <Link href={LIBRARY_PATH} className={buttonVariants({ variant: "outline", className: "mt-5" })}>
              Clear filters
            </Link>
          )}
        </div>
      )}
    </>
  )
}

function LibrarySkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="mb-6 h-10 w-full" />
      <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-card md:h-72" />
        ))}
      </div>
    </div>
  )
}
