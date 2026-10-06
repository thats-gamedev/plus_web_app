import type { Metadata } from "next"
import { ComingInPhase, PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Library" }

export default function LibraryPage() {
  return (
    <>
      <PageHeader title="Library" />
      <ComingInPhase phase={5}>Search, filters and the full resource grid.</ComingInPhase>
    </>
  )
}
