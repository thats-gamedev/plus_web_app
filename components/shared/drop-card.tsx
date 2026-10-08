import Link from "next/link"
import { ArrowRightIcon, ChevronRightIcon } from "lucide-react"
import Markdown from "react-markdown"
import { ResourceIcon } from "@/components/shared/resource-icon"
import { DarkPanel, Eyebrow, Meta } from "@/components/ui/typography"
import { resourceMeta } from "@/lib/content/resources"
import type { Drop } from "@/lib/dal/content"

/** "October" for a drop month such as "2026-10-01". */
export function dropMonthName(month: string) {
  return new Date(`${month}T00:00:00Z`).toLocaleString("en-US", { month: "long", timeZone: "UTC" })
}

// Dark "This month" card on the member home (MW1 / MM1). Desktop shows the
// intro next to the resources; mobile keeps the theme and a compact list.
export function DropCard({ drop }: { drop: Drop }) {
  const theme = drop.theme ?? drop.title

  return (
    <DarkPanel className="grid gap-6 p-5 md:p-8 lg:grid-cols-2 lg:gap-10">
      <div>
        <Eyebrow>This month</Eyebrow>
        <h2 className="mt-3 text-2xl font-bold md:text-4xl">
          <span className="hidden md:inline">
            {dropMonthName(drop.month)}:
            <br />
          </span>
          {theme}
        </h2>
        {drop.introMd && (
          <div className="mt-4 hidden max-w-prose text-ink-muted md:block [&_a]:text-white [&_a]:underline [&_strong]:font-semibold [&_strong]:text-white">
            <Markdown allowedElements={["p", "strong", "em", "a"]} unwrapDisallowed>
              {drop.introMd}
            </Markdown>
          </div>
        )}
      </div>

      {drop.resources.length > 0 ? (
        <ul className="divide-y divide-ink-border md:space-y-3 md:divide-y-0">
          {drop.resources.map((resource) => (
            <li key={resource.id}>
              <Link
                href={`/app/library/${resource.slug}`}
                className="group flex items-center gap-3 py-3.5 md:gap-4 md:rounded-2xl md:border md:border-ink-border md:bg-ink-2 md:px-4 md:py-4 md:transition-colors md:hover:border-ink-muted"
              >
                <span className="flex shrink-0 items-center justify-center text-brand md:size-11 md:rounded-xl md:bg-ink-border/60">
                  <ResourceIcon type={resource.type} listKind={resource.listKind} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{resource.title}</span>
                  <Meta className="mt-0.5 hidden text-ink-muted md:block">{resourceMeta(resource)}</Meta>
                </span>
                <ChevronRightIcon aria-hidden className="size-4 text-ink-muted md:hidden" />
                <ArrowRightIcon
                  aria-hidden
                  className="hidden size-4 text-ink-muted transition-transform group-hover:translate-x-0.5 md:block"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="self-center text-ink-muted">The first resources of this drop go live soon.</p>
      )}
    </DarkPanel>
  )
}

/** Before the first drop goes live: "Your first drop arrives on [date]". */
export function FirstDropCard({ arrivesOn }: { arrivesOn: string }) {
  return (
    <DarkPanel className="p-5 md:p-8">
      <Eyebrow>This month</Eyebrow>
      <h2 className="mt-3 text-2xl font-bold md:text-4xl">Your first drop arrives on {arrivesOn}.</h2>
      <p className="mt-3 max-w-prose text-ink-muted">
        Each month brings a themed set of lists, prompts and guides. Until then, the library is open.
      </p>
    </DarkPanel>
  )
}
