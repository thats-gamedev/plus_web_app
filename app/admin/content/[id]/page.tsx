import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DocumentEditor } from "@/components/admin/document-editor"
import { ComingInPhase } from "@/components/layout/page-header"
import { getDropOptions, getEditableResource } from "@/lib/dal/admin-content"

export const metadata: Metadata = { title: "Edit content" }

export default async function EditContentPage({ params }: PageProps<"/admin/content/[id]">) {
  const { id } = await params
  const [resource, drops] = await Promise.all([getEditableResource(id), getDropOptions()])
  if (!resource) notFound()

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-muted-foreground">
        <Link href="/admin/content" className="hover:text-foreground">
          Content
        </Link>{" "}
        /
      </nav>
      <h1 className="mb-6 text-3xl font-bold">{resource.title}</h1>
      {resource.type === "list" ? (
        <ComingInPhase phase={8}>The list editor arrives in the next step.</ComingInPhase>
      ) : (
        <DocumentEditor resource={resource} drops={drops} />
      )}
    </>
  )
}
