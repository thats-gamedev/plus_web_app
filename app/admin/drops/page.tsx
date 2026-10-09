import type { Metadata } from "next"
import Link from "next/link"
import { cn } from "cn"
import { DropEditor } from "@/components/admin/drop-editor"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createDrop } from "@/app/admin/drops/actions"
import { type DropState, dropState, utcToZoned } from "@/lib/admin/drops"
import { getAdminContent, getAdminDrops } from "@/lib/dal/admin-content"
import { TIME_ZONE } from "@/lib/format"

export const metadata: Metadata = { title: "Drops" }

const stateBadges: Record<DropState, { label: string; variant: "muted" | "info" | "success" }> = {
  planned: { label: "Planned", variant: "muted" },
  published: { label: "Published", variant: "info" },
  announced: { label: "Announced", variant: "success" },
}

const filters = ["all", "planned", "published", "announced"] as const
type Filter = (typeof filters)[number]

// Drops (AW7): the selected drop on the left (?drop=), all drops on the right.
export default async function DropsPage({ searchParams }: PageProps<"/admin/drops">) {
  const params = await searchParams
  const filter: Filter = filters.includes(params.state as Filter) ? (params.state as Filter) : "all"
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : ""
  const [drops, content] = await Promise.all([getAdminDrops(), getAdminContent()])
  const now = new Date()

  const withState = drops.map((d) => ({ ...d, state: dropState(d, now) }))
  const upcoming = withState.filter((d) => d.state === "planned").reverse()
  const nextUp = upcoming[0] ?? null
  const selected = withState.find((d) => d.id === params.drop) ?? nextUp ?? withState[0] ?? null

  const visible = withState.filter(
    (d) => (filter === "all" || d.state === filter) && (!query || d.title.toLowerCase().includes(query) || d.month.includes(query))
  )
  const href = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams()
    const merged = { drop: selected?.id ?? null, state: filter === "all" ? null : filter, q: query || null, ...patch }
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v)
    return `/admin/drops${next.size ? `?${next}` : ""}`
  }

  const goesLive = (d: typeof selected) => {
    if (!d || d.state !== "planned" || !d.publishedAt) return null
    const { date, time } = utcToZoned(d.publishedAt)
    const days = Math.ceil((Date.parse(d.publishedAt) - now.getTime()) / 86_400_000)
    const label = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: TIME_ZONE })
    return `${d.id === nextUp?.id ? "Next up · " : ""}goes live ${label} at ${time} · in ${days} ${days === 1 ? "day" : "days"}`
  }

  return (
    <>
      <PageHeader
        title="Drops"
        actions={
          <form action={createDrop}>
            <Button type="submit" size="sm">
              New drop
            </Button>
          </form>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          {selected ? (
            <DropEditor
              key={selected.id}
              drop={selected}
              state={selected.state}
              goesLiveLabel={goesLive(selected)}
              attachable={content
                .filter((r) => !selected.resources.some((s) => s.id === r.id))
                .map(({ id, title, type, listKind, status, dropMonth }) => ({ id, title, type, listKind, status, dropMonth }))}
            />
          ) : (
            <p className="rounded-card border border-border bg-card p-6 text-muted-foreground">No drops yet. Create the first one.</p>
          )}
        </div>

        <div className="space-y-4">
          <form action="/admin/drops" role="search">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search drops"
              aria-label="Search drops"
              className="h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm"
            />
            {filter !== "all" && <input type="hidden" name="state" value={filter} />}
          </form>
          <nav aria-label="Status" className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <Link
                key={f}
                href={href({ state: f === "all" ? null : f })}
                aria-current={filter === f ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-3.5 text-sm font-medium",
                  filter === f ? "border-ink bg-ink text-white" : "border-input bg-card hover:border-ink"
                )}
              >
                {f === "all" ? "All" : stateBadges[f].label}
              </Link>
            ))}
          </nav>

          {(["planned", "past"] as const).map((group) => {
            const items = visible.filter((d) => (group === "planned" ? d.state === "planned" : d.state !== "planned"))
            const ordered = group === "planned" ? [...items].reverse() : items
            if (ordered.length === 0) return null
            return (
              <section key={group} aria-label={group === "planned" ? "Upcoming" : "Live and past"}>
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{group === "planned" ? "Upcoming" : "Live & past"}</h2>
                <ul className="space-y-2">
                  {ordered.map((d) => (
                    <li key={d.id}>
                      <Link
                        href={href({ drop: d.id })}
                        aria-current={d.id === selected?.id ? "true" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-card border bg-card px-4 py-3 transition-colors",
                          d.id === selected?.id ? "border-2 border-ink shadow-[0_3px_0_var(--ink)]" : "border-border hover:border-ink/30"
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                            {d.month.slice(0, 7)}
                            {d.id === nextUp?.id && <Badge variant="new">Next up</Badge>}
                          </span>
                          <span className="block truncate font-semibold">{d.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {d.resources.length} {d.resources.length === 1 ? "item" : "items"}
                          </span>
                        </span>
                        <Badge variant={stateBadges[d.state].variant} className={d.state === "planned" ? "text-foreground" : undefined}>
                          {stateBadges[d.state].label}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </div>
    </>
  )
}
