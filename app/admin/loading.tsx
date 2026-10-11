import { Skeleton } from "@/components/ui/skeleton"

// Shown the moment an admin link is clicked, while the page's data loads:
// a title row and a table card, the shape most admin pages share.
export default function AdminLoading() {
  return (
    <div aria-busy aria-label="Loading">
      <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
        <Skeleton className="h-9 w-48 md:h-10" />
        <Skeleton className="hidden h-9 w-32 sm:block" />
      </div>
      <div className="rounded-card border border-border bg-card p-5 md:p-6">
        <Skeleton className="mb-5 h-9 w-full max-w-sm" />
        <div className="space-y-3">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
