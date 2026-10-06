import type { Metadata } from "next"
import { ComingInPhase, PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Drops" }

export default function DropsPage() {
  return (
    <>
      <PageHeader title="Drops" />
      <ComingInPhase phase={8}>Monthly drops and the announcement email.</ComingInPhase>
    </>
  )
}
