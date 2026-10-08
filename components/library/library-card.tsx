import Image from "next/image"
import Link from "next/link"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { coverUrl } from "@/lib/content/covers"
import {
  categoryLabels,
  categoryTones,
  isNewResource,
  resourceSize,
  resourceTypeLabel,
} from "@/lib/content/resources"
import type { ResourceCard } from "@/lib/dal/content"

const toneClasses = {
  mint: "bg-pastel-mint",
  sky: "bg-pastel-sky",
  cream: "bg-pastel-cream",
  grey: "bg-pastel-grey",
} as const

// Library entry: a cover card in the desktop grid (MW2) and a compact row on
// mobile (MM3), from the same markup.
export function LibraryCard({ resource, now }: { resource: ResourceCard; now: Date }) {
  const isNew = isNewResource(resource.publishedAt, now)
  const typeLabel = resourceTypeLabel(resource)
  const category = categoryLabels[resource.category]
  const size = resourceSize(resource)
  const cover = resource.coverPath ? coverUrl(resource.coverPath) : null

  return (
    <Link
      href={`/app/library/${resource.slug}`}
      className="group flex h-full items-center gap-4 rounded-card border border-border bg-card p-3 transition-colors hover:border-ink/30 md:flex-col md:items-stretch md:gap-0 md:overflow-hidden md:p-0"
    >
      <div
        className={cn(
          "relative size-16 shrink-0 overflow-hidden rounded-xl md:h-32 md:w-full md:rounded-none",
          toneClasses[categoryTones[resource.category]]
        )}
      >
        {cover && (
          <Image src={cover} alt="" fill sizes="(min-width: 768px) 33vw, 64px" className="object-cover" />
        )}
        {isNew && (
          <Badge variant="new" className="absolute right-2.5 bottom-2.5 hidden md:inline-flex">
            New
          </Badge>
        )}
      </div>

      <div className="min-w-0 flex-1 md:p-4">
        {/* Mobile: one meta line. Desktop: type and category badges. */}
        <p className="text-xs text-muted-foreground md:hidden">
          {[typeLabel, category, size].filter(Boolean).join(" · ")}
        </p>
        <div className="hidden gap-1.5 md:flex">
          <Badge variant="muted" className="text-foreground">
            {typeLabel}
          </Badge>
          <Badge variant={resource.category}>{category}</Badge>
        </div>

        <h2 className="mt-1 leading-snug font-semibold md:mt-2.5 md:text-base">{resource.title}</h2>
        {resource.summary && (
          <p className="mt-1.5 hidden text-sm text-muted-foreground md:line-clamp-2">{resource.summary}</p>
        )}
        {size && <p className="mt-2 hidden font-mono text-xs text-muted-foreground md:block">{size}</p>}
        {isNew && (
          <Badge variant="new" className="mt-1.5 md:hidden">
            New
          </Badge>
        )}
      </div>
    </Link>
  )
}
