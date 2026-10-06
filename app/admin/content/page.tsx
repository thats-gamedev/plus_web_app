import type { Metadata } from "next"
import { ComingInPhase, PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Content" }

export default function ContentPage() {
  return (
    <>
      <PageHeader title="Content" />
      <ComingInPhase phase={8}>Lists, e-books and guides, plus the drag-and-drop list editor.</ComingInPhase>
    </>
  )
}
