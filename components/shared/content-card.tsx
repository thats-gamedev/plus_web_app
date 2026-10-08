import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { PlaceholderCover } from "@/components/ui/placeholder-cover"
import { ResourceIcon } from "@/components/shared/resource-icon"
import {
  categoryLabels,
  categoryTones,
  isNewResource,
  resourceTypeLabel,
} from "@/lib/content/resources"
import type { ResourceCard } from "@/lib/dal/content"

// Library resource card: pastel tile, "Tools list · 3D", title and a "New"
// badge (inline on desktop, on the right on mobile), as in MW1 / MM1.
export function ContentCard({ resource, now }: { resource: ResourceCard; now: Date }) {
  const isNew = isNewResource(resource.publishedAt, now)

  return (
    <Link
      href={`/app/library/${resource.slug}`}
      className="flex items-center gap-4 rounded-card border border-border bg-card p-3 transition-colors hover:border-ink/30 md:p-3.5"
    >
      <PlaceholderCover tone={categoryTones[resource.category]} className="size-14">
        <ResourceIcon type={resource.type} listKind={resource.listKind} />
      </PlaceholderCover>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {resourceTypeLabel(resource)} · {categoryLabels[resource.category]}
          {isNew && (
            <Badge variant="new" className="hidden md:inline-flex">
              New
            </Badge>
          )}
        </p>
        <p className="mt-1 leading-snug font-semibold">{resource.title}</p>
      </div>
      {isNew && (
        <Badge variant="new" className="md:hidden">
          New
        </Badge>
      )}
    </Link>
  )
}
