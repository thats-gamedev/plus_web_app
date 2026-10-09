"use client"

import { useMemo } from "react"
import { AssetsList } from "@/components/lists/assets-list"
import { CreatorsList } from "@/components/lists/creators-list"
import { PromptsList } from "@/components/lists/prompts-list"
import { ToolsList } from "@/components/lists/tools-list"
import { Banner } from "@/components/ui/banner"
import { filterSections } from "@/lib/lists/display"
import { type ListDocument, listDocumentSchema, type ListSection } from "@/lib/lists/schema"

/**
 * "Member preview" and "Teaser view" (spec): the draft rendered with the
 * same components members see. The teaser keeps only items marked Teaser,
 * which is what logged-out visitors get on the public list page.
 */
export function ListPreview({ doc, teaser }: { doc: ListDocument; teaser: boolean }) {
  const parsed = useMemo(() => listDocumentSchema.safeParse(doc), [doc])
  // Fixed per mount so "New" badges don't flicker while editing.
  const now = useMemo(() => new Date().toISOString(), [])

  if (!parsed.success) {
    return (
      <Banner variant="warning" title="Fix the errors to see the preview.">
        The preview uses the member components, which need a complete list.
      </Banner>
    )
  }

  const shown = teaser
    ? ({ ...parsed.data, sections: filterSections(parsed.data.sections as ListSection[], (item) => item.isTeaser) } as ListDocument)
    : parsed.data

  if (teaser && shown.sections.length === 0) {
    return <p className="rounded-card border border-border bg-card p-6 text-muted-foreground">No item is marked as Teaser yet.</p>
  }

  return (
    <div className="rounded-card border border-dashed border-border bg-background p-4 md:p-6">
      {teaser && (
        <p className="mb-4 text-sm text-muted-foreground">
          Logged-out visitors see these items on the public list page; the rest is locked.
        </p>
      )}
      {shown.kind === "tools" && <ToolsList doc={shown} now={now} />}
      {shown.kind === "assets" && <AssetsList doc={shown} now={now} />}
      {shown.kind === "creators" && <CreatorsList doc={shown} now={now} />}
      {shown.kind === "prompts" && <PromptsList doc={shown} now={now} />}
    </div>
  )
}
