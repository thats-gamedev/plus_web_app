import { Skeleton } from "@/components/ui/skeleton"

/** Placeholder while a form that reads the URL streams in. */
export function FormSkeleton({ fields }: { fields: number }) {
  return (
    <div aria-hidden className="space-y-5">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  )
}
