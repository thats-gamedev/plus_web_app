"use client"

import { useMemo, useState } from "react"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { externalLinkProps, FilterChips, ItemImage } from "@/components/lists/list-parts"
import {
  assetEngines,
  type Engine,
  engineLabels,
  filterSections,
  formatPrice,
  licenseLabels,
} from "@/lib/lists/display"
import { type AssetItem, isNewItem, type ListDocumentOf } from "@/lib/lists/schema"

// Placeholder previews cycle through the pastels, as in MW6.
const pastels = ["bg-pastel-mint", "bg-pastel-sky", "bg-pastel-grey", "bg-pastel-cream"]

// Assets list (MW6 / MM7): engine chips, then preview cards (rows on mobile).
export function AssetsList({ doc, now }: { doc: ListDocumentOf<"assets">; now: string }) {
  const [engine, setEngine] = useState<Engine | null>(null)
  const engines = useMemo(() => assetEngines(doc), [doc])
  const sections = filterSections(doc.sections, engine ? (item) => item.engines?.includes(engine) ?? false : null)
  const showTitles = doc.sections.length > 1
  // Tones follow the full list, so a card keeps its colour when filtered.
  const tones = useMemo(
    () => new Map(doc.sections.flatMap((s) => s.items).map((item, i) => [item.id, pastels[i % pastels.length]])),
    [doc]
  )

  return (
    <>
      {doc.intro && <p className="mb-6 max-w-prose text-muted-foreground">{doc.intro}</p>}
      <FilterChips values={engines} value={engine} onChange={setEngine} format={(e) => engineLabels[e]} />

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.id} aria-label={section.title}>
            {showTitles && <h2 className="mb-3 text-xl font-bold md:text-2xl">{section.title}</h2>}
            <ul className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
              {section.items.map((item) => (
                <li key={item.id}>
                  <AssetCard item={item} tone={tones.get(item.id) ?? pastels[0]} isNew={isNewItem(item.addedAt, new Date(now))} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}

function AssetCard({ item, tone, isNew }: { item: AssetItem; tone: string; isNew: boolean }) {
  const link = externalLinkProps(item.url, item.isAffiliate)
  const price = formatPrice(item.price)
  const meta = [item.source, ...(item.engines ?? []).map((e) => engineLabels[e]), ...(item.formats ?? [])]
  const badges = (
    <>
      <Badge variant="muted" className="text-foreground">
        {licenseLabels[item.license]}
      </Badge>
      {item.isAffiliate && <Badge variant="affiliate">Affiliate</Badge>}
      {isNew && <Badge variant="new">New</Badge>}
    </>
  )

  return (
    <article className="relative flex h-full gap-3 rounded-card border border-border bg-card p-3 md:flex-col md:gap-0 md:overflow-hidden md:p-0">
      <ItemImage
        path={item.imagePath}
        sizes="(min-width: 768px) 33vw, 80px"
        className={cn("h-20 w-24 md:h-44 md:w-full md:rounded-none", tone)}
      />
      <div className="flex min-w-0 flex-1 flex-col md:p-4">
        <div className="hidden flex-wrap gap-1.5 md:flex">{badges}</div>
        <div className="flex items-start justify-between gap-2 md:mt-2">
          <h3 className="leading-snug font-semibold md:text-base">
            {/* The whole card opens the asset on mobile. */}
            <a {...link} className="after:absolute after:inset-0 md:after:hidden">
              {item.name}
            </a>
          </h3>
          <span className="shrink-0 font-mono font-semibold md:hidden">{price}</span>
        </div>
        <p className="mt-1.5 hidden text-sm text-muted-foreground md:block">{item.why}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground md:mt-2">{meta.join(" · ")}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5 md:hidden">
          {item.isAffiliate && <Badge variant="affiliate">Affiliate</Badge>}
          {isNew && <Badge variant="new">New</Badge>}
        </div>
        <div className="mt-auto hidden items-center justify-between pt-4 md:flex">
          <span className="font-mono text-base font-semibold">{price}</span>
          <a {...link} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Open
          </a>
        </div>
      </div>
    </article>
  )
}
