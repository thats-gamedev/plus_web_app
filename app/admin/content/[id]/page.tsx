import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DocumentEditor } from "@/components/admin/document-editor"
import { ListEditor } from "@/components/admin/list-editor/list-editor"
import { newListId } from "@/lib/content/slug"
import { getDropOptions, getEditableResource } from "@/lib/dal/admin-content"
import { emptyListDocument, type ListDocument } from "@/lib/lists/schema"

export const metadata: Metadata = { title: "Edit content" }

export default async function EditContentPage({ params }: PageProps<"/admin/content/[id]">) {
  const { id } = await params
  const [resource, drops] = await Promise.all([getEditableResource(id), getDropOptions()])
  if (!resource) notFound()

  if (resource.type === "list" && resource.listKind) {
    // Edit the draft if there is one, otherwise start from the live version.
    const doc = (resource.draftContent ?? resource.content ?? emptyListDocument(resource.listKind, newListId("sec"))) as ListDocument
    return (
      <>
        <h1 className="sr-only">Edit {resource.title}</h1>
        <ListEditor
          resourceId={resource.id}
          slug={resource.slug}
          status={resource.status}
          settings={{ title: resource.title, slug: resource.slug, category: resource.category, coverPath: resource.coverPath }}
          doc={doc}
          draftToken={resource.draftUpdatedAt}
          dropId={resource.dropId}
          drops={drops}
        />
      </>
    )
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-muted-foreground">
        <Link href="/admin/content" className="hover:text-foreground">
          Content
        </Link>{" "}
        /
      </nav>
      <h1 className="mb-6 text-3xl font-bold">{resource.title}</h1>
      <DocumentEditor resource={resource} drops={drops} />
    </>
  )
}
