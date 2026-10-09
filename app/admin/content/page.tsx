import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { cn } from "cn"
import { NewResourceDialog } from "@/components/admin/new-resource-dialog"
import { PageHeader } from "@/components/layout/page-header"
import { ResourceIcon } from "@/components/shared/resource-icon"
import { Badge } from "@/components/ui/badge"
import { shortAge } from "@/lib/admin/metrics"
import { coverUrl } from "@/lib/content/covers"
import { categoryLabels, categoryTones, resourceTypeLabel } from "@/lib/content/resources"
import { getAdminContent } from "@/lib/dal/admin-content"

export const metadata: Metadata = { title: "Content" }

const filters = [
  { value: "all", label: "All" },
  { value: "list", label: "Lists" },
  { value: "ebook", label: "E-books" },
  { value: "guide", label: "Guides" },
  { value: "draft", label: "Drafts" },
] as const
type Filter = (typeof filters)[number]["value"]

const toneClasses = { mint: "bg-pastel-mint", sky: "bg-pastel-sky", cream: "bg-pastel-cream", grey: "bg-pastel-grey" } as const

// Content (AW5): every list, e-book and guide, drafts included.
export default async function ContentPage({ searchParams }: PageProps<"/admin/content">) {
  const { filter: raw } = await searchParams
  const filter: Filter = filters.some((f) => f.value === raw) ? (raw as Filter) : "all"
  const all = await getAdminContent()
  const rows = all.filter((r) =>
    filter === "all" ? true : filter === "draft" ? r.status === "draft" || r.hasDraft : r.type === filter
  )
  const now = new Date()

  return (
    <>
      <PageHeader
        title={
          <>
            Content <span className="text-lg font-normal text-muted-foreground">{all.length}</span>
          </>
        }
        actions={
          <>
            <NewResourceDialog mode="document" />
            <NewResourceDialog mode="list" />
          </>
        }
      />

      <nav aria-label="Filter" className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/content" : `/admin/content?filter=${f.value}`}
            aria-current={filter === f.value ? "page" : undefined}
            className={cn(
              "inline-flex h-8 items-center rounded-full border px-3.5 text-sm font-medium",
              filter === f.value ? "border-ink bg-ink text-white" : "border-input bg-card hover:border-ink"
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="rounded-card border border-border bg-card p-6 text-muted-foreground">Nothing here yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="py-3 pl-5 font-medium">
                  <span className="sr-only">Cover</span>
                </th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Kind</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Drop</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="py-2.5 pl-5">
                    <div className={cn("relative flex size-10 items-center justify-center overflow-hidden rounded-lg text-ink/60", toneClasses[categoryTones[r.category]])}>
                      {r.coverPath ? (
                        <Image src={coverUrl(r.coverPath)} alt="" fill sizes="40px" className="object-cover" />
                      ) : (
                        <ResourceIcon type={r.type} listKind={r.listKind} className="size-4" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/content/${r.id}`} className="font-semibold hover:underline">
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{resourceTypeLabel(r)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{categoryLabels[r.category]}</td>
                  <td className="px-4 py-2.5">
                    {r.status === "draft" ? (
                      <Badge variant="muted" className="text-foreground">Draft</Badge>
                    ) : r.hasDraft ? (
                      <Badge variant="warning">Published · draft</Badge>
                    ) : (
                      <Badge variant="success">Published</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {r.dropMonth ? new Date(`${r.dropMonth}T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" }) : "–"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{shortAge(r.updatedAt, now)} ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
