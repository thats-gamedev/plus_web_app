"use client"

import { useMemo, useState } from "react"
import { ExternalLinkIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { externalLinkProps, FilterChips, ItemImage, MetaPill } from "@/components/lists/list-parts"
import { filterSections, formatTag, platformLabels, pricingLabels, toolTags } from "@/lib/lists/display"
import { isNewItem, type ListDocumentOf, type ToolItem } from "@/lib/lists/schema"

// Tools list (MW4 / MM5): tag chips, then numbered rows per section.
export function ToolsList({ doc, now }: { doc: ListDocumentOf<"tools">; now: string }) {
  const [tag, setTag] = useState<string | null>(null)
  const tags = useMemo(() => toolTags(doc), [doc])
  // Numbers follow the full list, so an item keeps its number when filtered.
  const numbers = useMemo(
    () => new Map(doc.sections.flatMap((s) => s.items).map((item, i) => [item.id, i + 1])),
    [doc]
  )
  const sections = filterSections(doc.sections, tag ? (item) => item.tags?.includes(tag) ?? false : null)

  return (
    <>
      {doc.intro && <p className="mb-6 max-w-prose text-muted-foreground">{doc.intro}</p>}
      <FilterChips values={tags} value={tag} onChange={setTag} format={formatTag} />

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={section.id}>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 id={section.id} className="text-xl font-bold md:text-2xl">
                {section.title}
              </h2>
              {section.description && (
                <p className="hidden text-sm text-muted-foreground md:block">{section.description}</p>
              )}
              <span className="ml-auto hidden font-mono text-xs text-muted-foreground md:inline">
                {section.items.length} {section.items.length === 1 ? "item" : "items"}
              </span>
            </div>
            <ul className="space-y-3 md:space-y-0 md:divide-y md:divide-border md:overflow-hidden md:rounded-card md:border md:border-border md:bg-card">
              {section.items.map((item) => (
                <li key={item.id}>
                  <ToolRow item={item} number={numbers.get(item.id) ?? 0} isNew={isNewItem(item.addedAt, new Date(now))} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}

function ToolRow({ item, number, isNew }: { item: ToolItem; number: number; isNew: boolean }) {
  const link = externalLinkProps(item.url, item.isAffiliate)
  const pills = [
    pricingLabels[item.pricing],
    ...(item.priceNote ? [item.priceNote] : []),
    ...(item.platforms ?? []).map((p) => platformLabels[p]),
  ]

  return (
    <div className="relative rounded-card border border-border bg-card p-4 md:grid md:grid-cols-[2.5rem_3rem_minmax(0,1fr)_minmax(0,15rem)_auto] md:items-center md:gap-4 md:rounded-none md:border-0 md:px-5 md:py-3.5">
      <span className="hidden font-mono text-sm text-brand md:block">{String(number).padStart(2, "0")}</span>
      <div className="flex items-center gap-3 md:contents">
        <ItemImage path={item.imagePath} sizes="48px" className="size-10 md:size-12" />
        <div className="min-w-0 flex-1 md:flex-none">
          <p className="flex flex-wrap items-center gap-2 pr-8 font-semibold md:pr-0">
            {item.name}
            {item.isAffiliate && <Badge variant="affiliate">Affiliate</Badge>}
            {isNew && <Badge variant="new">New</Badge>}
          </p>
          <p className="mt-0.5 hidden text-sm text-muted-foreground md:block">{item.why}</p>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground md:hidden">{item.why}</p>
      <div className="mt-3 flex flex-wrap gap-1.5 md:mt-0">
        {pills.map((pill) => (
          <MetaPill key={pill}>{pill}</MetaPill>
        ))}
      </div>
      <a
        {...link}
        aria-label={`Open ${item.name}`}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground md:hidden"
      >
        <ExternalLinkIcon className="size-5" />
      </a>
      <a {...link} className={buttonVariants({ variant: "outline", size: "sm", className: "hidden px-6 md:inline-flex" })}>
        Open
      </a>
    </div>
  )
}
