import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { dropMonthName } from "@/components/shared/drop-card"
import { defaultFilters, libraryHref } from "@/lib/content/library-filters"
import { categoryLabels, resourceTypeLabel } from "@/lib/content/resources"
import type { ResourceDetail } from "@/lib/dal/content"
import { formatDay } from "@/lib/format"

const sectionNames = {
  tools: "Tools",
  assets: "Assets",
  creators: "Creators",
  prompts: "Prompts",
  ebook: "E-books",
  guide: "Guides",
} as const

/** "Library › Tools", linking back to the matching library filter. */
export function ResourceBreadcrumb({ resource }: { resource: ResourceDetail }) {
  const key = resource.listKind ?? (resource.type as "ebook" | "guide")
  const href = resource.listKind
    ? libraryHref(defaultFilters, { kind: resource.listKind })
    : libraryHref(defaultFilters, { type: resource.type })

  return (
    <nav aria-label="Breadcrumb" className="mb-4 hidden text-sm text-muted-foreground md:block">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link href="/app/library" className="hover:text-foreground">
            Library
          </Link>
        </li>
        <li aria-hidden>
          <ChevronRightIcon className="size-3.5" />
        </li>
        <li>
          <Link href={href} className="hover:text-foreground">
            {sectionNames[key]}
          </Link>
        </li>
      </ol>
    </nav>
  )
}

/** Type, category and drop badges above a resource title. */
export function ResourceBadges({ resource }: { resource: ResourceDetail }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="muted" className="text-foreground">
        {resourceTypeLabel(resource)}
      </Badge>
      <Badge variant={resource.category}>{categoryLabels[resource.category]}</Badge>
      {resource.dropMonth && <Badge variant="new">{dropMonthName(resource.dropMonth)} drop</Badge>}
    </div>
  )
}

// Header for list pages (MW4–7): badges, title, summary and the size and
// last update on the right (under the title on mobile).
export function ListHeader({ resource, size }: { resource: ResourceDetail; size: string | null }) {
  const updated = formatDay(resource.updatedAt)

  return (
    <header className="mb-6">
      <ResourceBreadcrumb resource={resource} />
      <ResourceBadges resource={resource} />
      <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-8">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold md:text-4xl">{resource.title}</h1>
          {resource.summary && <p className="mt-2 hidden text-muted-foreground md:block">{resource.summary}</p>}
        </div>
        <p className="shrink-0 font-mono text-xs text-muted-foreground md:text-right">
          {size && (
            <>
              {size}
              <span className="md:hidden"> · </span>
              <br className="hidden md:block" />
            </>
          )}
          Updated {updated}
        </p>
      </div>
    </header>
  )
}
