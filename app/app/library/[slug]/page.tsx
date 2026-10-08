import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { AssetsList } from "@/components/lists/assets-list"
import { CreatorsList } from "@/components/lists/creators-list"
import { EbookDetail, GuideDetail } from "@/components/lists/document-detail"
import { PromptsList } from "@/components/lists/prompts-list"
import { ListHeader } from "@/components/lists/resource-header"
import { ToolsList } from "@/components/lists/tools-list"
import { Banner } from "@/components/ui/banner"
import { Skeleton } from "@/components/ui/skeleton"
import { resourceSize } from "@/lib/content/resources"
import { requirePlus } from "@/lib/dal/auth"
import { getResourceBySlug, type ResourceDetail } from "@/lib/dal/content"
import { listDocumentSchema } from "@/lib/lists/schema"

// Titles stay generic: the resource is members-only, and metadata would
// need the session before the static shell can render.
export const metadata: Metadata = { title: "Library" }

export default function ResourcePage({ params, searchParams }: PageProps<"/app/library/[slug]">) {
  return (
    <Suspense fallback={<ResourceSkeleton />}>
      <Resource params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function Resource({ params, searchParams }: PageProps<"/app/library/[slug]">) {
  await requirePlus()
  const { slug } = await params
  const resource = await getResourceBySlug(slug)
  if (!resource) notFound()

  if (resource.type === "ebook") {
    const { download } = await searchParams
    return <EbookDetail resource={resource} downloadFailed={download === "failed"} />
  }
  if (resource.type === "guide") return <GuideDetail resource={resource} />
  return <ListResource resource={resource} />
}

function ListResource({ resource }: { resource: ResourceDetail }) {
  // Zod validated the document when it was saved; parse again so a bad row
  // shows a message instead of crashing the renderer.
  const parsed = listDocumentSchema.safeParse(resource.content)
  // A timestamp, not a Date: the renderers are Client Components.
  const now = new Date().toISOString()

  let body: React.ReactNode
  if (!parsed.success || parsed.data.kind !== resource.listKind) {
    console.error("Invalid list document", { slug: resource.slug, issues: parsed.error?.issues })
    body = (
      <Banner variant="warning" title="This list can't be shown right now.">
        Try again later, or browse the rest of the library.
      </Banner>
    )
  } else {
    const doc = parsed.data
    switch (doc.kind) {
      case "tools":
        body = <ToolsList doc={doc} now={now} />
        break
      case "assets":
        body = <AssetsList doc={doc} now={now} />
        break
      case "creators":
        body = <CreatorsList doc={doc} now={now} />
        break
      case "prompts":
        body = <PromptsList doc={doc} now={now} />
        break
    }
  }

  return (
    <>
      <ListHeader resource={resource} size={resourceSize(resource)} />
      {body}
    </>
  )
}

function ResourceSkeleton() {
  return (
    <div aria-hidden className="space-y-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="mt-6 h-64 w-full rounded-card" />
    </div>
  )
}
