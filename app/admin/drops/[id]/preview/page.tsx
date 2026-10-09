import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DropCard } from "@/components/shared/drop-card"
import { Banner } from "@/components/ui/banner"
import { requireAdmin } from "@/lib/dal/auth"
import type { Drop } from "@/lib/dal/content"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata: Metadata = { title: "Drop preview" }

// "Preview as member" (AW7): the drop card exactly as the member home will
// show it, including content that isn't published yet (marked below).
export default async function DropPreviewPage({ params }: PageProps<"/admin/drops/[id]/preview">) {
  await requireAdmin()
  const { id } = await params
  const { data } = await createAdminClient()
    .from("drops")
    .select(
      "id, month, title, theme, intro_md, resources (id, slug, title, summary, type, list_kind, category, cover_path, item_count, word_count, published_at, status, drop_position)"
    )
    .eq("id", id)
    .maybeSingle()
  if (!data) notFound()

  const drafts = data.resources.filter((r) => r.status !== "published")
  const drop: Drop = {
    id: data.id,
    month: data.month,
    title: data.title,
    theme: data.theme,
    introMd: data.intro_md,
    resources: data.resources
      // The member card's order: position, then publish date and title.
      .sort(
        (a, b) =>
          (a.drop_position ?? Infinity) - (b.drop_position ?? Infinity) ||
          (a.published_at ?? "").localeCompare(b.published_at ?? "") ||
          a.title.localeCompare(b.title)
      )
      .map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        summary: r.summary,
        type: r.type,
        listKind: r.list_kind,
        category: r.category,
        coverPath: r.cover_path,
        itemCount: r.item_count,
        wordCount: r.word_count,
        publishedAt: r.published_at,
      })),
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <p className="text-sm">
        <Link href={`/admin/drops?drop=${data.id}`} className="font-semibold text-brand hover:underline">
          Back to the drop
        </Link>
      </p>
      {drafts.length > 0 && (
        <Banner variant="warning" title={`${drafts.length} ${drafts.length === 1 ? "item is" : "items are"} still a draft`}>
          Members won&apos;t see {drafts.map((d) => `“${d.title}”`).join(", ")} until you publish {drafts.length === 1 ? "it" : "them"}.
        </Banner>
      )}
      <DropCard drop={drop} />
    </div>
  )
}
